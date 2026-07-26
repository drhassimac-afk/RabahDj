import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import { useRabahSocket } from "../context/SocketContext";
import colors from "../theme/colors";

export default function ChatScreen({ route }) {
  const { otherUser } = route.params;
  const { userName, privateChats, sendPrivateMessage, loadPrivateHistory } = useRabahSocket();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadPrivateHistory(otherUser);
  }, [otherUser]);

  useEffect(() => {
    const history = privateChats?.[otherUser] || [];
    const formatted = history
      .map((m) => ({
        _id: m.id,
        text: m.text,
        createdAt: new Date(m.time),
        user: {
          _id: m.sender === userName ? 1 : 2,
          name: m.sender,
        },
      }))
      .reverse();
    setMessages(formatted);
  }, [privateChats, otherUser, userName]);

  const onSend = useCallback((newMessages = []) => {
    const msg = newMessages[0];
    if (msg?.text) {
      sendPrivateMessage(otherUser, msg.text);
    }
  }, [otherUser]);

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={(msgs) => onSend(msgs)}
        user={{ _id: 1, name: userName }}
        placeholder="اكتب رسالة..."
        locale="ar"
        alwaysShowSend
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
