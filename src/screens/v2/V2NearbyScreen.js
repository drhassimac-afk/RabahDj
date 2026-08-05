import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket } from '../../api/socket';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', success:'#22C55E' };
const AVATAR_COLORS = ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#22C55E','#06B6D4','#F97316'];

function avatarColor(name = '?') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function UserRow({ item, index }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 320, delay: Math.min(index, 8) * 45, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, delay: Math.min(index, 8) * 45, useNativeDriver: true, speed: 14, bounciness: 6 }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const color = item.avatarColor || avatarColor(item.name);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <View style={s.card}>
        <View style={[s.avatar, { backgroundColor: color }]}>
          <Text style={s.avatarTxt}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{item.name}</Text>
        <View style={s.dotWrap}>
          <Animated.View style={[s.dotPulse, { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.6], outputRange: [0.6, 0] }) }]} />
          <View style={s.dot} />
        </View>
      </View>
    </Animated.View>
  );
}

export default function V2NearbyScreen({ navigation }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const s = getSocket();
    const onUsers = (list) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setUsers(list || []);
    };
    s.on('onlineUsers', onUsers);
    return () => s.off('onlineUsers', onUsers);
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Ionicons name="wifi-outline" size={44} color={C.muted} />
            <Text style={s.empty}>لا يوجد أحد آخر متصل حالياً</Text>
          </View>
        }
        renderItem={({ item, index }) => <UserRow item={item} index={index} />}
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
  list: { padding: 16, flexGrow: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  empty: { color: C.muted, textAlign: 'center', marginTop: 14, fontSize: 14 },
  card: {
    flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  avatarTxt: { color: '#fff', fontWeight: '800' },
  name: { color: C.text, fontSize: 15, flex: 1, textAlign: 'right' },
  dotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.success },
  dotPulse: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: C.success },
});
