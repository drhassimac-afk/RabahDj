import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useRabahSocket } from '../context/SocketContext';

function InlineVideoPreview({ url }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  return (
    <VideoView
      style={styles.postImage}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميغابايت`;
}

function fileIconFor(mimetype) {
  if (!mimetype) return 'document-outline';
  if (mimetype.includes('pdf')) return 'document-text-outline';
  if (mimetype.startsWith('audio/')) return 'musical-notes-outline';
  if (mimetype.includes('zip') || mimetype.includes('android.package')) return 'archive-outline';
  return 'document-attach-outline';
}

export default function PostCard({ post }) {
  const { toggleLike, addComment, userName, mySocketId } = useRabahSocket();
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [downloading, setDownloading] = useState(false);

  if (!post) return null;

  const currentUser = mySocketId || userName || 'رابح';
  const likesList = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = likesList.includes(currentUser);
  const likesCount = likesList.length;
  const commentsList = Array.isArray(post.comments) ? post.comments : [];
  const commentsCount = commentsList.length;

  const authorName = typeof post.author === 'string' && post.author ? post.author : 'رابح';
  const initialLetter = authorName.charAt(0).toUpperCase() || 'R';

  const file = post.file || null;
  const isImageFile = file?.mimetype?.startsWith('image/');
  const isVideoFile = file?.mimetype?.startsWith('video/');

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText('');
  };

  const handleDownload = async (targetFile) => {
    if (!targetFile?.url) return;
    setDownloading(true);
    try {
      const safeName = targetFile.name || `rabahdj_file_${Date.now()}`;
      const localUri = FileSystem.cacheDirectory + safeName;
      const downloadResult = await FileSystem.downloadAsync(targetFile.url, localUri);

      const mimetype = targetFile.mimetype || '';
      if (mimetype.startsWith('image/') || mimetype.startsWith('video/')) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
          Alert.alert('✅ تم الحفظ', 'تم حفظ الملف في معرض الصور والفيديو.');
        } else {
          Alert.alert('إذن مطلوب', 'يجب السماح بالوصول لمعرض الصور لحفظ الملف.');
        }
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          Alert.alert('✅ تم التنزيل', `تم حفظ الملف في:\n${downloadResult.uri}`);
        }
      }
    } catch (err) {
      console.error('خطأ تنزيل الملف:', err);
      Alert.alert('خطأ', 'تعذّر تنزيل الملف. تأكد من الاتصال بالسيرفر.');
    } finally {
      setDownloading(false);
    }
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

      {/* صورة المنشور المباشرة (image) */}
      {post.image && !post.image.includes("404") ? (
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      {/* الملف المرفق (file) */}
      {file && isImageFile ? (
        <View>
          <Image source={{ uri: file.url }} style={styles.postImage} resizeMode="cover" />
          <TouchableOpacity
            style={styles.downloadOverlay}
            onPress={() => handleDownload(file)}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="download-outline" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      ) : file && isVideoFile ? (
        <View>
          <InlineVideoPreview url={file.url} />
          <TouchableOpacity
            style={styles.downloadOverlay}
            onPress={() => handleDownload(file)}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="download-outline" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      ) : file ? (
        <View style={styles.fileCard}>
          <Ionicons name={fileIconFor(file.mimetype)} size={30} color="#3b82f6" />
          <View style={styles.fileCardInfo}>
            <Text style={styles.fileCardName} numberOfLines={1}>{file.name}</Text>
            <Text style={styles.fileCardSize}>{formatFileSize(file.size)}</Text>
          </View>
          <TouchableOpacity
            style={styles.fileDownloadBtn}
            onPress={() => handleDownload(file)}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
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

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setCommentsVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#94a3b8" />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal التعليقات */}
      <Modal
        visible={commentsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentsVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>التعليقات ({commentsCount})</Text>
              <TouchableOpacity onPress={() => setCommentsVisible(false)}>
                <Ionicons name="close" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={commentsList}
              keyExtractor={(item, index) => item.id?.toString() || index.toString()}
              style={styles.commentsList}
              ListEmptyComponent={
                <Text style={styles.emptyComments}>لا توجد تعليقات بعد. كن أول من يعلّق!</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={[styles.commentAvatar, { backgroundColor: item.avatarColor || '#3b82f6' }]}>
                    <Text style={styles.commentAvatarText}>
                      {(item.authorName || '؟').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>{item.authorName || 'مستخدم'}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
            />

            <View style={styles.inputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="اكتب تعليقاً..."
                placeholderTextColor="#64748b"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendComment}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  downloadOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  fileCardInfo: { flex: 1 },
  fileCardName: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'right' },
  fileCardSize: { color: '#64748b', fontSize: 12, textAlign: 'right', marginTop: 2 },
  fileDownloadBtn: {
    backgroundColor: '#3b82f6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12,
    marginBottom: 8,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentsList: {
    flex: 1,
  },
  emptyComments: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
  commentItem: {
    flexDirection: 'row-reverse',
    marginBottom: 14,
    gap: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
  },
  commentAuthor: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 2,
  },
  commentText: {
    color: '#e2e8f0',
    fontSize: 13,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    textAlign: 'right',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
