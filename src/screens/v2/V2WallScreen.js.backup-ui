import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, Animated, Modal,
  LayoutAnimation, UIManager, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket } from '../../api/socket';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  bg: '#0B1120', surface: '#161F2E', surfaceLight: '#1C2840',
  border: '#243044', primary: '#3B82F6', text: '#FFFFFF',
  sub: '#94A3B8', muted: '#64748B', danger: '#EF4444', heart: '#F43F5E',
};

const MAX_LEN = 500;
const AVATAR_COLORS = ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#22C55E','#06B6D4','#F97316'];

function avatarColor(name = '?') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 10) return 'الآن';
  if (diff < 60) return `منذ ${diff} ث`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? 'منذ ساعة' : h === 2 ? 'منذ ساعتين' : `منذ ${h} س`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'أمس';
  return `منذ ${d} يوم`;
}

function PostCard({ item, myName, onLike, onDelete, onComments }) {
  const cleanMyName = (myName || '').trim().toLowerCase();
  const isMine = (item.authorName || '').trim().toLowerCase() === cleanMyName;
  const likes = Array.isArray(item.likes) ? item.likes : [];
  const iLiked = likes.some(l => typeof l === 'string' && l.trim().toLowerCase() === cleanMyName);
  const commentCount = (item.comments || []).length;
  const scale = useRef(new Animated.Value(1)).current;
  const sendScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    onLike(item.id);
  };

  const handleDelete = () => {
    Alert.alert('حذف المنشور', 'هل أنت متأكد؟ لا يمكن التراجع.', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => onDelete(item.id) },
    ]);
  };

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.avatar, { backgroundColor: item.avatarColor || avatarColor(item.authorName) }]}>
          <Text style={s.avatarTxt}>{(item.authorName || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={s.authorBox}>
          <View style={s.authorRow}>
            <Text style={s.author}>{item.authorName}</Text>
            {isMine && <View style={s.youBadge}><Text style={s.youBadgeTxt}>أنت</Text></View>}
          </View>
          {!!(item.createdAt || item.timestamp) && (
            <Text style={s.time}>{timeAgo(item.createdAt || item.timestamp)}</Text>
          )}
        </View>
        {isMine && (
          <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={18} color={C.danger} />
          </TouchableOpacity>
        )}
      </View>

      {!!item.text && <Text style={s.postText}>{item.text}</Text>}

      <View style={s.cardFooter}>
        <TouchableOpacity style={s.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name={iLiked ? 'heart' : 'heart-outline'} size={20}
              color={iLiked ? C.heart : C.sub} />
          </Animated.View>
          <Text style={[s.actionTxt, iLiked && { color: C.heart, fontWeight: '700' }]}>
            {likes.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.actionBtn} onPress={() => onComments(item.id)} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={18} color={C.sub} />
          <Text style={s.actionTxt}>{commentCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function V2WallScreen({ route, navigation }) {
  const rawName = route?.params?.name || route?.params?.user?.name || route?.params?.username || '';
  const myName = rawName.trim();
  const [posts, setPosts] = useState(route?.params?.initialPosts || []);
  const [text, setText] = useState('');
  const [commentsPostId, setCommentsPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const sock = useRef(getSocket());
  const commentsListRef = useRef(null);

  useEffect(() => {
    const s = sock.current;
    const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const onPostsList = (list) => { animate(); setPosts(list || []); };
    const onPostAdded = (post) => { animate(); setPosts((prev) => [post, ...prev]); };
    const onPostUpdated = (updated) =>
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    const onPostDeleted = ({ postId }) => {
      animate();
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    };

    s.on('postsList', onPostsList);
    s.on('postAdded', onPostAdded);
    s.on('postUpdated', onPostUpdated);
    s.on('postDeleted', onPostDeleted);
    return () => {
      s.off('postsList', onPostsList);
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
    Keyboard.dismiss();
  };

  // تحديث فوري محلي (Optimistic) + إرسال للسيرفر — الإحساس بيبقى لحظي
  const toggleLike = useCallback((postId) => {
    const cleanMyName = myName.trim().toLowerCase();
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const likes = Array.isArray(p.likes) ? [...p.likes] : [];
      const idx = likes.findIndex((l) => typeof l === 'string' && l.trim().toLowerCase() === cleanMyName);
      if (idx === -1) likes.push(myName); else likes.splice(idx, 1);
      return { ...p, likes };
    }));
    sock.current.emit('toggleLike', { postId, userName: myName });
  }, [myName]);

  const deletePost = useCallback((postId) => {
    sock.current.emit('deletePost', { postId });
  }, []);

  const sendComment = () => {
    const t = commentText.trim();
    if (!t || !commentsPostId || sending) return;
    setSending(true);
    sock.current.emit('newComment', { postId: commentsPostId, text: t });
    setCommentText('');
    setTimeout(() => {
      commentsListRef.current?.scrollToEnd?.({ animated: true });
      setSending(false);
    }, 150);
  };

  const commentsPost = useMemo(
    () => posts.find((p) => p.id === commentsPostId) || null,
    [posts, commentsPostId]
  );

  const canSend = text.trim().length > 0;
  const canSendComment = commentText.trim().length > 0 && !sending;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-forward" size={24} color={C.sub} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>الحائط</Text>
        <View style={s.postCounter}>
          <Text style={s.postCounterTxt}>{posts.length}</Text>
        </View>
      </View>

      <FlatList
        data={posts}
        extraData={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard item={item} myName={myName} onLike={toggleLike}
            onDelete={deletePost} onComments={setCommentsPostId} />
        )}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Ionicons name="newspaper-outline" size={48} color={C.muted} />
            <Text style={s.empty}>لا توجد منشورات بعد</Text>
            <Text style={s.emptyHint}>كن أول من يكتب شيئاً! ✍️</Text>
          </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.composer}>
          <TouchableOpacity style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
            onPress={publish} disabled={!canSend} activeOpacity={0.75}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.inputBox}>
            <TextInput style={s.input} placeholder="بماذا تفكر؟"
              placeholderTextColor={C.muted} value={text}
              onChangeText={(t) => t.length <= MAX_LEN && setText(t)} multiline />
            {text.length > MAX_LEN * 0.8 && (
              <Text style={s.charCount}>{text.length}/{MAX_LEN}</Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* نافذة التعليقات */}
      <Modal
        visible={!!commentsPost}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentsPostId(null)}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setCommentsPostId(null)} />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setCommentsPostId(null)}>
                <Ionicons name="close" size={24} color={C.sub} />
              </TouchableOpacity>
              <Text style={s.modalTitle}>
                التعليقات ({(commentsPost?.comments || []).length})
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <FlatList
              ref={commentsListRef}
              data={commentsPost?.comments || []}
              extraData={commentsPost}
              keyExtractor={(c) => c.id}
              style={s.commentsList}
              renderItem={({ item: c }) => (
                <View style={s.commentRow}>
                  <View style={[s.commentAvatar,
                    { backgroundColor: c.avatarColor || avatarColor(c.authorName) }]}>
                    <Text style={s.commentAvatarTxt}>
                      {(c.authorName || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={s.commentBubble}>
                    <View style={s.commentTop}>
                      <Text style={s.commentAuthor}>{c.authorName}</Text>
                      <Text style={s.commentTime}>{timeAgo(c.createdAt)}</Text>
                    </View>
                    <Text style={s.commentText}>{c.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={s.commentsEmpty}>
                  <Ionicons name="chatbubbles-outline" size={36} color={C.muted} />
                  <Text style={s.emptyHint}>لا تعليقات بعد — كن الأول! 💬</Text>
                </View>
              }
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={s.composer}>
                <TouchableOpacity
                  style={[s.sendBtn, !canSendComment && s.sendBtnDisabled]}
                  onPress={sendComment} disabled={!canSendComment} activeOpacity={0.75}>
                  <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
                <TextInput
                  style={[s.input, { flex: 1, marginRight: 10 }]}
                  placeholder="اكتب تعليقاً..."
                  placeholderTextColor={C.muted}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  postCounter: {
    backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10, paddingVertical: 3, minWidth: 30, alignItems: 'center',
  },
  postCounterTxt: { color: C.sub, fontSize: 12, fontWeight: '700' },
  list: { padding: 16, flexGrow: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  empty: { color: C.sub, fontSize: 15, fontWeight: '600', marginTop: 14 },
  emptyHint: { color: C.muted, fontSize: 13, marginTop: 6 },
  card: {
    backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
  },
  avatarTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  authorBox: { flex: 1 },
  authorRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  author: { color: C.text, fontWeight: '700', fontSize: 15, textAlign: 'right' },
  youBadge: {
    backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2, marginRight: 8,
  },
  youBadgeTxt: { color: C.primary, fontSize: 10, fontWeight: '700' },
  time: { color: C.muted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  deleteBtn: { padding: 4 },
  postText: { color: C.text, marginTop: 10, fontSize: 15, lineHeight: 24, textAlign: 'right' },
  cardFooter: {
    flexDirection: 'row-reverse', marginTop: 12,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10,
  },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', marginLeft: 22, padding: 2 },
  actionTxt: { color: C.sub, marginRight: 6, fontSize: 13 },
  composer: {
    flexDirection: 'row-reverse', alignItems: 'flex-end', padding: 12,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg,
  },
  inputBox: { flex: 1, marginRight: 10 },
  input: {
    backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border,
    color: C.text, paddingHorizontal: 16, paddingVertical: 10,
    textAlign: 'right', maxHeight: 100,
  },
  charCount: {
    color: C.muted, fontSize: 10, position: 'absolute', bottom: 4, left: 12,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.muted, opacity: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderWidth: 1, borderColor: C.border, maxHeight: '75%', minHeight: '50%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: C.border,
    alignSelf: 'center', marginTop: 10,
  },
  modalHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
  commentsList: { paddingHorizontal: 16, paddingTop: 10 },
  commentRow: { flexDirection: 'row-reverse', marginBottom: 12 },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  commentAvatarTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  commentBubble: {
    flex: 1, backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 10,
  },
  commentTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  commentAuthor: { color: C.text, fontWeight: '700', fontSize: 13 },
  commentTime: { color: C.muted, fontSize: 10 },
  commentText: { color: C.text, fontSize: 14, lineHeight: 21, textAlign: 'right', marginTop: 4 },
  commentsEmpty: { alignItems: 'center', paddingTop: 40 },
});
