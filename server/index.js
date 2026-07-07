const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Bonsoir = require('bonsoir');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// إعداد مجلد لرفع وحفظ الملفات المشتركة
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/files', express.static(uploadDir));

// إعداد أداة Multer لإدارة رفع الملفات بالاسم الأصلي
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// الذاكرة المؤقتة للمستخدمين المتصلين حالياً بالواي فاي (تحفظ معرف السوكت واسم المستخدم)
let activeUsers = new Map(); 
let db;

// تهيئة قاعدة بيانات SQLite وإنشاء الجداول
async function initDatabase() {
    db = await open({
        filename: path.join(__dirname, 'database.db'),
        driver: sqlite3.Database
    });

    // جدول المنشورات العامة
    await db.exec(`
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            author TEXT,
            avatar TEXT,
            content TEXT,
            image TEXT,
            likes INTEGER DEFAULT 0,
            time TEXT
        )
    `);

    // [جديد] جدول الرسائل الخاصة الثنائية
    await db.exec(`
        CREATE TABLE IF NOT EXISTS private_messages (
            id TEXT PRIMARY KEY,
            sender TEXT,
            receiver TEXT,
            text TEXT,
            time TEXT
        )
    `);
    console.log('💾 قاعدة البيانات جاهزة ومحدثة بجداول الرسائل الخاصة!');
}

// رابط HTTP لرفع الملفات
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

// إدارة اتصالات Socket.io
io.on('connection', async (socket) => {
    console.log(`جهاز جديد اتصل: ${socket.id}`);

    // انضمام مستخدم باسم محدد
    socket.on('join', async (data) => {
        activeUsers.set(socket.id, data.username);
        updateUsersList();
        
        // جلب المنشورات العامة المخزنة
        try {
            const savedPosts = await db.all('SELECT * FROM posts ORDER BY ROWID DESC');
            socket.emit('initial_feed', savedPosts);
        } catch (err) { console.error(err); }
    });

    // استقبال منشور عام وتوزيعه
    socket.on('create_post', async (postData) => {
        try {
            await db.run(
                'INSERT INTO posts (id, author, avatar, content, image, likes, time) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [postData.id, postData.author, postData.avatar, postData.content, postData.image, postData.likes || 0, postData.time]
            );
            io.emit('new_post', postData);
        } catch (err) { console.error(err); }
    });

    // استقبال طلب إعجاب بمنشور وتحديث العداد
    socket.on('like_post', async (data) => {
        try {
            await db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [data.postId]);
            const updatedPost = await db.get('SELECT likes FROM posts WHERE id = ?', [data.postId]);
            if (updatedPost) io.emit('post_liked', { postId: data.postId, likesCount: updatedPost.likes });
        } catch (err) { console.error(err); }
    });

    // [جديد] طلب جلب أرشيف الرسائل الخاصة بين مستخدمين
    socket.on('get_private_history', async (data) => {
        try {
            const history = await db.all(
                `SELECT * FROM private_messages 
                 WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) 
                 ORDER BY time ASC`,
                [data.me, data.other, data.other, data.me]
            );
            socket.emit('private_history', { other: data.other, messages: history });
        } catch (err) { console.error(err); }
    });

    // [جديد] استقبال رسالة خاصة وتوجيهها للمستلم المستهدف بدقة
    socket.on('send_private_message', async (msgData) => {
        try {
            // حفظ الرسالة في SQLite بشكل دائم
            await db.run(
                'INSERT INTO private_messages (id, sender, receiver, text, time) VALUES (?, ?, ?, ?, ?)',
                [msgData.id, msgData.sender, msgData.receiver, msgData.text, msgData.time]
            );

            // البحث عن معرف الـ Socket الخاص بالمستلم لإرسالها له في الوقت الفعلي
            for (let [socketId, username] of activeUsers.entries()) {
                if (username === msgData.receiver || username === msgData.sender) {
                    io.to(socketId).emit('new_private_message', msgData);
                }
            }
        } catch (err) { console.error(err); }
    });

    socket.on('disconnect', () => {
        const username = activeUsers.get(socket.id);
        if (username) {
            activeUsers.delete(socket.id);
            updateUsersList();
            console.log(`❌ ${username} غادر الشبكة`);
        }
    });
});

function updateUsersList() {
    // إرسال قائمة تحتوي على أسماء المستخدمين النشطين
    const usersArray = Array.from(activeUsers.values());
    io.emit('users_list', usersArray);
}

// دالة البث التلقائي mDNS
async function startServerBroadcast() {
    try {
        const bonsoir = await Bonsoir.init();
        const service = bonsoir.createService({
            name: 'RabahDj Local Server',
            type: 'rabahdj', 
            protocol: 'tcp',
            port: 4000
        });
        await bonsoir.broadcast(service);
        console.log('📡 رادار الهواتف يمكنه التقاط السيرفر الآن دون IP!');
    } catch (error) { console.error(error); }
}

const PORT = 4000;
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`=============================================`);
    console.log(`🚀 سيرفر RabahDj المحلي المتكامل يعمل بنجاح!`);
    console.log(`=============================================`);
    await initDatabase();
    startServerBroadcast();
});
