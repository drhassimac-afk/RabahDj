import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SERVER_URL } from '../../api/config';

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', gold:'#FACC15' };

export default function V2SettingsScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.header}>الإعدادات</Text>

      <View style={s.card}>
        <Ionicons name="server-outline" size={22} color={C.primary} />
        <View style={{ marginRight: 12, flex: 1 }}>
          <Text style={s.label}>عنوان السيرفر</Text>
          <Text style={s.value}>{SERVER_URL.replace('http://', '')}</Text>
        </View>
      </View>

      <TouchableOpacity style={s.card} onPress={() => navigation.navigate('V2AdminLoginScreen')}>
        <Ionicons name="shield-checkmark-outline" size={22} color={C.gold} />
        <Text style={[s.label, { marginRight: 12, flex: 1 }]}>لوحة الإدارة</Text>
        <Ionicons name="chevron-back" size={18} color={C.sub} />
      </TouchableOpacity>

      <Text style={s.ver}>RabahDj — الإصدار 2.0.0</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg, padding: 20 },
  header: { color: C.text, fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'right' },
  card: {
    flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12,
  },
  label: { color: C.sub, fontSize: 13, textAlign: 'right' },
  value: { color: C.text, fontSize: 15, fontWeight: '700', marginTop: 4, textAlign: 'right' },
  ver: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 'auto', marginBottom: 10 },
});
