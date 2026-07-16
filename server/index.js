cat > index.js << 'EOF'
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Bonjour } = require('bonjour-service');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/files', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

let activeUsers = new Map();
let db;

// متغيرات بث راديو الـ DJ
let currentBroadcaster = null;

function initDatabase() {
    const adapter = new FileSync(path.join(__dirname, 'database.json'));
    db = low(adapter);
    db.defaults({
        posts: [],
        private_messages: []
    }).write();
    console.log('💾 قاعدة البيانات جاهزة ومحدثة بجداول الرسائل الخاصة!');
}

// مسار لرفع الملفات
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار أي ملف' });
    const fileUrl = `http://${req.hostname}:4000/files/${req.file.filename}`;

    io.emit('message', {
        id: Date.now().toString(),
        sender: "النظام 🌐",
        text: `تمت مشاركة ملف جديد: ${req.file.originalname}\nرابط التحميل: ${fileUrl}`,
        time: new Date().toISOString()
    });
    res.status(200).json({ success: true, url: fileUrl });
});

// === لوحة تحكم الويب التفاعلية (Dashboard) ===
app.get('/', (req, res) => {
    const postsCount = db.get('posts').size().value() || 0;
    const pmCount = db.get('private_messages').size().value() || 0;
    const usersArray = Array.from(activeUsers.values());

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RabahDj - لوحة تحكم السيرفر</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
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
            .container {
                max-width: 1000px;
                width: 100%;
            }
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
            .card:hover {
                transform: translateY(-5px);
            }
            .card h3 { margin: 0 0 10px 0; color: #94a3b8; font-size: 16px; }
            .card p { margin: 0; font-size: 32px; font-weight: bold; color: #3b82f6; }
            .section {
                background-color: #161c2a;
                padding: 20px;
                border-radius: 15px;
                border: 1px solid #1e293b;
                margin-bottom: 20px;
            }
            .section h2 { margin-top: 0; font-size: 20px; border-bottom: 2px solid #1e293b; padding-bottom: 10px; color: #3b82f6;}
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
        </style>
        <script src="/socket.io/socket.io.js"></script>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>🎙️ لوحة تحكم RabahDj الخارقة</h1>
                <span class="badge">نشط الآن 📡</span>
            </header>
            
            <div class="grid">
                <div class="card">
                    <h3>المتصلون بالشبكة</h3>
                    <p id="users-count">${usersArray.length}</p>
                </div>
                <div class="card">
                    <h3>المنشورات في الحائط</h3>
                    <p id="posts-count">${postsCount}</p>
                </div>
                <div class="card">
                    <h3>الرسائل الخاصة المتبادلة</h3>
                    <p>${pmCount}</p>
                </div>
                <div class="card">
                    <h3>راديو البث الحي</h3>
                    <p id="radio-status" style="font-size: 20px; margin-top: 10px; color: #ef4444;">مغلق 💤</p>
                </div>
            </div>

            <div class="section">
                <h2>📱 المتصلون حالياً بالواي فاي:</h2>
                <ul id="users-list">
                    ${usersArray.map(u => `<li><span><span class="user-dot"></span>${u}</span> <span style="color:#94a3b8;">هاتف متصل</span></li>`).join('')}
                </ul>
            </div>
        </div>

        <script>
            const socket = io();
            socket.on('users_list', (users) => {
                document.getElementById('users-count').innerText = users.length;
                const list = document.getElementById('users-list');
                list.innerHTML = users.map(u => '<li><span><span class="user-dot"></span>' + u + '</span> <span style="color:#94a3b8;">هاتف متصل</span></li>').join('');
            });
            socket.on('new_post', () => {
                const countEl = document.getElementById('posts-count');
                countEl.innerText = parseInt(countEl.innerText) + 1;
            });
            socket.on('radio_state_change', (data) => {
                const statusEl = document.getElementById('radio-status');
                if(data.active) {
                    statusEl.innerText = "🔴 يبث الآن حي!";
                    statusEl.style.color = "#10b981";
                } else {
                    statusEl.innerText = "مغلق 💤";
                    statusEl.style.color = "#ef4444";
                }
            });
        </script>
    </body>
    </html>
    `);
});

io.on('connection', async (socket) => {
    console.log(`جهاز جديد اتصل: ${socket.id}`);

    socket.on('join', (data) => {
        activeUsers.set(socket.id, data.username);
        updateUsersList();
        try {
            const savedPosts = db.get('posts').slice().reverse().value();
            socket.emit('initial_feed', savedPosts);
        } catch (err) { console.error(err); }
        
        // إبلاغ المستخدم الجديد بحالة الراديو الحالية
        if (currentBroadcaster) {
            socket.emit('radio_state_change', { active: true, broadcaster: currentBroadcaster.username });
        }
    });

    socket.on('create_post', (postData) => {
        try {
            db.get('posts').push({
                id: postData.id,
                author: postData.author,
                avatar: postData.avatar,
                content: postData.content,
                image: postData.image,
                likes: postData.likes || 0,
                time: postData.time
            }).write();
            io.emit('new_post', postData);
        } catch (err) { console.error(err); }
    });

    socket.on('like_post', (data) => {
        try {
            const post = db.get('posts').find({ id: data.postId });
            if (post.value()) {
                post.update('likes', n => n + 1).write();
                const updatedPost = post.value();
                io.emit('post_liked', { postId: data.postId, likesCount: updatedPost.likes });
            }
        } catch (err) { console.error(err); }
    });

    socket.on('get_private_history', (data) => {
        try {
            const history = db.get('private_messages')
                .filter(m =>
                    (m.sender === data.me && m.receiver === data.other) ||
                    (m.sender === data.other && m.receiver === data.me)
                )
                .sortBy('time')
                .value();
            socket.emit('private_history', { other: data.other, messages: history });
        } catch (err) { console.error(err); }
    });

    socket.on('send_private_message', (msgData) => {
        try {
            db.get('private_messages').push({
                id: msgData.id,
                sender: msgData.sender,
                receiver: msgData.receiver,
                text: msgData.text,
                time: msgData.time
            }).write();

            for (let [socketId, username] of activeUsers.entries()) {
                if (username === msgData.receiver || username === msgData.sender) {
                    io.to(socketId).emit('new_private_message', msgData);
                }
            }
        } catch (err) { console.error(err); }
    });

    // === منطق البث الصوتي لراديو الـ DJ ===
    socket.on('start_broadcast', () => {
        const username = activeUsers.get(socket.id) || "الـ DJ رابح";
        currentBroadcaster = { id: socket.id, username: username };
        io.emit('radio_state_change', { active: true, broadcaster: username });
        console.log(`🎙️ بدأت جلسة راديو حية بواسطة: ${username}`);
    });

    socket.on('audio_chunk', (chunk) => {
        // إعادة إرسال حزم الصوت لكل الهواتف المتصلة باستثناء الـ DJ الذي يرسلها
        socket.broadcast.emit('audio_stream', chunk);
    });

    socket.on('stop_broadcast', () => {
        if (currentBroadcaster && currentBroadcaster.id === socket.id) {
            currentBroadcaster = null;
            io.emit('radio_state_change', { active: false });
            console.log(`🔇 انتهت جلسة الراديو الحية.`);
        }
    });

    socket.on('disconnect', () => {
        const username = activeUsers.get(socket.id);
        if (username) {
            activeUsers.delete(socket.id);
            updateUsersList();
            console.log(`❌ ${username} غادر الشبكة`);
        }

        // إنهاء البث التلقائي إذا قطع اتصال الـ DJ
        if (currentBroadcaster && currentBroadcaster.id === socket.id) {
            currentBroadcaster = null;
            io.emit('radio_state_change', { active: false });
            console.log(`⚠️ قطع اتصال الـ DJ؛ تم إغلاق البث تلقائياً.`);
        }
    });
});

function updateUsersList() {
    const usersArray = Array.from(activeUsers.values());
    io.emit('users_list', usersArray);
}

function startServerBroadcast() {
    try {
        const bonjour = new Bonjour();
        bonjour.publish({
            name: 'RabahDj Local Server',
            type: 'rabahdj',
            protocol: 'tcp',
            port: 4000
        });
        console.log('📡 رادار الهواتف يمكنه التقاط السيرفر الآن دون IP!');
    } catch (error) { console.error(error); }
}

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`=============================================`);
    console.log(`🚀 سيرفر RabahDj المحلي المتكامل يعمل بنجاح!`);
    console.log(`=============================================`);
    initDatabase();
    startServerBroadcast();
});
EOF
