import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Alert, TextInput, Modal, SafeAreaView, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRabahSocket } from '../context/SocketContext';

// ✅ إصلاح: استيراد SecureStore بشكل آمن
let SecureStore = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  console.warn('expo-secure-store غير متاح');
}

export default function ProfileScreen({ navigation }) {
  const { userName, avatarColor, onlineUsers, connected } = useRabahSocket();

  const [tapCount, setTapCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [pin, setPin] = useState('');
  const lastTapRef = useRef(0);

  // ✅ إصلاح: الحرف الأول من الاسم الحقيقي
  const avatarLetter = userName
    ? userName.charAt(0).toUpperCase()
    : 'R';

  const openAdminModal = () => {
    setModalVisible(true);
  };

  // ✅ السر: 5 نقرات خلال 3 ثواني
  const handleSecretTrigger = () => {
    const now = Date.now();
    if (now - lastTapRef.current > 3000) {
      setTapCount(1);
    } else {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 5) {
        setTapCount(0);
        openAdminModal();
      }
    }
    lastTapRef.current = now;
  };

  const handleVerifyPin = async () => {
    try {
      let savedPin = '1234'; // ✅ PIN افتراضي

      if (SecureStore) {
        const stored = await SecureStore.getItemAsync('admin_pin');
        if (stored) savedPin = stored;
      }

      if (pin === savedPin) {
        setModalVisible(false);
        setPin('');

        // ✅ إصلاح: التحقق من وجود AdminScreen قبل الانتقال
        if (navigation && navigation.navigate) {
          try {
            navigation.navigate('AdminScreen', { isAdminAuthenticated: true });
          } catch (e) {
            Alert.alert('✅ مرحباً بالمشرف!', 'شاشة الإدارة غير متاحة بعد.');
          }
        }
      } else {
        Alert.alert('❌ خطأ', 'الرمز السري غير صحيح\nالرمز الافتراضي: 1234');
        setPin('');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'حدث خطأ أثناء التحقق');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* الهيدر - 5 نقرات للوحة الإدارة */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleSecretTrigger}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>👤 الملف الشخصي</Text>
          {tapCount > 0 && tapCount < 5 && (
            <Text style={styles.tapHint}>
              {5 - tapCount} نقرات للدخول للإدارة
            </Text>
          )}
        </TouchableOpacity>

        {/* بطاقة الملف الشخصي */}
        <View style={styles.profileCard}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarColor || '#3b82f6' }]}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          {/* ✅ اسم المستخدم الحقيقي من السياق */}
          <Text style={styles.userName}>{userName || 'مستخدم'}</Text>
          <Text style={styles.userStatus}>
            {connected ? '🟢 متصل بالشبكة' : '🔴 غير متصل'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{onlineUsers?.length || 0}</Text>
              <Text style={styles.statLabel}>متصل الآن</Text>
            </View>
          </View>
        </View>

        {/* قائمة المتصلين */}
        {onlineUsers && onlineUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 المتصلون بالشبكة</Text>
            {onlineUsers.map((user, index) => (
              <View key={user.id || index} style={styles.userItem}>
                <View style={[
                  styles.userAvatar,
                  { backgroundColor: user.avatarColor || '#3b82f6' }
                ]}>
                  <Text style={styles.userAvatarText}>
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={styles.userItemName}>{user.name}</Text>
                <View style={styles.onlineDot} />
              </View>
            ))}
          </View>
        )}

        {/* قائمة الخيارات */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={openAdminModal}
          >
            <Ionicons name="chevron-back" size={20} color="#64748b" />
            <Text style={styles.menuText}>لوحة تحكم المشرف</Text>
            <Ionicons
              name="settings-outline"
              size={22}
              color="#3b82f6"
              style={styles.menuIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => Alert.alert(
              '🛠 الدعم الفني',
              'للتواصل مع المطور:\n@drhassimac'
            )}
          >
            <Ionicons name="chevron-back" size={20} color="#64748b" />
            <Text style={styles.menuText}>الدعم الفني والمساعدة</Text>
            <Ionicons
              name="help-circle-outline"
              size={22}
              color="#10b981"
              style={styles.menuIcon}
            />
          </TouchableOpacity>
        </View>

        {/* معلومات التطبيق */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>RabahDj v1.0.0</Text>
          <Text style={styles.appInfoText}>شبكة محلية • بدون إنترنت</Text>
        </View>

      </ScrollView>

      {/* Modal التحقق من PIN */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons
              name="lock-closed"
              size={40}
              color="#3b82f6"
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.modalTitle}>لوحة تحكم المشرف</Text>
            <Text style={styles.modalSubtitle}>أدخل رمز PIN للدخول</Text>

            <TextInput
              style={styles.input}
              placeholder="• • • •"
              placeholderTextColor="#64748b"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pin}
              onChangeText={setPin}
              autoFocus
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSuccess]}
                onPress={handleVerifyPin}
              >
                <Text style={styles.btnText}>✓ دخول</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => { setModalVisible(false); setPin(''); }}
              >
                <Text style={styles.btnText}>✕ إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  tapHint: {
    color: '#3b82f6',
    fontSize: 12,
    marginTop: 5,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#141b2d',
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userStatus: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#141b2d',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'right',
  },
  userItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  userAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userItemName: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 15,
    textAlign: 'right',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 5,
  },
  menuContainer: {
    backgroundColor: '#141b2d',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  menuText: {
    flex: 1,
    textAlign: 'right',
    marginRight: 12,
    color: '#fff',
    fontSize: 15,
  },
  menuIcon: {
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  appInfoText: {
    color: '#334155',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    width: 300,
    padding: 25,
    backgroundColor: '#141b2d',
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 10,
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 22,
    color: '#fff',
    backgroundColor: '#0f172a',
    letterSpacing: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: '#10b981',
  },
  btnCancel: {
    backgroundColor: '#ef4444',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
