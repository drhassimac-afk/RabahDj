import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  LayoutAnimation,
  UIManager,
  Keyboard,
  Pressable,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket } from '../../api/socket';
import { PostCard } from './PostCard';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  border: '#334155',
  primary: '#3B82F6',
  primaryText: '#FFFFFF',
  subText: '#94A3B8',
  muted: '#64748B',
  danger: '#F43F5E',
};

const MAX_LEN = 500;

export default function V2WallScreen({ route, navigation }) {
  const rawName =
    route?.params?.name ||
    route?.params?.user?.name ||
    route?.params?.username ||
    '';

  const myName = useMemo(() => rawName.trim(), [rawName]);

  const [posts, setPosts] = useState(
    route?.params?.initialPosts || []
  );

  const [text, setText] = useState('');
  const [commentsPostId, setCommentsPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  const sock = useRef(getSocket());
  const commentsListRef = useRef(null);

  useEffect(() => {
    const socket = sock.current;

    const animate = () => {
      LayoutAnimation.configureNext(
        LayoutAnimation.Presets.easeInEaseOut
      );
    };

    const onPostsList = (list) => {
      animate();
      setPosts(Array.isArray(list) ? list : []);
    };

    const onPostAdded = (post) => {
      if (!post) return;

      animate();

      setPosts((prev) => {
        if (prev.some((p) => p.id === post.id)) {
          return prev;
        }

        return [post, ...prev];
      });
    };

    const onPostUpdated = (updated) => {
      if (!updated?.id) return;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === updated.id ? updated : p
        )
      );
    };

    const onPostDeleted = (payload) => {
      const postId =
        typeof payload === 'string'
          ? payload
          : payload?.postId;

      if (!postId) return;

      animate();

      setPosts((prev) =>
        prev.filter((p) => p.id !== postId)
      );

      setCommentsPostId((current) =>
        current === postId ? null : current
      );
    };

    socket.on('postsList', onPostsList);
    socket.on('postAdded', onPostAdded);
    socket.on('postUpdated', onPostUpdated);
    socket.on('postDeleted', onPostDeleted);

    return () => {
      socket.off('postsList', onPostsList);
      socket.off('postAdded', onPostAdded);
      socket.off('postUpdated', onPostUpdated);
      socket.off('postDeleted', onPostDeleted);
    };
  }, []);

  const publish = useCallback(() => {
    const t = text.trim();

    if (!t) return;

    if (t.length > MAX_LEN) return;

    sock.current.emit('newPost', {
      text: t,
    });

    setText('');
    Keyboard.dismiss();
  }, [text]);

  const toggleLike = useCallback(
    (postId) => {
      const cleanMyName = myName
        .trim()
        .toLowerCase();

      if (!postId || !cleanMyName) return;

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;

          const likes = Array.isArray(p.likes)
            ? [...p.likes]
            : [];

          const idx = likes.findIndex(
            (l) =>
              typeof l === 'string' &&
              l.trim().toLowerCase() === cleanMyName
          );

          if (idx === -1) {
            likes.push(myName);
          } else {
            likes.splice(idx, 1);
          }

          return {
            ...p,
            likes,
          };
        })
      );

      sock.current.emit('toggleLike', {
        postId,
        userName: myName,
      });
    },
    [myName]
  );

  const deletePost = useCallback((postId) => {
    if (!postId) return;

    sock.current.emit('deletePost', {
      postId,
    });
  }, []);

  const sendComment = useCallback(() => {
    const t = commentText.trim();

    if (
      !t ||
      !commentsPostId ||
      sending
    ) {
      return;
    }

    setSending(true);

    sock.current.emit('newComment', {
      postId: commentsPostId,
      text: t,
    });

    setCommentText('');

    setTimeout(() => {
      commentsListRef.current?.scrollToEnd?.({
        animated: true,
      });

      setSending(false);
    }, 150);
  }, [
    commentText,
    commentsPostId,
    sending,
  ]);

  const commentsPost = useMemo(
    () =>
      posts.find(
        (p) => p.id === commentsPostId
      ) || null,
    [posts, commentsPostId]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <PostCard
        item={item}
        myName={myName}
        onLike={toggleLike}
        onDelete={deletePost}
        onComments={setCommentsPostId}
      />
    ),
    [
      myName,
      toggleLike,
      deletePost,
    ]
  );

  const canSend = text.trim().length > 0;

  const canSendComment =
    commentText.trim().length > 0 &&
    !sending;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <Ionicons
            name="arrow-forward"
            size={24}
            color={C.subText}
          />
        </TouchableOpacity>

        <Text style={s.headerTitle}>
          الحائط التفاعلي
        </Text>

        <View style={s.postCounter}>
          <Text style={s.postCounterTxt}>
            {posts.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item, index) =>
          String(item?.id ?? index)
        }
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={
          Platform.OS === 'android'
        }
        initialNumToRender={7}
        maxToRenderPerBatch={10}
        windowSize={7}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Ionicons
              name="newspaper-outline"
              size={54}
              color={C.muted}
            />

            <Text style={s.empty}>
              لا توجد منشورات بعد
            </Text>

            <Text style={s.emptyHint}>
              كن أول من يترك بصمته اليوم! ✍️
            </Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
      >
        <View style={s.composer}>
          <TouchableOpacity
            style={[
              s.sendBtn,
              !canSend &&
                s.sendBtnDisabled,
            ]}
            onPress={publish}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color="#fff"
            />
          </TouchableOpacity>

          <View style={s.inputBox}>
            <TextInput
              style={s.input}
              placeholder="بماذا تفكر الآن؟..."
              placeholderTextColor={C.muted}
              value={text}
              onChangeText={(value) => {
                if (value.length <= MAX_LEN) {
                  setText(value);
                }
              }}
              multiline
              maxLength={MAX_LEN}
            />

            {text.length > MAX_LEN * 0.8 && (
              <Text style={s.charCount}>
                {text.length}/{MAX_LEN}
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={!!commentsPost}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setCommentsPostId(null)
        }
      >
        <View style={s.modalOverlay}>
          <Pressable
            style={s.modalBackdrop}
            onPress={() =>
              setCommentsPostId(null)
            }
          />

          <View style={s.modalSheet}>
            <View style={s.modalHandle} />

            <View style={s.modalHeader}>
              <TouchableOpacity
                onPress={() =>
                  setCommentsPostId(null)
                }
                hitSlop={8}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={C.subText}
                />
              </TouchableOpacity>

              <Text style={s.modalTitle}>
                التعليقات (
                {(commentsPost?.comments || [])
                  .length}
                )
              </Text>

              <View style={s.headerSpacer} />
            </View>

            <FlatList
              ref={commentsListRef}
              data={
                commentsPost?.comments || []
              }
              keyExtractor={(comment, index) =>
                String(
                  comment?.id ??
                    `comment-${index}`
                )
              }
              style={s.commentsList}
              contentContainerStyle={
                (commentsPost?.comments || [])
                  .length === 0
                  ? s.commentsEmptyList
                  : undefined
              }
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: comment }) => (
                <View style={s.commentRow}>
                  <View style={s.commentAvatar}>
                    <Text
                      style={s.commentAvatarTxt}
                    >
                      {(
                        comment?.authorName ||
                        '?'
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View
                    style={s.commentBubble}
                  >
                    <View
                      style={s.commentTop}
                    >
                      <Text
                        style={
                          s.commentAuthor
                        }
                      >
                        {comment?.authorName ||
                          'مستخدم'}
                      </Text>

                      {!!comment?.createdAt && (
                        <Text
                          style={
                            s.commentTime
                          }
                        >
                          {new Date(
                            comment.createdAt
                          ).toLocaleTimeString(
                            'ar-DZ',
                            {
                              hour: '2-digit',
                              minute:
                                '2-digit',
                            }
                          )}
                        </Text>
                      )}
                    </View>

                    <Text
                      style={s.commentText}
                    >
                      {comment?.text || ''}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={s.commentsEmpty}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={42}
                    color={C.muted}
                  />

                  <Text
                    style={s.commentsEmptyText}
                  >
                    لا توجد تعليقات بعد
                  </Text>
                </View>
              }
            />

            <KeyboardAvoidingView
              behavior={
                Platform.OS === 'ios'
                  ? 'padding'
                  : 'height'
              }
            >
              <View
                style={[
                  s.composer,
                  s.modalComposer,
                ]}
              >
                <TouchableOpacity
                  style={[
                    s.sendBtn,
                    !canSendComment &&
                      s.sendBtnDisabled,
                  ]}
                  onPress={sendComment}
                  disabled={!canSendComment}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="send"
                    size={16}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TextInput
                  style={[
                    s.input,
                    s.commentInput,
                  ]}
                  placeholder="اكتب تعليقًا..."
                  placeholderTextColor={
                    C.muted
                  }
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={MAX_LEN}
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
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  headerTitle: {
    color: C.primaryText,
    fontSize: 18,
    fontWeight: '800',
  },

  postCounter: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },

  postCounterTxt: {
    color: C.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  headerSpacer: {
    width: 24,
  },

  list: {
    padding: 16,
    flexGrow: 1,
  },

  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },

  empty: {
    color: C.primaryText,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },

  emptyHint: {
    color: C.muted,
    fontSize: 13,
    marginTop: 6,
  },

  composer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },

  modalComposer: {
    backgroundColor: C.bg,
  },

  inputBox: {
    flex: 1,
    marginRight: 12,
    position: 'relative',
  },

  input: {
    backgroundColor: C.bg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    color: C.primaryText,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textAlign: 'right',
    maxHeight: 100,
    fontSize: 15,
  },

  commentInput: {
    flex: 1,
    marginLeft: 12,
  },

  charCount: {
    position: 'absolute',
    left: 12,
    bottom: 4,
    color: C.muted,
    fontSize: 10,
  },

  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendBtnDisabled: {
    backgroundColor: C.muted,
    opacity: 0.4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },

  modalBackdrop: {
    flex: 1,
  },

  modalSheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    maxHeight: '85%',
    minHeight: '60%',
  },

  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginTop: 12,
  },

  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  modalTitle: {
    color: C.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },

  commentsList: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },

  commentsEmptyList: {
    flexGrow: 1,
  },

  commentRow: {
    flexDirection: 'row-reverse',
    marginBottom: 14,
  },

  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  commentAvatarTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },

  commentBubble: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
  },

  commentTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  commentAuthor: {
    color: C.primaryText,
    fontWeight: '700',
    fontSize: 13,
  },

  commentTime: {
    color: C.muted,
    fontSize: 10,
  },

  commentText: {
    color: C.primaryText,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
    marginTop: 4,
  },

  commentsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 40,
  },

  commentsEmptyText: {
    color: C.muted,
    fontSize: 14,
    marginTop: 10,
  },
});
