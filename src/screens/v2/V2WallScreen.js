import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket } from '../../api/socket';

const C = {
  bg: '#0B1120', surface: '#161F2E', border: '#243044',
  primary: '#3B82F6', text: '#FFFFFF', sub: '#94A3B8',
  muted: '#64748B', danger: '#EF4444',
};

export default function V2WallScreen({ route, navigation }) {
  const myName = route?.params?.name || '';
  const [posts, setPosts] = useState(route?.params?.initialPosts || []);
  const [text, setText] = useState('');
  const sock = useRef(getSocket());

  useEffect(() => {
    const s = sock.current;

    const onPostsList = (list) => setPosts(list || []);
    const onPostAdded = (post) => setPosts((prev) => [post, ...prev]);
    const onPostUpdated = (updated) =>
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    const onPostDeleted = ({ postId }) =>
      setPosts((prev) => prev.filter((p) => p.id !== postId));

        s.on('postAdded', onPostAdded);
    s.on('postUpdated', onPostUpdated);
    s.on('postDeleted', onPostDeleted);

    return () => {
      s.off('postAdded', onPostAdded);
      s.off('postUpdated', onPostUpdated);
      s.off('postDeleted', onPostDeleted);
    };
  }, []);

  const publish = () => {
    const t = text.trim();
    if (!t) return;
    sock.current.emit('newPost', { text: t });
    setText('');
  };

  const toggleLike = (postId) => sock.current.emit('toggleLike', { postId });

  const deletePost = (postId) => sock.current.emit('deletePost', { postId });

  const renderPost = ({ item }) => {
    const isMine = item.authorName === myName;
    const likeCount = (item.likes || []).length;
    const commentCount = (item.comments || []).length;
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={[s.avatar, { backgroundColor: item.avatarColor || C.primary }]}>
            <Text style={s.avatarTxt}>{(item.authorName || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={s.author}>{item.authorName}</Text>
          {isMine && (
            <TouchableOpacity style={s.deleteBtn} onPress={() => deletePost(item.id)}>
              <Ionicons name="trash-outline" size={18} color={C.danger} />
            </TouchableOpacity>
          )}
        </View>
        {!!item.text && <Text style={s.postText}>{item.text}</Text>}
        <View style={s.cardFooter}>
          <TouchableOpacity style={s.actionBtn} onPress={() => toggleLike(item.id)}>
            <Ionicons name="heart-outline" size={18} color={C.sub} />
            <Text style={s.actionTxt}>{likeCount}</Text>
          </TouchableOpacity>
          <View style={s.actionBtn}>
            <Ionicons name="chatbubble-outline" size={18} color={C.sub} />
            <Text style={s.actionTxt}>{commentCount}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={24} color={C.sub} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>الحائط</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <Text style={s.empty}>لا توجد منشورات بعد — اكتب أول منشور!</Text>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.composer}>
          <TouchableOpacity style={s.sendBtn} onPress={publish}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
          <TextInput
            style={s.input}
            placeholder="بماذا تفكر؟"
            placeholderTextColor={C.muted}
            value={text}
            onChangeText={setText}
            multiline
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  list: { padding: 16 },
  empty: { color: C.muted, textAlign: 'center', marginTop: 60, fontSize: 14 },
  card: {
    backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center' },
  avatar: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    marginLeft: 10,
  },
  avatarTxt: { color: '#fff', fontWeight: '800' },
  author: { color: C.text, fontWeight: '700', flex: 1, textAlign: 'right' },
  deleteBtn: { padding: 4 },
  postText: { color: C.text, marginTop: 10, fontSize: 15, lineHeight: 22, textAlign: 'right' },
  cardFooter: { flexDirection: 'row-reverse', marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', marginLeft: 20 },
  actionTxt: { color: C.sub, marginRight: 6, fontSize: 13 },
  composer: {
    flexDirection: 'row-reverse', alignItems: 'flex-end', padding: 12,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg,
  },
  input: {
    flex: 1, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border,
    color: C.text, paddingHorizontal: 16, paddingVertical: 10, marginRight: 10, textAlign: 'right',
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
