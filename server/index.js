const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// الذاكرة المؤقتة لحفظ المستخدمين والرسائل (تختفي عند إعادة تشغيل السيرفر)
let activeUsers = new Map(); 

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

    // انضمام مستخدم باسم محدد
    socket.on('join', (data) => {
        activeUsers.set(socket.id, data.username);
        updateUsersList();
        console.log(`👤 ${data.username} انضم إلى الشبكة المحلية`);
    });

    // استقبال رسالة دردشة وإعادة توجيهها للجميع فوراً
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

// دالة لتحديث قائمة المتصلين عند الجميع
function updateUsersList() {
    const usersArray = Array.from(activeUsers.values());
    io.emit('users_list', usersArray);
}

// تشغيل السيرفر على البورت 4000
const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`=============================================`);
    console.log(`🚀 سيرفر RabahDj المحلي يعمل بنجاح!`);
    console.log(`📢 متصل بالبورت: ${PORT}`);
    console.log(`=============================================`);
});
