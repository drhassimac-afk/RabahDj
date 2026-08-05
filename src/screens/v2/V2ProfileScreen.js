import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket } from '../../api/socket';
import { getCurrentUser } from '../../api/currentUser';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', success:'#22C55E', danger:'#EF4444' };
const AVATAR_COLORS = ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#22C55E','#06B6D4','#F97316'];

function avatarColor(name = '?') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function V2ProfileScreen() {
  const name = getCurrentUser() || 'مستخدم';
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(getSocket().connected);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!connected) { pulse.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [connected]);

  useEffect(() => {
    const s = getSocket();
    const onUsers = (list) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOnlineUsers(list || []);
    };
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
  const myColor = avatarColor(name);
  const cleanMyName = name.trim().toLowerCase();
  const others = onlineUsers.filter(u => (u.name || '').trim().toLowerCase() !== cleanMyName);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.header}>الملف الشخصي</Text>

        <Animated.View style={[s.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View style={[s.avatar, { backgroundColor: myColor }]}>
            <Text style={s.avatarTxt}>{letter}</Text>
          </View>
          <Text style={s.name}>{name}</Text>

          <View style={s.statusRow}>
            <View style={s.dotWrap}>
              {connected && (
                <Animated.View style={[s.dotPulse, { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.5], outputRange: [0.6, 0] }) }]} />
              )}
              <View style={[s.dot, { backgroundColor: connected ? C.success : C.danger }]} />
            </View>
            <Text style={s.status}>{connected ? 'متصل بالشبكة' : 'غير متصل'}</Text>
          </View>

          <View style={s.statBox}>
            <Text style={s.statNum}>{onlineUsers.length}</Text>
            <Text style={s.statLbl}>متصل الآن</Text>
          </View>
        </Animated.View>

        <Animated.View style={[s.section, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View style={s.sectionHeader}>
            <Ionicons name="people-outline" size={16} color={C.sub} />
            <Text style={s.sectionTitle}>المتصلون بالشبكة</Text>
          </View>

          {others.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="moon-outline" size={28} color={C.sub} />
              <Text style={s.emptyTxt}>مفيش حد تاني متصل دلوقتي</Text>
            </View>
          ) : (
            others.map((u, i) => (
              <View key={u.id || i} style={s.userRow}>
                <View style={[s.smallAvatar, { backgroundColor: u.avatarColor || avatarColor(u.name) }]}>
                  <Text style={s.smallAvatarTxt}>{(u.name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={s.userName}>{u.name}</Text>
                <View style={s.onlineDot} />
              </View>
            ))
          )}
        </Animated.View>

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
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarTxt: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { color: C.text, fontSize: 20, fontWeight: '800' },
  statusRow: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 6, marginBottom: 14 },
  dotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotPulse: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  status: { color: C.sub, fontSize: 13 },
  statBox: { backgroundColor: '#0F1830', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 8, alignItems: 'center' },
  statNum: { color: C.primary, fontSize: 20, fontWeight: '800' },
  statLbl: { color: '#64748B', fontSize: 11, marginTop: 2 },
  section: { width: '100%', backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10, gap: 6 },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'right', marginRight: 6 },
  userRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 8 },
  smallAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  smallAvatarTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  userName: { color: C.text, fontSize: 14, flex: 1, textAlign: 'right' },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.success },
  emptyBox: { alignItems: 'center', paddingVertical: 20 },
  emptyTxt: { color: C.sub, fontSize: 13, marginTop: 8 },
  ver: { color: '#64748B', fontSize: 12, marginTop: 20 },
});
