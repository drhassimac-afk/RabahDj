import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const [tapCount, setTapCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [pin, setPin] = useState('');
  const lastTapRef = useRef(0);

  const handleSecretTrigger = () => {
    const now = Date.now();
    if (now - lastTapRef.current > 3000) {
      setTapCount(1);
    } else {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount === 5) {
        setTapCount(0);
        setModalVisible(true);
      }
    }
    lastTapRef.current = now;
  };

  const handleVerifyPin = () => {
    if (pin === '1234') {
      setModalVisible(false);
      setPin('');
      navigation.navigate('AdminScreen');
    } else {
      Alert.alert('خطأ', 'الرمز السري غير صحيح');
      setPin('');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={1} onPress={handleSecretTrigger} style={styles.header}>
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
      </TouchableOpacity>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>R</Text>
        </View>
        <Text style={styles.userName}>رابح</Text>
        <Text style={styles.userStatus}>✨ مستخدم نشط</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="chevron-back" size={20} color="#64748b" />
          <Text style={styles.menuText}>إعدادات الحساب</Text>
          <Ionicons name="settings-outline" size={22} color="#3b82f6" style={styles.menuIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="chevron-back" size={20} color="#64748b" />
          <Text style={styles.menuText}>الدعم الفني والمساعدة</Text>
          <Ionicons name="help-circle-outline" size={22} color="#10b981" style={styles.menuIcon} />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>نظام التحقق الآمن</Text>
            <TextInput
              style={styles.input}
              placeholder="أدخل رمز PIN"
              placeholderTextColor="#64748b"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pin}
              onChangeText={setPin}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.btn, styles.btnSuccess]} onPress={handleVerifyPin}>
                <Text style={styles.btnText}>تأكيد</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => { setModalVisible(false); setPin(''); }}>
                <Text style={styles.btnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', paddingTop: 50 },
  header: { alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  profileCard: { alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 20, padding: 25, borderRadius: 20, marginBottom: 25 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  userStatus: { fontSize: 14, color: '#10b981', marginTop: 5 },
  menuContainer: { backgroundColor: '#1e293b', marginHorizontal: 20, borderRadius: 16, paddingVertical: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#334155' },
  menuText: { flex: 1, textAlign: 'right', marginRight: 15, color: '#fff', fontSize: 16 },
  menuIcon: { marginLeft: 10 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { width: 300, padding: 20, backgroundColor: '#1e293b', borderRadius: 10, alignItems: 'center' },
  modalTitle: { fontSize: 18, marginBottom: 15, fontWeight: 'bold', color: '#fff' },
  input: { width: '100%', height: 40, borderWidth: 1, borderColor: '#334155', borderRadius: 5, paddingHorizontal: 10, textAlign: 'center', marginBottom: 15, fontSize: 18, color: '#fff' },
  buttonContainer: { flexDirection: 'row', gap: 10 },
  btn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  btnSuccess: { backgroundColor: '#28a745' },
  btnCancel: { backgroundColor: '#dc3545' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
