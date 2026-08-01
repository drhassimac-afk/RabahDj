import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket } from '../../api/socket';
import { getCurrentUser } from '../../api/currentUser';

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8' };

export default function V2ProfileScreen() {
  const name = getCurrentUser() || 'مستخدم';
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(getSocket().connected);

  useEffect(() => {
    const s = getSocket();
    const onUsers = (list) => setOnlineUsers(list || []);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('onlineUsers', onUsers);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    return () => {
      s.off('onlineUsers', onUsers);
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  const letter = name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.header}>الملف الشخصي</Text>
        <View style={s.card}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{letter}</Text></View>
          <Text style={s.name}>{name}</Text>
          <Text style={s.status}>{connected ? '🟢 متصل بالشبكة' : '🔴 غير متصل'}</Text>
          <View style={s.statBox}>
            <Text style={s.statNum}>{onlineUsers.length}</Text>
            <Text style={s.statLbl}>متصل الآن</Text>
          </View>
        </View>

        {onlineUsers.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>المتصلون بالشبكة</Text>
            {onlineUsers.map((u, i) => (
              <View key={u.id || i} style={s.userRow}>
                <View style={[s.smallAvatar, { backgroundColor: u.avatarColor || C.primary }]}>
                  <Text style={s.smallAvatarTxt}>{(u.name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={s.userName}>{u.name}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.ver}>RabahDj — الإصدار 2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, alignItems: 'center' },
  header: { color: C.text, fontSize: 22, fontWeight: '800', marginBottom: 20, alignSelf: 'flex-end' },
  card: {
    width: '100%', backgroundColor: C.surface, borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 20,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarTxt: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { color: C.text, fontSize: 20, fontWeight: '800' },
  status: { color: C.sub, fontSize: 13, marginTop: 4, marginBottom: 14 },
  statBox: { backgroundColor: '#0F1830', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 8, alignItems: 'center' },
  statNum: { color: C.primary, fontSize: 20, fontWeight: '800' },
  statLbl: { color: '#64748B', fontSize: 11, marginTop: 2 },
  section: { width: '100%', backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 10, textAlign: 'right' },
  userRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 6 },
  smallAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  smallAvatarTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  userName: { color: C.text, fontSize: 14 },
  ver: { color: '#64748B', fontSize: 12, marginTop: 20 },
});
