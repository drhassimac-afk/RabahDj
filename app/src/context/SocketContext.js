import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [userName, setUserName] = useState("رابح");
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem("rabahdj_last_name").then(name => name && setUserName(name));
  }, []);

  const connect = async (ip, name) => {
    setUserName(name);
    AsyncStorage.setItem("rabahdj_last_name", name);
    
    if (socketRef.current) socketRef.current.disconnect();

    const socket = io(`http://${ip}:4000`, { transports: ["websocket"], timeout: 5000 });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", { name });
    });

    socket.on("init", (data) => {
      if (data && data.posts) setPosts(data.posts);
    });

    socket.on("postAdded", (post) => {
      setPosts((prev) => [post, ...prev.filter(p => p.id !== post.id)]);
    });

    // ✅ تم إضافة الاستماع لتحديثات المنشورات (لايك/تعليق)
    socket.on("postUpdated", (updatedPost) => {
      setPosts((prev) => 
        prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
      );
    });

    socketRef.current = socket;
  };

  const publishPost = (text) => {
    if (!text.trim()) return;

    if (socketRef.current?.connected) {
      // نرسل للسيرفر، والسيرفر سيقوم بـ broadcast للجميع بما فيهم نحن
      socketRef.current.emit("newPost", { text: text.trim(), image: null });
    }
  };

  const toggleLike = (postId) => {
    // التحديث الفوري لتسريع الواجهة
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const likes = p.likes || [];
          const isLiked = likes.includes(socketRef.current.id); // نستخدم الـ ID أفضل
          return {
            ...p,
            likes: isLiked ? likes.filter((id) => id !== socketRef.current.id) : [...likes, socketRef.current.id],
          };
        }
        return p;
      })
    );

    if (socketRef.current?.connected) {
      socketRef.current.emit("toggleLike", { postId });
    }
  };

  const addComment = (postId, commentText) => {
    if (!commentText.trim()) return;

    // ✅ تم تصحيح اسم الحدث إلى newComment ليطابق السيرفر
    // ✅ تم إرسال البيانات بالشكل الذي يتوقعه السيرفر { postId, text }
    if (socketRef.current?.connected) {
      socketRef.current.emit("newComment", { postId, text: commentText.trim() });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        connected,
        userName,
        posts,
        setPosts,
        connect,
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
