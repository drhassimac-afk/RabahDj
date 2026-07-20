import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Dimensions, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRabahSocket } from '../context/SocketContext';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

export default function AdminScreen({ route, navigation }) {
  const isAdminAuthenticated = route?.params?.isAdminAuthenticated;
  const [secretActive, setSecretActive] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [newPin, setNewPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const timerRef = useRef(null);
  const { walkieSettings, onlineUsers, toggleWalkieSystem, muteWalkieUser } = useRabahSocket();

  useEffect(() => {
    if (isAdminAuthenticated) {
      setSecretActive(true);
    }
  }, [isAdminAuthenticated]);

  const handleHeaderTap = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const newCount = tapCount + 1;

    if (newCount >= 5) {
      setTapCount(0);

      const savedPin = await SecureStore.getItemAsync('user_pin') || "1234";

      Alert.prompt(
        "🔒 تأكيد الهوية الأمنية",
        "الرجاء إدخال الرمز السري الخاص بك لتفعيل الوضع المتقدم:",
        [
          { text: "إلغاء", style: "cancel" },
          {
            text: "دخول",
            onPress: (password) => {
              if (password === savedPin) {
                setSecretActive(true);
                Alert.alert("✅ نجاح", "مرحباً بك أيها المسؤول! تم فتح الأدوات المخفية بنجاح.");
              } else {
                Alert.alert("❌ خطأ", "الرمز السري غير صحيح!");
              }
            }
          }
        ],
        "secure-text"
      );
    } else {
      setTapCount(newCount);
      timerRef.current = setTimeout(() => {
        setTapCount(0);
      }, 2000);
    }
  };

  const handleChangePin = async () => {
    if (newPin.length !== 4) {
      Alert.alert("خطأ", "يجب أن يتكون رمز PIN من 4 أرقام exact.");
      return;
    }
    await SecureStore.setItemAsync('user_pin', newPin);
    Alert.alert("✅ تم بنجاح", "تم تغيير رمز PIN الإداري بنجاح!");
    setNewPin('');
    setShowPinInput(false);
  };

  const mutedUsers = walkieSettings?.mutedUsers || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity activeOpacity={1} onPress={handleHeaderTap} style={styles.header}>
        <View style={styles.logoBadge}>
          <Ionicons name="shield-checkmark" size={28} color="#00ffcc" />
        </View>
        <Text style={styles.headerTitle}>لوحة التحكم الإدارية</Text>
        <Text style={styles.headerSubtitle}>إدارة تطبيق RabahDj ومراقبة البيانات</Text>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 255, 204, 0.1)' }]}>
            <Ionicons name="people" size={22} color="#00ffcc" />
          </View>
          <Text style={styles.statNumber}>{onlineUsers?.length || 0}</Text>
          <Text style={styles.statLabel}>المتصلون الآن</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(110, 68, 255, 0.1)' }]}>
            <Ionicons name="document-text" size={22} color="#6e44ff" />
          </View>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>إجمالي المنشورات</Text>
        </View>
      </View>

      {secretActive && (
        <View style={styles.advancedSection}>
          <Text style={styles.sectionTitle}>🛠️ أدوات المطور المتقدمة</Text>

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>نظام الـ Walkie-Talkie الجماعي</Text>
            <Switch
              value={walkieSettings?.enabled}
              onValueChange={toggleWalkieSystem}
              trackColor={{ false: "#334155", true: "#00ffcc" }}
              thumbColor={walkieSettings?.enabled ? "#fff" : "#cbd5e1"}
            />
          </View>

          <View style={styles.divider} />

          <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 10 }]}>🎙️ كتم أفراد الـ Walkie-Talkie</Text>

          {(!onlineUsers || onlineUsers.length === 0) ? (
            <Text style={styles.emptyText}>لا يوجد مستخدمون متصلون حالياً</Text>
          ) : (
            onlineUsers.map((user, index) => {
              const username = typeof user === 'string' ? user : user.username || user.name || `User ${index}`;
              const isMuted = mutedUsers.includes(username);

              return (
                <View key={index} style={styles.userRow}>
                  <View style={styles.userInfo}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.userNameText}>{username}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.muteBtn, isMuted ? styles.mutedBtnStyle : styles.unmutedBtnStyle]}
                    onPress={() => muteWalkieUser(username, !isMuted)}
                  >
                    <Ionicons name={isMuted ? "mic-off" : "mic"} size={16} color="#fff" />
                    <Text style={styles.muteBtnText}>{isMuted ? "مكتوم" : "كتم"}</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.changePinToggle}
            onPress={() => setShowPinInput(!showPinInput)}
          >
            <Ionicons name="key-outline" size={18} color="#00ffcc" />
            <Text style={styles.changePinToggleText}>تغيير رمز الـ PIN الإداري</Text>
          </TouchableOpacity>

          {showPinInput && (
            <View style={styles.pinChangeBox}>
              <TextInput
                style={styles.pinInput}
                placeholder="أدخل 4 أرقام جديدة"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                maxLength={4}
                value={newPin}
                onChangeText={setNewPin}
                secureTextEntry
              />
              <TouchableOpacity style={styles.savePinBtn} onPress={handleChangePin}>
                <Text style={styles.savePinBtnText}>حفظ الرمز</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', paddingTop: 50 },
  contentContainer: { paddingBottom: 40 },
  header: { alignItems: 'center', marginVertical: 20, paddingHorizontal: 20 },
  logoBadge: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0, 255, 204, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 5 },
  statsContainer: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 25 },
  statCard: { width: (width - 55) / 2, backgroundColor: '#141b2d', borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  advancedSection: { backgroundColor: '#141b2d', marginHorizontal: 20, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#00ffcc', marginBottom: 15, textAlign: 'right' },
  controlRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  controlLabel: { color: '#fff', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 15 },
  userRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 10, marginBottom: 8 },
  userInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  userNameText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  muteBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 5 },
  unmutedBtnStyle: { backgroundColor: '#ef4444' },
  mutedBtnStyle: { backgroundColor: '#475569' },
  muteBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#64748b', textAlign: 'center', fontSize: 13, marginVertical: 10 },
  changePinToggle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 8 },
  changePinToggleText: { color: '#00ffcc', fontSize: 14, fontWeight: '600' },
  pinChangeBox: { flexDirection: 'row-reverse', gap: 10, marginTop: 10, alignItems: 'center' },
  pinInput: { flex: 1, height: 42, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, color: '#fff', textAlign: 'center' },
  savePinBtn: { backgroundColor: '#00ffcc', paddingHorizontal: 15, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  savePinBtnText: { color: '#0b0f19', fontWeight: 'bold', fontSize: 13 }
});
