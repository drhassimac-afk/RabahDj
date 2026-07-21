import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [userName, setUserName] = useState("رابح");
  const [posts, setPosts] = useState([
    {
      id: "demo-1",
      author: "رابح",
      text: "مرحباً بك! جرب كتابة تعليق الآن.",
      likes: [],
      comments: [{ id: "c1", author: "علي", text: "تطبيق رائع!" }],
      createdAt: new Date().toISOString(),
    }
  ]);

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

    // أضف هذا داخل دالة connect
    socket.on("postUpdated", (updatedPost) => {
      setPosts((prev) => 
        prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
      );
    });

    socketRef.current = socket;
  };

  const publishPost = (text) => {
    if (!text.trim()) return;

    const newPost = {
      id: Date.now().toString(),
      author: userName || "رابح",
      text: text.trim(),
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);

    if (socketRef.current?.connected) {
      socketRef.current.emit("newPost", { text: text.trim(), image: null });
    }
  };

  const toggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const likes = p.likes || [];
          const isLiked = likes.includes(userName);
          return {
            ...p,
            likes: isLiked ? likes.filter((u) => u !== userName) : [...likes, userName],
          };
        }
        return p;
      })
    );

    if (socketRef.current?.connected) {
      socketRef.current.emit("toggleLike", { postId });
    }
  };

  // دالة إضافة تعليق تفاعلي فوري
  const addComment = (postId, commentText) => {
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      author: userName || "رابح",
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentComments = Array.isArray(p.comments) ? p.comments : [];
          return {
            ...p,
            comments: [...currentComments, newComment],
          };
        }
        return p;
      })
    );

    if (socketRef.current?.connected) {
      socketRef.current.emit("newComment", { postId, comment: newComment });
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
