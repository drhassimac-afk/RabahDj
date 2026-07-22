import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRabahSocket } from '../context/SocketContext';

export default function PostCard({ post }) {
  const { toggleLike, addComment, userName, mySocketId } = useRabahSocket();

  if (!post) return null;

  // القراءة المباشرة من الـ post الممرر من Context بدون استجابة لـ useState محلية تمنع التحديث
  const currentUser = mySocketId || userName || 'رابح';
  const likesList = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = likesList.includes(currentUser);
  const likesCount = likesList.length;
  const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0;

  const authorName = typeof post.author === 'string' && post.author ? post.author : 'رابح';
  const initialLetter = authorName.charAt(0).toUpperCase() || 'R';

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

      {/* المحتوى الصوري */}
      {post.image && !post.image.includes("404") ? (
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      ) : null}

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
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={20} color="#94a3b8" />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#0f172a',
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
});
