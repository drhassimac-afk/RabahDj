import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRabahSocket } from '../context/SocketContext';

export default function PostComposer() {
  const { publishPost, setPosts, userName } = useRabahSocket();
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSend = () => {
    if (!text.trim() && !image) return;
    const newPost = {
      id: Date.now().toString(),
      author: userName || 'رابح',
      text: text.trim(),
      image: image,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
    if (publishPost) publishPost(text.trim(), image);
    setText('');
    setImage(null);
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
      />
      
      {image && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: image }} style={styles.preview} />
          <TouchableOpacity style={styles.removeBtn} onPress={() => setImage(null)}>
            <Ionicons name="close-circle" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.iconBtn} onPress={pickImage}>
          <Ionicons name="image" size={28} color="#3b82f6" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.publishBtn} onPress={handleSend}>
          <Text style={styles.publishText}>نشر</Text>
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
  footer: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 15 },
  iconBtn: { padding: 5 },
  publishBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 20 },
  publishText: { color: '#ffffff', fontWeight: 'bold' }
});
