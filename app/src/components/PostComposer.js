import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRabahSocket } from '../context/SocketContext';

export default function PostComposer() {
  const { publishPost, setPosts, userName } = useRabahSocket();
  const [text, setText] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.3,
    });
    // يمكنك إضافة منطق معالجة الصورة هنا لاحقاً
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
      
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={pickImage} style={styles.iconBtn}>
          <Ionicons name="image" size={28} color="#3b82f6" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.publishBtn} onPress={() => publishPost(text)}>
          <Text style={styles.publishText}>نشر</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#141b2d', padding: 16, margin: 12, borderRadius: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  input: { color: '#ffffff', textAlign: 'right', fontSize: 16, marginBottom: 12, minHeight: 40 },
  actionRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  iconBtn: { padding: 8 },
  publishBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  publishText: { color: '#ffffff', fontWeight: 'bold' }
});
