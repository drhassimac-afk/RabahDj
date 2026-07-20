// 📄 src/screens/FeedScreen.js

import React, { useState, useCallback } from 'react';
import {
  FlatList, StyleSheet, SafeAreaView,
  View, TouchableOpacity, Text, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRabahSocket } from '../context/SocketContext';
import PostCard from '../components/PostCard';
import PostComposer from '../components/PostComposer';

export default function FeedScreen() {
  const { posts, connected, onlineUsers } = useRabahSocket();
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // ✅ فلترة المنشورات
  const filteredPosts = posts.filter(p => {
    if (filter === 'image') return !!p.image;
    return true;
  });

  // ✅ تحديث بالسحب
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // ✅ هيدر القائمة
  const ListHeader = () => (
    <View>
      {/* شريط الحالة */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View style={[
            styles.statusDot,
            { backgroundColor: connected ? '#10b981' : '#ef4444' }
          ]} />
          <Text style={styles.statusText}>
            {connected ? `${onlineUsers?.length || 0} متصل` : 'غير متصل'}
          </Text>
        </View>
        <Text style={styles.appName}>🎙️ RabahDj</Text>
      </View>

      {/* شريط الفلتر */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[styles.fBtn, filter === 'all' && styles.fBtnActive]}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={filter === 'all' ? '#fff' : '#64748b'}
          />
          <Text style={[
            styles.fText,
            filter === 'all' && styles.fTextActive
          ]}>
            الكل
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('image')}
          style={[styles.fBtn, filter === 'image' && styles.fBtnActive]}
        >
          <Ionicons
            name="image-outline"
            size={16}
            color={filter === 'image' ? '#fff' : '#64748b'}
          />
          <Text style={[
            styles.fText,
            filter === 'image' && styles.fTextActive
          ]}>
            بالصور
          </Text>
        </TouchableOpacity>
      </View>

      {/* PostComposer */}
      <PostComposer />
    </View>
  );

  // ✅ رسالة عند عدم وجود منشورات
  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={60} color="#1e293b" />
      <Text style={styles.emptyText}>لا توجد منشورات بعد</Text>
      <Text style={styles.emptySubText}>
        {filter === 'image'
          ? 'لا توجد منشورات تحتوي على صور'
          : 'كن أول من ينشر! 🚀'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={<ListEmpty />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        // ✅ تحديث بالسحب للأسفل
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  listContent: {
    paddingBottom: 80,
  },
  statusBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141b2d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterBar: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  fBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#141b2d',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  fBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  fText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 13,
  },
  fTextActive: {
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#475569',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubText: {
    color: '#334155',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

