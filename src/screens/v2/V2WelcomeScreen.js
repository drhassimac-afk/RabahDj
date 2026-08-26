import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNotifications, subscribe } from '../../api/notifications';
import { getSocket } from '../../api/socket';
import V2_THEME from '../../theme/v2Theme';

const { colors: C, spacing: S, radius: R, typography: T, shadows: SH } = V2_THEME;

function FeatureTile({ f, index }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 300,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        delay: index * 70,
        useNativeDriver: true,
        speed: 14,
        bounciness: 5,
      }),
    ]).start();
  }, [fade, slide, index]);

  if (f.placeholder) {
    return <View style={{ width: '31%' }} />;
  }

  return (
    <Animated.View
      style={{
        opacity: fade,
        transform: [{ translateY: slide }],
        width: '31%',
      }}
    >
      <TouchableOpacity
        style={[styles.tile, { borderColor: `${f.color}30` }]}
        onPress={f.onPress}
        activeOpacity={0.88}
      >
        <View style={styles.iconOuter}>
          <LinearGradient
            colors={[f.color, `${f.color}99`]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.iconWrap, { shadowColor: f.color }]}
          >
            <Ionicons name={f.icon} size={27} color="#FFFFFF" />
          </LinearGradient>
          {!!f.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText} allowFontScaling={false}>
                {f.badge > 9 ? '9+' : f.badge}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={styles.tileTitle}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          maxFontSizeMultiplier={1.15}
        >
          {f.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function V2WelcomeScreen({ navigation }) {
  const [notifCount, setNotifCount] = useState(getNotifications().length);
  const [connected, setConnected] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = subscribe((items) => setNotifCount(items.length));
    const sock = getSocket();
    setConnected(sock.connected);
    const onC = () => setConnected(true);
    const onD = () => setConnected(false);
    sock.on('connect', onC);
    sock.on('disconnect', onD);
    return () => {
      unsub();
      sock.off('connect', onC);
      sock.off('disconnect', onD);
    };
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const glow = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.45],
  });

  const FEATURES = [
    { icon: 'videocam-outline', label: 'بث مباشر', color: '#A855F7', bg: '#2A1B3D', onPress: () => navigation.navigate('LiveStream') },
    { icon: 'film-outline', label: 'سينما وتلفاز', color: '#F43F5E', bg: '#3D0F1A', onPress: () => navigation.navigate('Cinema') },
    { icon: 'mic-outline', label: 'تخاطب لاسلكي', color: '#14B8A6', bg: '#0F3B36', onPress: () => navigation.navigate('Walkie') },
    { icon: 'chatbubbles-outline', label: 'محادثات فورية', color: '#3B82F6', bg: '#152A47', onPress: () => navigation.navigate('V2LoginScreen') },
    { icon: 'game-controller-outline', label: 'ألعاب محلية', color: '#F59E0B', bg: '#3D2E14', onPress: () => navigation.navigate('Games') },
    { icon: 'notifications-outline', label: 'الإشعارات', color: '#FACC15', bg: '#3D2E0A', onPress: () => navigation.navigate('Notifications'), badge: notifCount },
    { icon: 'folder-open-outline', label: 'مشاركة ملفات', color: '#A855F7', bg: '#2A1B3D', onPress: () => navigation.navigate('Files') },
    { icon: 'location-outline', label: 'قريبون مني', color: '#22C55E', bg: '#0F3B2A', onPress: () => navigation.navigate('Nearby') },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Animated.View
            style={[
              styles.heroRing,
              { transform: [{ scale: scale }], opacity: glow },
            ]}
          />
          <View style={styles.heroInner}>
            <Ionicons name="radio-outline" size={62} color={C.primary} />
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Rabah</Text>
          <Text style={[styles.title, { color: C.primary }]}>Dj</Text>
        </View>
        <View style={styles.titleUnderline} />
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>شبكتك الاجتماعية المحلية</Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: connected ? C.success : C.danger },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: connected ? C.success : C.danger },
            ]}
          >
            {connected ? 'متصل بالشبكة المحلية' : 'غير متصل'}
          </Text>
        </View>

        <Text style={styles.desc} maxFontSizeMultiplier={1.2}>
          تواصل، شارك، وابثّ صوتاً وفيديو مع أصدقائك عبر شبكتك المحلية بدون إنترنت
        </Text>

        <View style={styles.grid}>
          {FEATURES.map((f, i) => (
            <FeatureTile key={f.label} f={f} index={i} />
          ))}
          {FEATURES.length % 3 !== 0 &&
            Array.from({ length: 3 - (FEATURES.length % 3) }).map((_, i) => (
              <FeatureTile key={`filler-${i}`} f={{ placeholder: true }} index={0} />
            ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('V2LoginScreen')}
          activeOpacity={0.92}
        >
          <Text style={styles.actionBtnText}>ابدأ الآن</Text>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('V2AdminLoginScreen')}
          style={styles.adminRow}
        >
          <Text style={styles.adminText}>🛡️ دخول المسؤول</Text>
        </TouchableOpacity>

        <Text style={styles.version}>الإصدار 2.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: S.xl,
    paddingTop: S.lg,
    paddingBottom: S.xxl,
  },
  hero: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: C.primary,
  },
  heroInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SH.floating,
  },
  title: {
    color: C.text,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    marginTop: S.lg,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.primary,
    marginTop: 8,
  },
  subtitle: {
    color: C.primary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: S.xs,
  },
  statusRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: S.md,
    paddingHorizontal: S.md,
    paddingVertical: 6,
    borderRadius: R.pill,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSoft,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  desc: {
    color: C.textMuted,
    fontSize: T.body,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: S.md,
  },
  grid: {
    width: '100%',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: S.xl,
  },
  tile: {
    width: '100%',
    backgroundColor: C.surface,
    borderRadius: R.lg,
    paddingVertical: S.md + 4,
    paddingHorizontal: S.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderSoft,
    marginBottom: S.md,
    minHeight: 116,
    ...SH.card,
  },
  iconOuter: {
    position: 'relative',
    marginBottom: S.sm + 2,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  tileTitle: {
    color: C.text,
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: C.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: C.surface,
  },
  badgeText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: S.xl,
    paddingBottom: S.xl,
    paddingTop: S.md,
  },
  actionBtn: {
    backgroundColor: C.primary,
    height: 56,
    borderRadius: R.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    ...SH.floating,
  },
  actionBtnText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '800',
  },
  adminRow: {
    marginTop: S.md,
    alignItems: 'center',
  },
  adminText: {
    color: C.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  version: {
    color: C.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: S.md,
  },
});