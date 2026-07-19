import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Dimensions, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRabahSocket } from '../context/SocketContext';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

export default function AdminScreen({ navigation }) {
  const [secretActive, setSecretActive] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const timerRef = useRef(null);
  const { walkieSettings, onlineUsers, toggleWalkieSystem } = useRabahSocket();

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
  controlLabel: { color: '#fff', fontSize: 14 }
});
