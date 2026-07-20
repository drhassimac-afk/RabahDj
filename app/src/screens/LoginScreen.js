import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRabahSocket } from '../context/SocketContext';

export default function LoginScreen({ navigation }) {
  const { connect, connectionError, connected } = useRabahSocket();
  const [ip, setIp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLastCredentials = async () => {
      const savedIp = await AsyncStorage.getItem('rabahdj_last_ip');
      const savedName = await AsyncStorage.getItem('rabahdj_last_name');
      if (savedIp) setIp(savedIp);
      if (savedName) setName(savedName);
    };
    loadLastCredentials();
  }, []);

  useEffect(() => {
    if (connected) {
      setLoading(false);
      navigation.replace('MainTabs');
    }
  }, [connected]);

  const handleConnect = () => {
    if (!ip.trim() || !name.trim()) return;
    setLoading(true);
    connect(ip.trim(), name.trim());
    
    // إيقاف مؤشر التحميل بعد فترة إذا لم يتم الاتصال
    setTimeout(() => {
      setLoading(false);
    }, 6000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.logo}>RabahDj</Text>
          <Text style={styles.subtitle}>الربط بالسيرفر المحلي</Text>

          {connectionError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{connectionError}</Text>
            </View>
          ) : null}

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#141b2d',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ffcc',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontSize: 15,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
    textAlign: 'right',
  },
  btn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
