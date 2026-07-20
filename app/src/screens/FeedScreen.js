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
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* شريط الفلتر */}
      <View style={styles.filterBar}>
        <TouchableOpacity onPress={() => setFilter('all')} style={styles.fBtn}><Text style={styles.fText}>الكل</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('image')} style={styles.fBtn}><Text style={styles.fText}>بالصور</Text></TouchableOpacity>
      </View>
      
      {/* إعادة إضافة PostComposer هنا */}
      <FlatList
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
  filterBar: { flexDirection: 'row-reverse', padding: 10, gap: 10, justifyContent: 'center' },
  fBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#141b2d' },
  fText: { color: '#ffffff' }
});
