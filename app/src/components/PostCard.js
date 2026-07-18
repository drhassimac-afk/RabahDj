import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { useRabahSocket } from "../context/SocketContext";
import colors from "../theme/colors";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export default function PostCard({ post }) {
  const { userId, toggleLike, addComment } = useRabahSocket();
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const liked = Array.isArray(post?.likes) ? post.likes.includes(userId) : false;

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText("");
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: post.avatarColor || colors.primary }]}>
          <Text style={styles.avatarText}>{post.authorName?.[0]?.toUpperCase() || "?"}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>

      {post.text ? <Text style={styles.text}>{post.text}</Text> : null}
      {post.image ? (
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {post.likes.length > 0 ? `👍 ${post.likes.length}` : ""}
        </Text>
        <Text style={styles.statsText}>
          {post.comments.length > 0 ? `${post.comments.length} تعليق` : ""}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post.id)}>
          <Text style={[styles.actionText, liked && styles.actionActive]}>
            {liked ? "👍 أعجبني" : "🤍 إعجاب"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments((s) => !s)}>
          <Text style={styles.actionText}>💬 تعليق</Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={styles.commentsBox}>
          {post.comments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <Text style={styles.commentAuthor}>{c.authorName}</Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="اكتب تعليقاً..."
              placeholderTextColor={colors.subtext}
              value={commentText}
              onChangeText={setCommentText}
              textAlign="right"
              onSubmitEditing={handleSendComment}
            />
            <TouchableOpacity onPress={handleSendComment}>
              <Text style={styles.sendText}>إرسال</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  header: { flexDirection: "row-reverse", alignItems: "center", marginBottom: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  headerText: { alignItems: "flex-end" },
  authorName: { fontWeight: "700", fontSize: 15, color: colors.text },
  time: { fontSize: 11, color: colors.subtext, marginTop: 2 },
  text: { fontSize: 15, color: colors.text, textAlign: "right", lineHeight: 22, marginBottom: 8 },
  postImage: { width: "100%", height: 220, borderRadius: 10, marginBottom: 8 },
  statsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsText: { fontSize: 12, color: colors.subtext },
  actionsRow: { flexDirection: "row-reverse", justifyContent: "space-around", paddingTop: 6 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  actionText: { fontSize: 14, color: colors.subtext, fontWeight: "600" },
  actionActive: { color: colors.primary },
  commentsBox: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  commentRow: {
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    alignItems: "flex-end",
  },
  commentAuthor: { fontSize: 12, fontWeight: "700", color: colors.text },
  commentText: { fontSize: 13, color: colors.text, textAlign: "right" },
  commentInputRow: { flexDirection: "row-reverse", alignItems: "center", marginTop: 4 },
  commentInput: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    marginLeft: 8,
  },
  sendText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
});
