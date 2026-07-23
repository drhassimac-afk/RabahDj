import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRabahSocket } from '../context/SocketContext';

function uploadFileWithProgress(uri, name, mimeType, serverIp, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: name || 'file',
      type: mimeType || 'application/octet-stream',
    });

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `http://${serverIp}:4000/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(new Error('استجابة غير صالحة من السيرفر'));
        }
      } else {
        reject(new Error(`فشل الرفع: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('خطأ في الشبكة أثناء الرفع'));
    xhr.send(formData);
  });
}

export default function PostComposer() {
  const { publishPost, setPosts, userName, serverIp, connected } = useRabahSocket();
  const [text, setText] = useState('');
  const [image, setImage] = useState(null); // معاينة محلية فقط
  const [attachedFile, setAttachedFile] = useState(null); // { uri, name, mimeType, size }
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled) {
      setAttachedFile(null);
      setImage(result.assets[0].uri);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets ? result.assets[0] : result;
      setImage(null);
      setAttachedFile({
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType || 'application/octet-stream',
        size: file.size || 0,
      });
    } catch (err) {
      console.error('خطأ اختيار الملف:', err);
      Alert.alert('خطأ', 'تعذّر اختيار الملف.');
    }
  };

  const removeAttachment = () => {
    setImage(null);
    setAttachedFile(null);
  };

  const handleSend = async () => {
    if (!text.trim() && !image && !attachedFile) return;

    if (!serverIp) {
      Alert.alert('خطأ', 'لا يوجد اتصال بالسيرفر حالياً.');
      return;
    }

    // ✅ نشر نصي فقط - بدون رفع
    if (!image && !attachedFile) {
      if (publishPost) publishPost(text.trim(), null, null);
      setText('');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      if (image) {
        // ✅ رفع الصورة للسيرفر باش توصل لباقي الأجهزة فعلياً
        const response = await uploadFileWithProgress(
          image,
          `image_${Date.now()}.jpg`,
          'image/jpeg',
          serverIp,
          setUploadProgress
        );

        if (publishPost) publishPost(text.trim(), response.url, null);
      } else if (attachedFile) {
        const response = await uploadFileWithProgress(
          attachedFile.uri,
          attachedFile.name,
          attachedFile.mimeType,
          serverIp,
          setUploadProgress
        );

        if (publishPost) {
          publishPost(text.trim(), null, {
            url: response.url,
            name: attachedFile.name,
            mimetype: attachedFile.mimeType,
            size: attachedFile.size,
          });
        }
      }

      setText('');
      setImage(null);
      setAttachedFile(null);
    } catch (err) {
      console.error('خطأ الرفع:', err);
      Alert.alert('فشل الرفع', 'تعذّر رفع الملف. تأكد من الاتصال بالسيرفر.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميغابايت`;
  };

  return (
    <View style={styles.card}>
      <TextInput
        style={styles.input}
        placeholder="بماذا تفكر يا رابح؟"
        placeholderTextColor="#64748b"
        value={text}
        onChangeText={setText}
        multiline
        editable={!uploading}
      />

      {image && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: image }} style={styles.preview} />
          {!uploading && (
            <TouchableOpacity style={styles.removeBtn} onPress={removeAttachment}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {attachedFile && (
        <View style={styles.filePreviewContainer}>
          <Ionicons name="document-attach" size={28} color="#3b82f6" />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>{attachedFile.name}</Text>
            <Text style={styles.fileSize}>{formatSize(attachedFile.size)}</Text>
          </View>
          {!uploading && (
            <TouchableOpacity onPress={removeAttachment}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {uploading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{uploadProgress}% جاري الرفع...</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.iconsRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={pickImage} disabled={uploading}>
            <Ionicons name="image" size={26} color={uploading ? '#475569' : '#3b82f6'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={pickFile} disabled={uploading}>
            <Ionicons name="attach" size={26} color={uploading ? '#475569' : '#8b5cf6'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.publishBtn, uploading && styles.publishBtnDisabled]}
          onPress={handleSend}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.publishText}>نشر</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#141b2d', padding: 15, margin: 10, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  input: { color: '#ffffff', textAlign: 'right', fontSize: 16, marginBottom: 15 },
  imagePreviewContainer: { position: 'relative', marginBottom: 15 },
  preview: { width: '100%', height: 200, borderRadius: 15 },
  removeBtn: { position: 'absolute', top: 5, right: 5 },
  filePreviewContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    gap: 10,
  },
  fileInfo: { flex: 1 },
  fileName: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'right' },
  fileSize: { color: '#64748b', fontSize: 12, textAlign: 'right', marginTop: 2 },
  progressContainer: { marginBottom: 15 },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 6 },
  footer: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 15 },
  iconsRow: { flexDirection: 'row-reverse', gap: 15 },
  iconBtn: { padding: 5 },
  publishBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 20, minWidth: 70, alignItems: 'center' },
  publishBtnDisabled: { backgroundColor: '#334155' },
  publishText: { color: '#ffffff', fontWeight: 'bold' }
});
