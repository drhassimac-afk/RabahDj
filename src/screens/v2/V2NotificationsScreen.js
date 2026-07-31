import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNotifications, subscribe, clearNotifications } from '../../api/notifications';

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', danger:'#EF4444' };

const ICONS = { post: 'newspaper', radio: 'radio', walkie: 'mic', live: 'videocam', default: 'notifications' };

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  return `منذ ${Math.floor(diff / 3600)} س`;
}

export default function V2NotificationsScreen({ navigation }) {
  const [list, setList] = useState(getNotifications());

  useEffect(() => {
    const unsub = subscribe((items) => setList(items));
    return unsub;
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={24} color={C.sub} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>الإشعارات</Text>
        <TouchableOpacity onPress={clearNotifications}>
          <Ionicons name="trash-outline" size={20} color={C.danger} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>لا توجد إشعارات بعد</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.icon}>
              <Ionicons name={ICONS[item.type] || ICONS.default} size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.text}>{item.text}</Text>
              <Text style={s.time}>{timeAgo(item.time)}</Text>
            </View>
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
  list: { padding: 16 },
  empty: { color: C.muted, textAlign: 'center', marginTop: 60, fontSize: 14 },
  card: {
    flexDirection: 'row-reverse', backgroundColor: C.surface, borderRadius: 14, borderWidth: 1,
    borderColor: C.border, padding: 14, marginBottom: 10, alignItems: 'center',
  },
  icon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#152A47',
    alignItems: 'center', justifyContent: 'center', marginLeft: 12,
  },
  text: { color: C.text, fontSize: 14, textAlign: 'right' },
  time: { color: C.muted, fontSize: 11, marginTop: 4, textAlign: 'right' },
});
