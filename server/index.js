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

function initDatabase() {
    const adapter = new FileSync(path.join(__dirname, 'database.json'));
    db = low(adapter);
    db.defaults({
        posts: [],
        private_messages: []
    }).write();
    console.log('💾 قاعدة البيانات جاهزة ومحدثة بجداول الرسائل الخاصة!');
}

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

io.on('connection', async (socket) => {
    console.log(`جهاز جديد اتصل: ${socket.id}`);

    socket.on('join', (data) => {
        activeUsers.set(socket.id, data.username);
        updateUsersList();
        try {
            const savedPosts = db.get('posts').slice().reverse().value();
            socket.emit('initial_feed', savedPosts);
        } catch (err) { console.error(err); }
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
