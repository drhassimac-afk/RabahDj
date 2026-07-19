import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRabahSocket } from '../context/SocketContext';

export default function PostCard({ post }) {
  const { userId, toggleLike } = useRabahSocket();

  const liked = Array.isArray(post?.likes) ? post.likes.includes(userId) : false;
  const commentsCount = Array.isArray(post?.comments) ? post.comments.length : 0;
  const authorName = post?.authorName || post?.author?.name || post?.title || post?.name || 'مجهول';
  const bodyText = post?.text || post?.content || post?.description || '';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{authorName}</Text>
      {bodyText ? <Text style={styles.content}>{bodyText}</Text> : null}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(post.id)}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#ff3366" : "#a1a1aa"} />
          <Text style={styles.actionText}>{post?.likes?.length || 0}</Text>
        </TouchableOpacity>

        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#a1a1aa" />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </View>
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
    textAlign: 'right',
  },
  content: {
    color: '#d4d4d8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'right',
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
