import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Dimensions, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AdminScreen() {
  const [secretActive, setSecretActive] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [serverStatus, setServerStatus] = useState(true);

  const handleHeaderTap = () => {
    const newCount = tapCount + 1;
    if (newCount >= 5) {
      setSecretActive(!secretActive);
      setTapCount(0);
      Alert.alert(
        "🕵️‍♂️ تم اختراق النظام الصامت!",
        secretActive ? "تم إغلاق لوحة المطور السرية بنجاح." : "مرحباً بك أيها المطور! تم تفعيل الأزرار المتقدمة والأدوات المخفية."
      );
    } else {
      setTapCount(newCount);
      setTimeout(() => setTapCount(0), 2000);
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
          <Text style={styles.statNumber}>142</Text>
          <Text style={styles.statLabel}>إجمالي المستخدمين</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: serverStatus ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="pulse" size={22} color={serverStatus ? "#34d399" : "#ef4444"} />
          </View>
          <Text style={styles.statNumber}>{serverStatus ? "نشط" : "متوقف"}</Text>
          <Text style={styles.statLabel}>حالة السيرفر</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>العمليات الأساسية</Text>

        <View style={styles.switchRow}>
          <View style={styles.rowLeft}>
            <Ionicons name="power-outline" size={20} color="#fff" />
            <Text style={styles.rowText}>حالة تشغيل التطبيق عمومیًا</Text>
          </View>
          <Switch
            value={serverStatus}
            onValueChange={setServerStatus}
            trackColor={{ false: "#3f3f46", true: "#00ffcc" }}
            thumbColor={"#ffffff"}
          />
        </View>

        <TouchableOpacity style={styles.menuButton} onPress={() => Alert.alert("تنبيه", "جاري تحضير قائمة الإشعارات...")}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          <Text style={styles.menuButtonText}>إرسال تنبيه جماعي (Push Notification)</Text>
          <Ionicons name="chevron-forward" size={16} color="#71717a" style={styles.arrowRight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => Alert.alert("قاعدة البيانات", "تصفح ملف database.json المحلي")}>
          <Ionicons name="server-outline" size={20} color="#fff" />
          <Text style={styles.menuButtonText}>إدارة قاعدة البيانات الداخلية</Text>
          <Ionicons name="chevron-forward" size={16} color="#71717a" style={styles.arrowRight} />
        </TouchableOpacity>

        {secretActive && (
          <View style={styles.secretSection}>
            <View style={styles.secretHeader}>
              <Ionicons name="key-outline" size={18} color="#f59e0b" />
              <Text style={styles.secretTitle}>أدوات المطور المتقدمة (مخفي)</Text>
            </View>

            <TouchableOpacity
              style={[styles.menuButton, styles.dangerButton]}
              onPress={() => Alert.alert("إجراء حاسم", "جاري تصفير وإعادة تعيين السيرفر الفوري...")}
            >
              <Ionicons name="refresh-circle-outline" size={20} color="#fff" />
              <Text style={styles.menuButtonText}>إعادة تعيين السيرفر بالكامل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuButton, styles.secretButton]}
              onPress={() => Alert.alert("مزامنة كربونية", "البيئة الحالية متصلة ومزامنة بالكامل مع Termux.")}
            >
              <Ionicons name="terminal-outline" size={20} color="#fff" />
              <Text style={styles.menuButtonText}>استخراج سجلات الأخطاء (Logs)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 35,
  },
  logoBadge: {
    backgroundColor: 'rgba(0, 255, 204, 0.05)',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 204, 0.15)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#a1a1aa',
    marginTop: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: (width - 55) / 2,
    backgroundColor: '#141417',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#202024',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
  },
  menuContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141417',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#202024',
  },
  menuButtonText: {
    color: '#f4f4f5',
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '500',
  },
  arrowRight: {
    marginLeft: 'auto',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141417',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#202024',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    color: '#f4f4f5',
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '500',
  },
  secretSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#1c1917',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d97706',
  },
  secretHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  secretTitle: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '700',
    marginLeft: 8,
  },
  secretButton: {
    backgroundColor: '#1e3a8a',
    borderColor: '#2563eb',
  },
  dangerButton: {
    backgroundColor: '#451a03',
    borderColor: '#78350f',
  },
});
