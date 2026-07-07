const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Bonsoir = require('bonsoir');

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

// الذاكرة المؤقتة (تختفي عند إعادة تشغيل السيرفر)
let activeUsers = new Map(); 
let localPostsFeed = []; // مصفوفة حفظ المنشورات والقصص المحلية الحية

// 1. رابط HTTP لرفع الملفات من التطبيق
app.post('/upload', upload.single('file'), (req, res) => {
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
io.on('connection', (socket) => {
    console.log(`جهاز جديد اتصل بالشبكة: ${socket.id}`);

    // انضمام مستخدم باسم وصورة محددة
    socket.on('join', (data) => {
        activeUsers.set(socket.id, data.username);
        updateUsersList();
        
        // إرسال المنشورات السابقة للمستخدم الجديد فور دخوله لكي لا تظهر الصفحة بيضاء
        socket.emit('initial_feed', localPostsFeed);
        console.log(`👤 ${data.username} انضم إلى الشبكة المحلية`);
    });

    // [جديد] استقبال منشور فيسبوك محلي وتوزيعه فوراً
    socket.on('create_post', (postData) => {
        localPostsFeed.unshift(postData); // حفظ في بداية المصفوفة
        io.emit('new_post', postData);    // بث فوري لجميع الهواتف المتصلة بالواي فاي
    });

    // [جديد] استقبال طلب إعجاب بمنشور وتحديث العداد عند الجميع فوراً
    socket.on('like_post', (data) => {
        const post = localPostsFeed.find(p => p.id === data.postId);
        if (post) {
            post.likes = (post.likes || 0) + 1;
            io.emit('post_liked', { postId: post.id, likesCount: post.likes });
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
        
        // تصحيح التسمية لتبدأ بـ _ والبروتوكول المستهدف
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
server.listen(PORT, '0.0.0.0', () => {
    console.log(`=============================================`);
    console.log(`🚀 سيرفر RabahDj المحلي المتطور يعمل بنجاح!`);
    console.log(`📢 متصل بالبورت الاستراتيجي: ${PORT}`);
    console.log(`=============================================`);
    
    // إطلاق البث التلقائي بعد إقلاع السيرفر
    startServerBroadcast();
});


