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
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// الذاكرة المؤقتة للمستخدمين المتصلين حالياً بالواي فاي
let activeUsers = new Map(); 
let db;

// تهيئة قاعدة بيانات SQLite وإنشاء الجداول إذا لم تكن موجودة
async function initDatabase() {
    db = await open({
        filename: path.join(__dirname, 'database.db'),
        driver: sqlite3.Database
    });

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
    console.log('💾 قاعدة بيانات SQLite جاهزة وتم التحقق من الجداول بنجاح!');
}

// 1. رابط HTTP لرفع الملفات من التطبيق
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'لم يتم اختيار أي ملف' });
    }
    const fileUrl = `http://${req.hostname}:4000/files/${req.file.filename}`;
    
    // إرسال إشعار فوري لجميع المتصلين بالشبكة عن وجود ملف جديد
    io.emit('message', {
        id: Date.now().toString(),
        sender: "النظام 🌐",
        text: `تمت مشاركة ملف جديد: ${req.file.originalname}\nرابط التحميل: ${fileUrl}`,
        time: new Date().toISOString()
    });

    res.status(200).json({ success: true, url: fileUrl });
});

// 2. إدارة اتصالات Socket.io في الوقت الفعلي
io.on('connection', async (socket) => {
    console.log(`جهاز جديد اتصل بالشبكة: ${socket.id}`);

    // انضمام مستخدم باسم وصورة محددة
    socket.on('join', async (data) => {
        activeUsers.set(socket.id, data.username);
        updateUsersList();
        
        // جلب جميع المنشورات المخزنة دائماً في قاعدة البيانات وإرسالها للمستخدم فور دخوله
        try {
            const savedPosts = await db.all('SELECT * FROM posts ORDER BY ROWID DESC');
            socket.emit('initial_feed', savedPosts);
        } catch (err) {
            console.error('خطأ أثناء جلب المنشورات من قاعدة البيانات:', err);
        }
        
        console.log(`👤 ${data.username} انضم إلى الشبكة المحلية`);
    });

    // استقبال منشور فيسبوك محلي وحفظه في SQLite ثم توزيعه فوراً
    socket.on('create_post', async (postData) => {
        try {
            await db.run(
                'INSERT INTO posts (id, author, avatar, content, image, likes, time) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [postData.id, postData.author, postData.avatar, postData.content, postData.image, postData.likes || 0, postData.time]
            );
            io.emit('new_post', postData); // بث فوري لجميع الهواتف المتصلة بالواي فاي
        } catch (err) {
            console.error('فشل حفظ المنشور في قاعدة البيانات:', err);
        }
    });

    // استقبال طلب إعجاب بمنشور وتحديث العداد في SQLite ثم عند الجميع فوراً
    socket.on('like_post', async (data) => {
        try {
            await db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [data.postId]);
            const updatedPost = await db.get('SELECT likes FROM posts WHERE id = ?', [data.postId]);
            if (updatedPost) {
                io.emit('post_liked', { postId: data.postId, likesCount: updatedPost.likes });
            }
        } catch (err) {
            console.error('فشل تحديث الإعجابات في قاعدة البيانات:', err);
        }
    });

    // استقبال رسالة دردشة عادية
    socket.on('send_message', (msgData) => {
        io.emit('message', msgData);
    });

    // عند خروج مستخدم أو فصل الـ WiFi
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
    const usersArray = Array.from(activeUsers.values());
    io.emit('users_list', usersArray);
}

// دالة البث التلقائي المصححة mDNS ليتعرف عليها الهاتف الذكي دون IP
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
        console.log('📡 تم تفعيل البث الآلي (mDNS) بنجاح، رادار الهواتف يمكنه التقاط السيرفر الآن!');
    } catch (error) {
        console.error('خطأ أثناء تشغيل نظام البث mDNS:', error);
    }
}

// تشغيل السيرفر بالكامل
const PORT = 4000;
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`=============================================`);
    console.log(`🚀 سيرفر RabahDj المحلي المستقر يعمل بنجاح!`);
    console.log(`📢 متصل بالبورت الاستراتيجي: ${PORT}`);
    console.log(`=============================================`);
    
    // تشغيل قاعدة البيانات أولاً ثم البث الآلي
    await initDatabase();
    startServerBroadcast();
});
