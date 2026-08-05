import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNotifications, subscribe, clearNotifications, removeNotification } from '../../api/notifications';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', danger:'#EF4444' };
const TYPE_META = {
  post:   { icon: 'newspaper',  color: '#3B82F6' },
  radio:  { icon: 'radio',      color: '#A855F7' },
  walkie: { icon: 'mic',        color: '#F59E0B' },
  live:   { icon: 'videocam',   color: '#EF4444' },
  default:{ icon: 'notifications', color: C.primary },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  return `منذ ${Math.floor(diff / 3600)} س`;
}

export default function V2NotificationsScreen({ navigation }) {
  const [list, setList] = useState(getNotifications());

  useEffect(() => {
    const unsub = subscribe((items) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setList(items);
    });
    return unsub;
  }, []);

  const handleClearAll = () => {
    if (list.length === 0) return;
    Alert.alert('مسح كل الإشعارات', 'هل أنت متأكد؟ لا يمكن التراجع.', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'مسح الكل', style: 'destructive', onPress: clearNotifications },
    ]);
  };

  const handleRemove = (id) => removeNotification(id);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-forward" size={24} color={C.sub} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>الإشعارات</Text>
        <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={20} color={list.length ? C.danger : C.muted} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Ionicons name="notifications-off-outline" size={44} color={C.muted} />
            <Text style={s.empty}>لا توجد إشعارات بعد</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = TYPE_META[item.type] || TYPE_META.default;
          return (
            <View style={s.card}>
              <View style={[s.icon, { backgroundColor: `${meta.color}22` }]}>
                <Ionicons name={meta.icon} size={20} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.text}>{item.text}</Text>
                <Text style={s.time}>{timeAgo(item.time)}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemove(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
          );
        }}
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
  list: { padding: 16, flexGrow: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty: { color: C.muted, textAlign: 'center', marginTop: 14, fontSize: 14 },
  card: {
    flexDirection: 'row-reverse', backgroundColor: C.surface, borderRadius: 14, borderWidth: 1,
    borderColor: C.border, padding: 14, marginBottom: 10, alignItems: 'center',
  },
  icon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginLeft: 12,
  },
  text: { color: C.text, fontSize: 14, textAlign: 'right' },
  time: { color: C.muted, fontSize: 11, marginTop: 4, textAlign: 'right' },
});
