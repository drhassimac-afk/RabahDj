const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os'); // ✅ إضافة للحصول على IP الشبكة
const { Bonjour } = require('bonjour-service');

// ✅ إصلاح: استيراد lowdb بالطريقة الصحيحة (v1)
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// ========================================
// ✅ دالة الحصول على IP الشبكة المحلية
// ========================================
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const LOCAL_IP = getLocalIP();
const PORT = 4000;

// ========================================
// إعداد Express
// ========================================
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // ✅ حد للـ JSON
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // ✅ recursive لأمان أكثر
}
app.use('/files', express.static(uploadDir));

// ✅ مجلد الأفلام المحلية - حط ملفات الفيديو هنا يدوياً
const mediaDir = path.join(__dirname, 'media');
if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
}
app.use('/media', express.static(mediaDir));

// ✅ قائمة الأفلام المحلية المتاحة حالياً
app.get('/media-list', (req, res) => {
    try {
        const validExt = ['.mp4', '.mkv', '.mov', '.webm', '.avi', '.m4v'];
        const files = fs.readdirSync(mediaDir).filter((f) =>
            validExt.includes(path.extname(f).toLowerCase())
        );
        const movies = files.map((f) => ({
            id: f,
            title: path.basename(f, path.extname(f)),
            url: `http://${LOCAL_IP}:${PORT}/media/${encodeURIComponent(f)}`,
        }));
        res.json({ movies });
    } catch (err) {
        console.error('خطأ في قراءة مجلد الأفلام:', err);
        res.status(500).json({ error: 'تعذر قراءة مجلد الأفلام' });
    }
});

// ✅ إصلاح: تحديد حد لحجم الملفات (50MB)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, Date.now() + '-' + safeName);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // ✅ 50MB حد أقصى
});

// ========================================
// إعداد HTTP و Socket.io
// ========================================
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    maxHttpBufferSize: 50 * 1024 * 1024 // ✅ للسماح بإرسال صوت/صور كبيرة
});

// ========================================
// المتغيرات العامة
// ========================================
let activeUsers = new Map();
let db = null; // ✅ نبدأ بـ null ونتحقق منها

let currentBroadcaster = null;
let walkieSettings = { enabled: true, mutedUsers: [] };
let streamRooms = {}; // { roomName: { broadcasterId: null, viewers: Set() } }

// ========================================
// ✅ إصلاح: تهيئة قاعدة البيانات وإرجاع نتيجة
// ========================================
function initDatabase() {
    try {
        const adapter = new FileSync(path.join(__dirname, 'database.json'));
        db = low(adapter);
        db.defaults({
            posts: [],
            private_messages: []
        }).write();
        console.log('💾 قاعدة البيانات جاهزة!');
        return true;
    } catch (err) {
        console.error('❌ فشل تهيئة قاعدة البيانات:', err);
        return false;
    }
}

// ✅ دالة للتحقق من أن DB جاهزة قبل أي عملية
function isDbReady() {
    if (!db) {
        console.error('⚠️ قاعدة البيانات غير جاهزة بعد!');
        return false;
    }
    return true;
}

// ========================================
// دوال المستخدمين
// ========================================
function getOnlineUsersList() {
    return Array.from(activeUsers.entries()).map(([id, u]) => ({
        id,
        name: u.name,
        avatarColor: u.avatarColor,
    }));
}

function broadcastOnlineUsers() {
    io.emit('onlineUsers', getOnlineUsersList());
}

// ========================================
// مسار رفع الملفات
// ========================================
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'لم يتم اختيار أي ملف' });
    }

    // ✅ إصلاح: استخدام LOCAL_IP بدل req.hostname
    const fileUrl = `http://${LOCAL_IP}:${PORT}/files/${req.file.filename}`;

    io.emit('systemMessage', {
        id: Date.now().toString(),
        text: `تمت مشاركة ملف جديد: ${req.file.originalname}\nرابط التحميل: ${fileUrl}`,
        time: new Date().toISOString()
    });

    res.status(200).json({ success: true, url: fileUrl });
});

// ========================================
// لوحة تحكم الويب
// ========================================
app.get('/', (req, res) => {
    // ✅ إصلاح: التحقق من DB قبل القراءة
    const postsCount = isDbReady() ? db.get('posts').size().value() : 0;
    const pmCount = isDbReady() ? db.get('private_messages').size().value() : 0;
    const usersArray = getOnlineUsersList();

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RabahDj - لوحة تحكم السيرفر</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; }
            body {
                font-family: 'Cairo', sans-serif;
                background-color: #0b0f19;
                color: #e2e8f0;
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .container { max-width: 1000px; width: 100%; }
            header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #1e40af, #3b82f6);
                padding: 20px;
                border-radius: 15px;
                margin-bottom: 20px;
                box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
            }
            header h1 { margin: 0; font-size: 24px; font-weight: 900; }
            .badge {
                background: #10b981;
                color: #fff;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: bold;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            .card {
                background-color: #161c2a;
                padding: 20px;
                border-radius: 15px;
                border: 1px solid #1e293b;
                text-align: center;
                transition: transform 0.3s ease;
            }
            .card:hover { transform: translateY(-5px); }
            .card h3 { margin: 0 0 10px 0; color: #94a3b8; font-size: 16px; }
            .card p { margin: 0; font-size: 32px; font-weight: bold; color: #3b82f6; }
            .section {
                background-color: #161c2a;
                padding: 20px;
                border-radius: 15px;
                border: 1px solid #1e293b;
                margin-bottom: 20px;
            }
            .section h2 {
                margin-top: 0;
                font-size: 20px;
                border-bottom: 2px solid #1e293b;
                padding-bottom: 10px;
                color: #3b82f6;
            }
            .ip-box {
                background: #0f172a;
                border: 2px dashed #3b82f6;
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                margin-bottom: 20px;
                font-size: 20px;
                font-weight: bold;
                color: #10b981;
                letter-spacing: 2px;
            }
            ul { list-style: none; padding: 0; margin: 0; }
            li {
                padding: 12px;
                border-bottom: 1px solid #1e293b;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            li:last-child { border-bottom: none; }
            .user-dot {
                width: 10px;
                height: 10px;
                background-color: #10b981;
                border-radius: 50%;
                display: inline-block;
                margin-left: 10px;
            }
            .empty { color: #64748b; text-align: center; padding: 20px; }
        </style>
        <script src="/socket.io/socket.io.js"></script>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>🎙️ لوحة تحكم RabahDj</h1>
                <span class="badge">✅ نشط الآن</span>
            </header>

            <!-- ✅ إضافة: عرض IP واضح للمستخدمين -->
            <div class="ip-box">
                📡 عنوان السيرفر للاتصال: <span style="color:#3b82f6;">${LOCAL_IP}</span> : ${PORT}
            </div>

            <div class="grid">
                <div class="card">
                    <h3>المتصلون بالشبكة</h3>
                    <p id="users-count">${usersArray.length}</p>
                </div>
                <div class="card">
                    <h3>المنشورات</h3>
                    <p id="posts-count">${postsCount}</p>
                </div>
                <div class="card">
                    <h3>الرسائل الخاصة</h3>
                    <p>${pmCount}</p>
                </div>
                <div class="card">
                    <h3>راديو البث الحي</h3>
                    <p id="radio-status" style="font-size:20px; margin-top:10px; color:#ef4444;">
                        مغلق 💤
                    </p>
                </div>
            </div>

            <div class="section">
                <h2>📱 المتصلون حالياً:</h2>
                <ul id="users-list">
                    ${usersArray.length === 0
                        ? '<li class="empty">لا يوجد متصلون حالياً</li>'
                        : usersArray.map(u =>
                            `<li>
                                <span><span class="user-dot"></span>${u.name}</span>
                                <span style="color:#94a3b8;">متصل ✓</span>
                            </li>`
                          ).join('')
                    }
                </ul>
            </div>
        </div>

        <script>
            const socket = io();

            socket.on('onlineUsers', (users) => {
                document.getElementById('users-count').innerText = users.length;
                const list = document.getElementById('users-list');
                if (users.length === 0) {
                    list.innerHTML = '<li class="empty">لا يوجد متصلون حالياً</li>';
                } else {
                    list.innerHTML = users.map(u =>
                        '<li><span><span class="user-dot"></span>' + u.name +
                        '</span><span style="color:#94a3b8;">متصل ✓</span></li>'
                    ).join('');
                }
            });

            socket.on('postAdded', () => {
                const el = document.getElementById('posts-count');
                el.innerText = parseInt(el.innerText) + 1;
            });

            socket.on('radio_state_change', (data) => {
                const el = document.getElementById('radio-status');
                if (data.active) {
                    el.innerText = '🔴 يبث الآن: ' + (data.broadcaster || '');
                    el.style.color = '#10b981';
                } else {
                    el.innerText = 'مغلق 💤';
                    el.style.color = '#ef4444';
                }
            });
        </script>
    </body>
    </html>
    `);
});

// ========================================
// Socket.io - معالجة الاتصالات
// ========================================
io.on('connection', (socket) => {
    console.log(`🔌 جهاز جديد اتصل: ${socket.id}`);

    socket.on('join', (data) => {
        // ✅ إصلاح: التحقق من البيانات المدخلة
        if (!data || !data.name) {
            socket.emit('error', { message: 'يجب إدخال اسم صحيح' });
            return;
        }

        activeUsers.set(socket.id, {
            name: data.name.trim(),
            avatarColor: data.avatarColor || '#1877F2'
        });

        let savedPosts = [];
        if (isDbReady()) {
            try {
                savedPosts = db.get('posts').slice().reverse().value();
            } catch (err) {
                console.error('خطأ في جلب المنشورات:', err);
            }
        }

        socket.emit('init', {
            posts: savedPosts,
            userId: socket.id,
            onlineUsers: getOnlineUsersList(),
        });

        broadcastOnlineUsers();
        console.log(`✅ ${data.name} انضم للشبكة`);

        if (currentBroadcaster) {
            socket.emit('radio_state_change', {
                active: true,
                broadcaster: currentBroadcaster.username
            });
        }
        socket.emit('walkie_settings_update', walkieSettings);
    });

    // === نشر منشور جديد ===
    socket.on('newPost', (data) => {
        if (!isDbReady()) return;
        try {
            const user = activeUsers.get(socket.id);
            if (!user) return;

            // ✅ إصلاح: التحقق من أن النص أو الصورة أو الملف موجودون
            if (!data.text && !data.image && !data.file) {
                socket.emit('error', { message: 'المنشور لا يمكن أن يكون فارغاً' });
                return;
            }

            const post = {
                id: Date.now().toString(),
                author: {
                    name: user.name,
                    avatarColor: user.avatarColor,
                },
                authorName: user.name,
                avatarColor: user.avatarColor,
                text: data.text?.trim() || '',
                image: data.image || null,
                file: data.file || null,
                likes: [],
                comments: [],
                createdAt: new Date().toISOString(),
            };

            db.get('posts').push(post).write();
            io.emit('postAdded', post);
            console.log(`📝 منشور جديد من: ${user.name}`);
        } catch (err) {
            console.error('خطأ في newPost:', err);
        }
    });

    // === إعجاب/إلغاء إعجاب ===
    socket.on('toggleLike', (data) => {
        if (!isDbReady()) return;
        try {
            if (!data?.postId) return;

            const postRef = db.get('posts').find({ id: data.postId });
            const post = postRef.value();
            if (!post) return;

            const likes = [...(post.likes || [])];
            const idx = likes.indexOf(socket.id);

            if (idx === -1) {
                likes.push(socket.id);
            } else {
                likes.splice(idx, 1);
            }

            postRef.assign({ likes }).write();
            io.emit('postUpdated', postRef.value());
        } catch (err) {
            console.error('خطأ في toggleLike:', err);
        }
    });

    // === إضافة تعليق ===
    socket.on('newComment', (data) => {
        if (!isDbReady()) return;
        try {
            if (!data?.postId || !data?.text?.trim()) return;

            const user = activeUsers.get(socket.id);
            if (!user) return;

            const postRef = db.get('posts').find({ id: data.postId });
            const post = postRef.value();
            if (!post) return;

            const comments = [...(post.comments || [])];
            comments.push({
                id: Date.now().toString(),
                authorName: user.name,
                avatarColor: user.avatarColor, // ✅ إضافة لون الأفاتار للتعليق
                text: data.text.trim(),
                createdAt: new Date().toISOString(),
            });

            postRef.assign({ comments }).write();
            io.emit('postUpdated', postRef.value());
        } catch (err) {
            console.error('خطأ في newComment:', err);
        }
    });

    // === التالكي ووكي ===
    socket.on('walkie_audio', (data) => {
        const user = activeUsers.get(socket.id);
        if (!user) return;
        if (!walkieSettings.enabled) return;
        if (walkieSettings.mutedUsers.includes(user.name)) return;

        socket.broadcast.emit('walkie_audio_received', {
            sender: user.name,
            avatarColor: user.avatarColor,
            audioBase64: data.audioBase64,
            duration: data.duration,
        });
    });

    socket.on('admin_toggle_walkie', (data) => {
        walkieSettings.enabled = !!data.enabled;
        io.emit('walkie_settings_update', walkieSettings);
        console.log(`🎙️ التالكي ووكي: ${walkieSettings.enabled ? 'مفعّل' : 'معطّل'}`);
    });

    socket.on('admin_mute_user', (data) => {
        if (!data?.username) return;
        if (data.muted) {
            if (!walkieSettings.mutedUsers.includes(data.username)) {
                walkieSettings.mutedUsers.push(data.username);
            }
        } else {
            walkieSettings.mutedUsers = walkieSettings.mutedUsers.filter(
                u => u !== data.username
            );
        }
        io.emit('walkie_settings_update', walkieSettings);
    });

    // === الرسائل الخاصة ===
    socket.on('get_private_history', (data) => {
        if (!isDbReady()) return;
        try {
            if (!data?.me || !data?.other) return;

            const history = db.get('private_messages')
                .filter(m =>
                    (m.sender === data.me && m.receiver === data.other) ||
                    (m.sender === data.other && m.receiver === data.me)
                )
                .sortBy('time')
                .value();

            socket.emit('private_history', { other: data.other, messages: history });
        } catch (err) {
            console.error('خطأ في get_private_history:', err);
        }
    });

    socket.on('send_private_message', (msgData) => {
        if (!isDbReady()) return;
        try {
            // ✅ إصلاح: التحقق من البيانات
            if (!msgData?.sender || !msgData?.receiver || !msgData?.text?.trim()) return;

            const message = {
                id: msgData.id || Date.now().toString(),
                sender: msgData.sender,
                receiver: msgData.receiver,
                text: msgData.text.trim(),
                time: msgData.time || new Date().toISOString()
            };

            db.get('private_messages').push(message).write();

            // ✅ إرسال للمرسل والمستقبل فقط
            for (let [socketId, user] of activeUsers.entries()) {
                if (user.name === message.receiver || user.name === message.sender) {
                    io.to(socketId).emit('new_private_message', message);
                }
            }
        } catch (err) {
            console.error('خطأ في send_private_message:', err);
        }
    });

    // === راديو البث الحي ===
    socket.on('start_broadcast', () => {
        const user = activeUsers.get(socket.id);
        if (!user) return;

        // ✅ إصلاح: منع بث متعدد في نفس الوقت
        if (currentBroadcaster && currentBroadcaster.id !== socket.id) {
            socket.emit('broadcast_error', {
                message: `يوجد بث نشط بواسطة ${currentBroadcaster.username}`
            });
            return;
        }

        currentBroadcaster = { id: socket.id, username: user.name };
        io.emit('radio_state_change', { active: true, broadcaster: user.name });
        console.log(`🎙️ بدأ البث بواسطة: ${user.name}`);
    });

    socket.on('audio_chunk', (chunk) => {
        if (!currentBroadcaster || currentBroadcaster.id !== socket.id) return;
        socket.broadcast.emit('audio_stream', chunk);
    });

    socket.on('stop_broadcast', () => {
        if (currentBroadcaster && currentBroadcaster.id === socket.id) {
            const name = currentBroadcaster.username;
            currentBroadcaster = null;
            io.emit('radio_state_change', { active: false });
            console.log(`🔇 انتهى البث بواسطة: ${name}`);
        }
    });

    // ========================================
    // ✅ نظام البث المباشر (WebRTC Signaling)
    // ========================================
    socket.on('join-stream-room', (data) => {
        const room = data?.room;
        const role = data?.role; // 'broadcaster' أو 'viewer'
        if (!room) return;

        if (!streamRooms[room]) {
            streamRooms[room] = { broadcasterId: null, viewers: new Set() };
        }

        socket.join(room);

        if (role === 'broadcaster') {
            streamRooms[room].broadcasterId = socket.id;
            console.log(`📡 بدأ بث مباشر في غرفة: ${room}`);
            // إعلام المذيع بكل المشاهدين الموجودين مسبقاً بالغرفة
            streamRooms[room].viewers.forEach((viewerId) => {
                socket.emit('viewer-joined', { viewerId });
            });
        } else {
            streamRooms[room].viewers.add(socket.id);
            // إخبار المذيع بوجود مشاهد جديد ليبدأ اتصال WebRTC معه
            if (streamRooms[room].broadcasterId) {
                io.to(streamRooms[room].broadcasterId).emit('viewer-joined', {
                    viewerId: socket.id,
                });
            }
        }
    });

    socket.on('leave-stream-room', (data) => {
        const room = data?.room;
        if (!room || !streamRooms[room]) return;

        socket.leave(room);
        streamRooms[room].viewers.delete(socket.id);

        if (streamRooms[room].broadcasterId === socket.id) {
            io.to(room).emit('stream-ended');
            streamRooms[room].broadcasterId = null;
        }
    });

    // تمرير عروض/إجابات/مرشحات ICE بين طرفين محددين
    socket.on('webrtc-offer', (data) => {
        if (!data?.to) return;
        io.to(data.to).emit('webrtc-offer', { from: socket.id, offer: data.offer });
    });

    socket.on('webrtc-answer', (data) => {
        if (!data?.to) return;
        io.to(data.to).emit('webrtc-answer', { from: socket.id, answer: data.answer });
    });

    socket.on('webrtc-ice-candidate', (data) => {
        if (!data?.to) return;
        io.to(data.to).emit('webrtc-ice-candidate', { from: socket.id, candidate: data.candidate });
    });

    // === قطع الاتصال ===
    socket.on('disconnect', () => {
        const user = activeUsers.get(socket.id);
        if (user) {
            console.log(`❌ ${user.name} غادر الشبكة`);
            activeUsers.delete(socket.id);
            broadcastOnlineUsers();
        }

        if (currentBroadcaster && currentBroadcaster.id === socket.id) {
            currentBroadcaster = null;
            io.emit('radio_state_change', { active: false });
            console.log(`⚠️ انقطع اتصال الـ DJ، تم إيقاف البث`);
        }

        // ✅ تنظيف غرف البث المباشر عند قطع الاتصال
        Object.keys(streamRooms).forEach((room) => {
            const r = streamRooms[room];
            r.viewers.delete(socket.id);
            if (r.broadcasterId === socket.id) {
                io.to(room).emit('stream-ended');
                r.broadcasterId = null;
            }
        });
    });
});

// ========================================
// ✅ إصلاح: Bonjour بشكل آمن
// ========================================
function startServerBroadcast() {
    try {
        const bonjour = new Bonjour();
        bonjour.publish({
            name: 'RabahDj Local Server',
            type: 'rabahdj',
            protocol: 'tcp',
            port: PORT
        });
        console.log('📡 خدمة اكتشاف الشبكة (Bonjour) تعمل!');
    } catch (error) {
        console.warn('⚠️ Bonjour غير متاح على هذا الجهاز:', error.message);
    }
}

// ========================================
// ✅ إصلاح: ترتيب التشغيل الصحيح
// ========================================
const dbReady = initDatabase(); // 1️⃣ أولاً: تهيئة DB

server.listen(PORT, '0.0.0.0', () => { // 2️⃣ ثانياً: تشغيل السيرفر
    console.log('=============================================');
    console.log('🚀 سيرفر RabahDj يعمل بنجاح!');
    console.log(`📍 عنوان الشبكة: http://${LOCAL_IP}:${PORT}`);
    console.log(`🌐 لوحة التحكم:  http://${LOCAL_IP}:${PORT}`);
    console.log(`💾 قاعدة البيانات: ${dbReady ? '✅ جاهزة' : '❌ فشلت'}`);
    console.log('=============================================');
    startServerBroadcast(); // 3️⃣ ثالثاً: Bonjour
});
