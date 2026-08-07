import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket } from '../../api/socket';

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', success:'#22C55E' };

export default function V2NearbyScreen({ navigation }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const s = getSocket();
    const onUsers = (list) => setUsers(list || []);
    s.on('onlineUsers', onUsers);
    return () => s.off('onlineUsers', onUsers);
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={24} color={C.sub} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>قريبون مني</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={s.hint}>الأعضاء المتصلون حالياً بنفس الشبكة المحلية 📡</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id || item.name}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>لا يوجد أحد آخر متصل حالياً</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={[s.avatar, { backgroundColor: item.avatarColor || C.primary }]}>
              <Text style={s.avatarTxt}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={s.name}>{item.name}</Text>
            <View style={s.dot} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  hint: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 14, marginBottom: 4 },
  list: { padding: 16 },
  empty: { color: C.muted, textAlign: 'center', marginTop: 60, fontSize: 14 },
  card: {
    flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  avatarTxt: { color: '#fff', fontWeight: '800' },
  name: { color: C.text, fontSize: 15, flex: 1, textAlign: 'right' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.success },
});
