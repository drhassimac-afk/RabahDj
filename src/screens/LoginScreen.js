import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SocketContext } from '../context/SocketContext';

export default function LoginScreen({ navigation }) {
  const { connect } = useContext(SocketContext);
  const [ip, setIp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!ip.trim() || !name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان IP واسم المستخدم');
      return;
    }

    setLoading(true);
    try {
      await connect(ip.trim(), name.trim());
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('فشل الاتصال', 'تأكد من عنوان IP وأن السيرفر يعمل');
      console.error('خطأ الاتصال:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>عنوان IP السيرفر:</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: 192.168.1.5"
          placeholderTextColor="#64748b"
          value={ip}
          onChangeText={setIp}
          keyboardType="numeric"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>اسم المستخدم:</Text>
        <TextInput
          style={styles.input}
          placeholder="ادخل اسمك هنا..."
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
        />
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleConnect}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>دخول والتوصيل</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#fff', marginBottom: 5 },
  input: { backgroundColor: '#1e293b', padding: 15, borderRadius: 10, color: '#fff' },
  btn: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
