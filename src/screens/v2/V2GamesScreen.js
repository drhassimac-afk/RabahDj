import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket } from '../../api/socket';

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', gold:'#FACC15', danger:'#EF4444', success:'#22C55E' };

const GAMES = [
  {
    id: 'xo',
    title: 'إكس أو',
    subtitle: 'اللعبة الكلاسيكية للاعبين',
    icon: 'radio-button-on',
    color: '#3B82F6',
    rating: 4.5,
    route: 'XOGame',
    available: true,
  },
  {
    id: 'memory',
    title: 'ذاكرة',
    subtitle: 'اختبر ذاكرتك',
    icon: 'sparkles',
    color: '#A855F7',
    rating: 4.2,
    available: false,
  },
  {
    id: 'cards',
    title: 'ورق',
    subtitle: 'ألعاب الورق',
    icon: 'albums',
    color: '#EF4444',
    rating: 4.3,
    available: false,
  },
  {
    id: 'quiz',
    title: 'مسابقة',
    subtitle: 'أسئلة عامة',
    icon: 'help-circle',
    color: '#22C55E',
    rating: 4.7,
    available: false,
  },
];

function PressableScale({ style, onPress, disabled, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => !disabled && Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={style} onPress={onPress} disabled={disabled} activeOpacity={0.8} onPressIn={onIn} onPressOut={onOut}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function V2GamesScreen({ navigation }) {
  const sock = useRef(getSocket());
  const [onlineCount, setOnlineCount] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const s = sock.current;
    const onInit = (d) => setOnlineCount((d.onlineUsers || []).length);
    const onUsers = (list) => setOnlineCount((list || []).length);
    s.on('init', onInit);
    s.on('onlineUsers', onUsers);
    return () => { s.off('init', onInit); s.off('onlineUsers', onUsers); };
  }, []);

  const openGame = (game) => {
    if (!game.available) return;
    navigation.navigate(game.route);
  };

  const availableCount = GAMES.filter((g) => g.available).length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-forward" size={24} color={C.sub} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>ألعاب</Text>
        <View style={s.headerBadge}>
          <Ionicons name="game-controller" size={20} color="#fff" />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fade }}>
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Ionicons name="trophy" size={26} color={C.gold} />
              <Text style={s.statValue}>{availableCount}</Text>
              <Text style={s.statLabel}>لعبة متاحة</Text>
            </View>
            <View style={s.statCard}>
              <Ionicons name="people" size={26} color={C.primary} />
              <Text style={s.statValue}>{onlineCount}</Text>
              <Text style={s.statLabel}>لاعب متصل الآن</Text>
            </View>
          </View>

          <Text style={s.sectionTitle}>الألعاب المتاحة</Text>

          <View style={s.grid}>
            {GAMES.map((game) => (
              <PressableScale key={game.id} style={s.gameCard} onPress={() => openGame(game)} disabled={!game.available}>
                <View style={[s.gameIcon, { backgroundColor: game.color }, !game.available && { opacity: 0.5 }]}>
                  <Ionicons name={game.icon} size={30} color="#fff" />
                </View>
                <Text style={[s.gameTitle, !game.available && { color: C.muted }]}>{game.title}</Text>
                <Text style={s.gameSub} numberOfLines={1}>{game.subtitle}</Text>
                {game.available ? (
                  <View style={s.gameFooter}>
                    <Ionicons name="star" size={12} color={C.gold} />
                    <Text style={s.gameRating}>{game.rating}</Text>
                    <Ionicons name="people" size={12} color={C.sub} style={{ marginRight: 8 }} />
                    <Text style={s.gamePlayers}>{onlineCount}</Text>
                  </View>
                ) : (
                  <View style={s.soonBadge}>
                    <Text style={s.soonTxt}>قريبًا</Text>
                  </View>
                )}
              </PressableScale>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 20, fontWeight: '800' },
  headerBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#B45309', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row-reverse', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', paddingVertical: 20, gap: 8,
  },
  statValue: { color: C.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: C.sub, fontSize: 12, fontWeight: '600' },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '800', textAlign: 'right', marginBottom: 14 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  gameCard: {
    width: '48%', backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', paddingVertical: 18, paddingHorizontal: 10, marginBottom: 14,
  },
  gameIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  gameTitle: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  gameSub: { color: C.sub, fontSize: 11, textAlign: 'center', marginBottom: 10 },
  gameFooter: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  gameRating: { color: C.gold, fontSize: 12, fontWeight: '700', marginRight: 4 },
  gamePlayers: { color: C.sub, fontSize: 12, fontWeight: '600', marginRight: 4 },
  soonBadge: { backgroundColor: C.elevated || '#1E2A3D', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  soonTxt: { color: C.muted, fontSize: 11, fontWeight: '700' },
});
