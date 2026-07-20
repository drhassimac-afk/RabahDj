import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRabahSocket } from '../context/SocketContext';

export default function PostCard({ post }) {
  const { toggleLike, addComment, userName } = useRabahSocket();
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  if (!post) return null;

  const currentUser = userName || 'رابح';
  const likesList = Array.isArray(post.likes) ? post.likes : [];
  const commentsList = Array.isArray(post.comments) ? post.comments : [];
  const isLiked = likesList.includes(currentUser);

  const authorName = typeof post.author === 'string' && post.author ? post.author : 'رابح';
  const initialLetter = authorName.charAt(0).toUpperCase() || 'R';

  const handleSendComment = () => {
    if (!commentInput.trim()) return;
    addComment(post.id, commentInput.trim());
    setCommentInput('');
  };

  return (
    <View style={styles.card}>
      {/* هيدر الكرت */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialLetter}</Text>
        </View>
        <Text style={styles.authorName}>{authorName}</Text>
      </View>

      {/* المحتوى النصي */}
      {post.text ? <Text style={styles.contentText}>{post.text}</Text> : null}

      {/* أزرار التفاعل */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => toggleLike(post.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={22}
            color={isLiked ? "#ef4444" : "#94a3b8"}
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {likesList.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => setShowComments(!showComments)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="chatbubble-outline" 
            size={20} 
            color={showComments ? "#3b82f6" : "#94a3b8"} 
          />
          <Text style={[styles.actionText, showComments && { color: "#3b82f6" }]}>
            {commentsList.length}
          </Text>
        </TouchableOpacity>
      </View>

      {/* قسم التعليقات التفاعلي */}
      {showComments && (
        <View style={styles.commentsSection}>
          {/* قائمة التعليقات الحالية */}
          {commentsList.length > 0 ? (
            commentsList.map((c, idx) => (
              <View key={c.id || idx} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{c.author || 'مستخدم'}:</Text>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noCommentsText}>لا توجد تعليقات بعد. كن أول من يعلق!</Text>
          )}

          {/* حقل إدخال تعليق جديد */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="اكتب تعليقاً..."
              placeholderTextColor="#64748b"
              value={commentInput}
              onChangeText={setCommentInput}
            />
            <TouchableOpacity 
              style={[styles.sendCommentBtn, !commentInput.trim() && { opacity: 0.5 }]} 
              onPress={handleSendComment}
              disabled={!commentInput.trim()}
            >
              <Ionicons name="send" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141b2d',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorName: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 15,
  },
  contentText: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
    gap: 24,
  },
  actionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  likedText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  // تنسيقات التعليقات
  commentsSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
  },
  commentItem: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    flexDirection: 'row-reverse',
    gap: 6,
  },
  commentAuthor: {
    color: '#00ffcc',
    fontWeight: 'bold',
    fontSize: 12,
  },
  commentText: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  noCommentsText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 6,
  },
  commentInputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontSize: 13,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
    textAlign: 'right',
  },
  sendCommentBtn: {
    backgroundColor: '#3b82f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
