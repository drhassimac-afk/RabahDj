/**
 * سيرفر RabahDj المحلي
 * يعمل على جهاز واحد متصل بشبكة الواي فاي، وبقية الأجهزة تتصل به
 * عبر عنوان IP المحلي لهذا الجهاز. لا حاجة للإنترنت إطلاقاً.
 */
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// تخزين مؤقت في الذاكرة (يُعاد تصفيره عند إعادة تشغيل السيرفر)
let users = {}; // socket.id -> { id, name, avatarColor }
let posts = []; // { id, authorId, authorName, text, image, likes: [userId], comments: [], createdAt }

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

// نقطة فحص سريعة لمعرفة أن السيرفر يعمل ومعرفة الـ IP
app.get("/health", (req, res) => {
  res.json({ status: "ok", ip: getLocalIp(), onlineUsers: Object.keys(users).length });
});

app.get("/posts", (req, res) => {
  res.json(posts);
});

io.on("connection", (socket) => {
  console.log("جهاز جديد متصل:", socket.id);

  socket.on("join", ({ name, avatarColor }) => {
    users[socket.id] = { id: socket.id, name, avatarColor };
    socket.emit("init", { posts, userId: socket.id, onlineUsers: Object.values(users) });
    io.emit("onlineUsers", Object.values(users));
    io.emit("systemMessage", `${name} انضم إلى RabahDj`);
  });

  socket.on("newPost", ({ text, image }) => {
    const user = users[socket.id];
    if (!user) return;
    const post = {
      id: Date.now().toString() + "-" + socket.id,
      authorId: socket.id,
      authorName: user.name,
      avatarColor: user.avatarColor,
      text,
      image: image || null,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    posts.unshift(post);
    io.emit("postAdded", post);
  });

  socket.on("toggleLike", ({ postId }) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const idx = post.likes.indexOf(socket.id);
    if (idx === -1) post.likes.push(socket.id);
    else post.likes.splice(idx, 1);
    io.emit("postUpdated", post);
  });

  socket.on("newComment", ({ postId, text }) => {
    const user = users[socket.id];
    const post = posts.find((p) => p.id === postId);
    if (!post || !user) return;
    post.comments.push({
      id: Date.now().toString(),
      authorName: user.name,
      text,
      createdAt: new Date().toISOString(),
    });
    io.emit("postUpdated", post);
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    delete users[socket.id];
    io.emit("onlineUsers", Object.values(users));
    if (user) io.emit("systemMessage", `${user.name} غادر`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  const ip = getLocalIp();
  console.log("========================================");
  console.log("  سيرفر RabahDj يعمل الآن");
  console.log(`  عنوان الشبكة المحلية: http://${ip}:${PORT}`);
  console.log("  استخدم هذا العنوان داخل التطبيق على باقي الأجهزة");
  console.log("  (يجب أن تكون كل الأجهزة متصلة بنفس شبكة الواي فاي)");
  console.log("========================================");
});
