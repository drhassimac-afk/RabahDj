import React, { useState } from 'react';
import { FlatList, StyleSheet, SafeAreaView, View, TouchableOpacity, Text } from 'react-native';
import { useRabahSocket } from '../context/SocketContext';
import PostCard from '../components/PostCard';
import PostComposer from '../components/PostComposer';

export default function FeedScreen() {
  const { posts } = useRabahSocket();
  const [filter, setFilter] = useState('all');

  const filteredPosts = posts.filter(p => {
    if (filter === 'image') return !!p.image;
    if (filter === 'text') return !!p.text;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterBar}>
        <TouchableOpacity onPress={() => setFilter('all')} style={styles.fBtn}><Text style={styles.fText}>الكل</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('image')} style={styles.fBtn}><Text style={styles.fText}>بالصور</Text></TouchableOpacity>
      </View>
      
      {/* تم إضافة key فريد لضمان إعادة رسم الـ Header فور تغيير أي شيء */}
      <FlatList
        key={filter} 
        data={filteredPosts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={<PostComposer />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  filterBar: { flexDirection: 'row-reverse', padding: 10, gap: 20, justifyContent: 'center', backgroundColor: '#0b0f19' },
  fBtn: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10, backgroundColor: '#141b2d' },
  fText: { color: '#3b82f6', fontWeight: 'bold' }
});
