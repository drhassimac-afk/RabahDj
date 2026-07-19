import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, Modal, StyleSheet } from 'react-native';

export default function ProfileScreen({ navigation }) {
  const [tapCount, setTapCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [pin, setPin] = useState('');
  const lastTapRef = useRef(0);

  const handleSecretTrigger = () => {
    const now = Date.now();
    
    // إذا مر أكثر من 3 ثوانٍ بين الضغطات، أعد ضبط العداد من جديد
    if (now - lastTapRef.current > 3000) {
      setTapCount(1);
    } else {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      
      // عند الوصول إلى 5 ضغطات متتالية بنجاح
      if (newCount === 5) {
        setTapCount(0); // تصفير العداد
        setModalVisible(true); // إظهار نافذة الـ PIN السرية
      }
    }
    lastTapRef.current = now;
  };

  const handleVerifyPin = () => {
    if (pin === '1234') {
      setModalVisible(false);
      setPin('');
      navigation.navigate('AdminScreen'); // الانتقال إلى لوحة المشرف المخفية
    } else {
      Alert.alert('خطأ', 'الرمز السري غير صحيح');
      setPin('');
    }
  };

  return (
    <View style={styles.container}>
      {/* العنصر الخفي أو النص الذي سيتم الضغط عليه 5 مرات */}
      <TouchableOpacity activeOpacity={1} onPress={handleSecretTrigger} style={styles.profileHeader}>
        <Text style={styles.title}>الملف الشخصي العام</Text>
      </TouchableOpacity>

      {/* نافذة إدخال الرمز السري المنبثقة */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>نظام التحقق الآمن</Text>
            <TextInput
              style={styles.input}
              placeholder="أدخل رمز PIN"
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  profileHeader: { padding: 20, paddingVertical: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: 300, padding: 20, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center' },
  modalTitle: { fontSize: 18, marginBottom: 15, fontWeight: 'bold' },
  input: { width: '100%', height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, paddingHorizontal: 10, textAlign: 'center', marginBottom: 15, fontSize: 18 },
  buttonContainer: { flexDirection: 'row', gap: 10 },
  btn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  btnSuccess: { backgroundColor: '#28a745' },
  btnCancel: { backgroundColor: '#dc3545' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
