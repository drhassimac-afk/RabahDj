// 📄 src/context/SocketContext.js

import React, {
  createContext, useContext, useEffect,
  useRef, useState, useCallback
} from "react";
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SocketContext = createContext(null);

// ✅ ألوان الأفاتار العشوائية
const AVATAR_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
];

function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// ✅ منشور تجريبي للعرض قبل الاتصال
const DEMO_POSTS = [
  {
    id: "demo-1",
    authorName: "رابح",
    avatarColor: "#3b82f6",
    text: "مرحباً! هذا منشور تجريبي. اتصل بالسيرفر لترى المنشورات الحقيقية 🎉",
    likes: [],
    comments: [
      {
        id: "c1",
        authorName: "علي",
        text: "تطبيق رائع! 🔥",
        createdAt: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
  }
];

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [userName, setUserName] = useState('');
  const [avatarColor, setAvatarColor] = useState(randomColor());
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [mySocketId, setMySocketId] = useState(null);

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const savedName = await AsyncStorage.getItem("rabahdj_last_name");
        const savedColor = await AsyncStorage.getItem("rabahdj_avatar_color");
        if (savedName) setUserName(savedName);
        if (savedColor) setAvatarColor(savedColor);
      } catch (err) {
        console.error('خطأ في تحميل البيانات:', err);
      }
    };
    loadSaved();
  }, []);

  // ✅ دالة الاتصال - ترجع Promise حقيقي ينجح أو يفشل حسب نتيجة الاتصال الفعلية
  const connect = useCallback((ip, name) => {
    return new Promise((resolve, reject) => {
      const color = randomColor();
      setUserName(name);
      setAvatarColor(color);

      AsyncStorage.setItem("rabahdj_last_name", name).catch(() => {});
      AsyncStorage.setItem("rabahdj_avatar_color", color).catch(() => {});

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const socket = io(`http://${ip}:4000`, {
        transports: ["websocket"],
        timeout: 8000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      let settled = false;

      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          socket.disconnect();
          reject(new Error('انتهت مهلة الاتصال'));
        }
      }, 9000);

      socket.on("connect", () => {
        console.log('✅ متصل بالسيرفر');
        setConnected(true);
        setMySocketId(socket.id);
        socket.emit("join", { name, avatarColor: color });

        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          resolve();
        }
      });

      socket.on("connect_error", (err) => {
        console.error('خطأ في الاتصال:', err.message);
        setConnected(false);

        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          reject(err);
        }
      });

      socket.on("init", (data) => {
        if (data?.posts) {
          setPosts(data.posts);
        }
        if (data?.onlineUsers) {
          setOnlineUsers(data.onlineUsers);
        }
      });

      socket.on("postAdded", (post) => {
        setPosts((prev) => [post, ...prev.filter(p => p.id !== post.id)]);
      });

      socket.on("postUpdated", (updatedPost) => {
        setPosts((prev) =>
          prev.map(p => p.id === updatedPost.id ? updatedPost : p)
        );
      });

      socket.on("onlineUsers", (users) => {
        setOnlineUsers(users);
      });

      socket.on("disconnect", (reason) => {
        console.log('❌ انقطع الاتصال:', reason);
        setConnected(false);
        setOnlineUsers([]);
      });

      socketRef.current = socket;
    });
  }, []);

  const publishPost = useCallback((text, image = null) => {
    if (!text?.trim() && !image) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit("newPost", {
        text: text?.trim() || '',
        image: image || null,
      });
    } else {
      const newPost = {
        id: Date.now().toString(),
        authorName: userName || 'مستخدم',
        avatarColor: avatarColor,
        text: text?.trim() || '',
        image: image || null,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };
      setPosts((prev) => [newPost, ...prev]);
    }
  }, [userName, avatarColor]);

  const toggleLike = useCallback((postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const likes = [...(p.likes || [])];
          const idx = likes.indexOf(mySocketId || userName);
          if (idx === -1) {
            likes.push(mySocketId || userName);
          } else {
            likes.splice(idx, 1);
          }
          return { ...p, likes };
        }
        return p;
      })
    );

    if (socketRef.current?.connected) {
      socketRef.current.emit("toggleLike", { postId });
    }
  }, [mySocketId, userName]);

  const addComment = useCallback((postId, commentText) => {
    if (!commentText?.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      authorName: userName || 'مستخدم',
      avatarColor: avatarColor,
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...(Array.isArray(p.comments) ? p.comments : []), newComment],
          };
        }
        return p;
      })
    );

    if (socketRef.current?.connected) {
      socketRef.current.emit("newComment", {
        postId,
        text: commentText.trim(),
      });
    }
  }, [userName, avatarColor]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnected(false);
    setOnlineUsers([]);
    setPosts(DEMO_POSTS);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        connected,
        userName,
        avatarColor,
        posts,
        setPosts,
        onlineUsers,
        mySocketId,
        connect,
        disconnect,
        publishPost,
        toggleLike,
        addComment,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useRabahSocket = () => useContext(SocketContext);
