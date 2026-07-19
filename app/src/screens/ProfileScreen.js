import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
      </View>

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
  menuIcon: { marginLeft: 10 }
});
