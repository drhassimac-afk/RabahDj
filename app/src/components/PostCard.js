import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PostCard({ post, userId = 'current_user_id' }) {
  // 1. فحص آمن للـ likes لتجنب خطأ includes القاتل
  const liked = Array.isArray(post?.likes) ? post.likes.includes(userId) : false;

  // 2. فحص آمن لعدد التعليقات (إذا كانت المصفوفة undefined)
  const commentsCount = Array.isArray(post?.comments) ? post.comments.length : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{post?.title || post?.name || 'بدون عنوان'}</Text>
      <Text style={styles.content}>{post?.content || post?.description || ''}</Text>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#ff3366" : "#a1a1aa"} />
          <Text style={styles.actionText}>{post?.likes?.length || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#a1a1aa" />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141417',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#202024',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'left',
  },
  content: {
    color: '#d4d4d8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'left',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#202024',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    color: '#a1a1aa',
    fontSize: 14,
    marginLeft: 6,
  },
});
