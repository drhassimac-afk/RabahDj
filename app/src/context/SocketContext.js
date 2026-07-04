import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [serverIp, setServerIp] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  const connect = async (ip, name) => {
    setConnectionError(null);
    const avatarColor = randomColor();
    const url = `http://${ip}:4000`;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(url, {
      transports: ["websocket"],
      timeout: 6000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      setConnected(true);
      setServerIp(ip);
      setUserName(name);
      socket.emit("join", { name, avatarColor });
      AsyncStorage.setItem("rabahdj_last_ip", ip);
      AsyncStorage.setItem("rabahdj_last_name", name);
    });

    socket.on("init", ({ posts, userId, onlineUsers }) => {
      setPosts(posts);
      setUserId(userId);
      setOnlineUsers(onlineUsers);
    });

    socket.on("postAdded", (post) => {
      setPosts((prev) => [post, ...prev]);
    });

    socket.on("postUpdated", (updated) => {
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    });

    socket.on("onlineUsers", (list) => setOnlineUsers(list));

    socket.on("systemMessage", (msg) => {
      setSystemMessages((prev) => [...prev.slice(-20), msg]);
    });

    socket.on("connect_error", (err) => {
      setConnectionError("تعذر الاتصال بالسيرفر. تأكد أن الجهازين على نفس شبكة الواي فاي وأن السيرفر يعمل.");
      setConnected(false);
    });

    socket.on("disconnect", () => setConnected(false));

    socketRef.current = socket;
  };

  const disconnect = () => {
    socketRef.current?.disconnect();
    setConnected(false);
    setPosts([]);
    setOnlineUsers([]);
  };

  const publishPost = (text, image) => {
    socketRef.current?.emit("newPost", { text, image });
  };

  const toggleLike = (postId) => {
    socketRef.current?.emit("toggleLike", { postId });
  };

  const addComment = (postId, text) => {
    socketRef.current?.emit("newComment", { postId, text });
  };

  return (
    <SocketContext.Provider
      value={{
        connected,
        serverIp,
        userName,
        userId,
        posts,
        onlineUsers,
        systemMessages,
        connectionError,
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

function randomColor() {
  const palette = ["#1877F2", "#E41E3F", "#42B72A", "#F7B928", "#8B5CF6", "#00A8CC"];
  return palette[Math.floor(Math.random() * palette.length)];
}

export const useRabahSocket = () => useContext(SocketContext);
