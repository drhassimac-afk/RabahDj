const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// إعداد سيلفر السوكيت مع السماح بالاتصال من أي جهاز على الشبكة المحلية
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let onlineUsers = 0;
let posts = []; // تخزين مؤقت للمنشورات في ذاكرة السيرفر

io.on('connection', (socket) => {
    onlineUsers++;
    console.log(`🟢 جهاز جديد اتصل بالشبكة. إجمالي المتصلين: ${onlineUsers}`);
    
    // إرسال عدد المتصلين الجديد والمنشورات السابقة فور اتصال أي هاتف
    io.emit('updateOnlineCount', onlineUsers);
    
    // إرسال المنشورات القديمة للمستخدم الجديد لكي لا تظهر شاشته فارغة
    posts.forEach(post => {
        socket.emit('newPost', post);
    });

    // استقبال منشور جديد من أحد الهواتف
    socket.on('createPost', (postData) => {
        console.log(`📝 منشور جديد مستلم: ${postData.text}`);
        
        // حفظ المنشور في السيرفر
        posts.unshift(postData); 
        
        // بث المنشور فوراً لكل الأجهزة الأخرى المتصلة بالواي فاي
        socket.broadcast.emit('newPost', postData);
    });

    // عند خروج جهاز أو قفل التطبيق
    socket.on('disconnect', () => {
        onlineUsers--;
        console.log(`🔴 جهاز غادر الشبكة. متبقي: ${onlineUsers}`);
        io.emit('updateOnlineCount', onlineUsers);
    });
});

// تشغيل السيرفر على البورت 4000
const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر المحلي يعمل بنجاح!`);
    console.log(`🌐 انت متصل بالواي فاي؟ أدخل الـ IP الخاص بهذا الجهاز في التطبيق على البورت ${PORT}`);
});
