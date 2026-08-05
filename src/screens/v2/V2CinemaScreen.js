import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SERVER_URL } from '../../api/config';
import V2_THEME from '../../theme/v2Theme';

const C = V2_THEME.colors;
const S = V2_THEME.spacing;
const R = V2_THEME.radius;
const SH = V2_THEME.shadows;

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

const CATEGORIES = ['الكل', 'أفلام', 'كوميديا', 'مسلسلات', 'وثائقي'];

const DEMO_ITEMS = [
  {
    id: 'demo-1',
    title: 'Big Buck Bunny',
    genre: 'رسوم متحركة',
    duration: 'تجريبي',
    category: 'أفلام',
    emoji: '🎬',
    color: '#2F3B7A',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 'demo-2',
    title: 'Elephants Dream',
    genre: 'خيال',
    duration: 'تجريبي',
    category: 'أفلام',
    emoji: '🎞️',
    color: '#6B5B1E',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
];

function getCategory(fileName) {
  const n = fileName.toLowerCase();
  if (n.includes('comedy') || n.includes('كوميديا') || n.includes('ضحك')) return 'كوميديا';
  if (n.includes('series') || n.includes('episode') || n.includes('مسلسل')) return 'مسلسلات';
  if (n.includes('documentary') || n.includes('وثائقي') || n.includes('nature')) return 'وثائقي';
  return 'أفلام';
}

function getEmoji(cat) {
  if (cat === 'كوميديا') return '😂';
  if (cat === 'مسلسلات') return '🎭';
  if (cat === 'وثائقي') return '🌍';
  return '🎬';
}

function getColor(cat) {
  if (cat === 'كوميديا') return '#6D2E7A';
  if (cat === 'مسلسلات') return '#7A2E2E';
  if (cat === 'وثائقي') return '#1E6B3A';
  return '#30457C';
}

function getTitle(fileName) {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

function normalizeServerFiles(data) {
  const files = Array.isArray(data) ? data : data?.files || data?.media || [];
  return files
    .map((f, i) => {
      const name = typeof f === 'string' ? f : f?.name || f?.filename || f?.file;
      if (!name) return null;
      const cat = getCategory(name);
      return {
        id: `srv-${i}-${name}`,
        title: getTitle(name),
        genre: cat,
        duration: 'من الشبكة',
        category: cat,
        emoji: getEmoji(cat),
        color: getColor(cat),
        video: `${SERVER_URL}/media/${encodeURIComponent(name)}`,
        remote: true,
      };
    })
    .filter(Boolean);
}

function PlayerModal({ item, onClose }) {
  const player = useVideoPlayer(item.video, (vp) => vp.play());
  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={stylesPlayer.container}>
        <TouchableOpacity style={stylesPlayer.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
        <VideoView style={stylesPlayer.video} player={player} nativeControls contentFit="contain" allowsFullscreen allowsPictureInPicture />
        <Text style={stylesPlayer.title}>{item.title}</Text>
        <Text style={stylesPlayer.subtitle}>{item.category} · {item.genre}</Text>
      </SafeAreaView>
    </Modal>
  );
}

export default function V2CinemaScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('الكل');
  const [playing, setPlaying] = useState(null);
  const [serverItems, setServerItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setServerError('');
        const res = await fetch(`${SERVER_URL}/media-list`);
        if (!res.ok) throw new Error('fail');
        const data = await res.json();
        if (mounted) setServerItems(normalizeServerFiles(data));
      } catch (e) {
        console.log('Cinema load error:', e);
        if (mounted) setServerError('تعذر تحميل ملفات السيرفر');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const all = useMemo(() => [...DEMO_ITEMS, ...serverItems], [serverItems]);
  const filtered = useMemo(() => (category === 'الكل' ? all : all.filter((i) => i.category === category)), [all, category]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: item.color }]}
      onPress={() => setPlaying(item)}
    >
      <View style={styles.cardBody}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        {item.remote && (
          <View style={styles.badge}>
            <Ionicons name="wifi" size={12} color="#fff" />
            <Text style={styles.badgeText}>الشبكة</Text>
          </View>
        )}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>{item.duration} · {item.genre}</Text>
      </View>
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>سينما وتلفاز</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.chip, category === cat && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]} numberOfLines={1}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.infoRow}>
          <Text style={styles.infoText}>المتاح على شبكتك ({filtered.length})</Text>
          {loading && <ActivityIndicator size="small" color={C.primary} />}
        </View>

        {!!serverError && <Text style={styles.errorText}>{serverError}</Text>}

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          numColumns={2}
          renderItem={renderItem}
          columnWrapperStyle={styles.column}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 24 }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="film-outline" size={48} color={C.textDim} />
              <Text style={styles.emptyTitle}>لا يوجد محتوى</Text>
              <Text style={styles.emptySub}>أضف ملفات MP4 إلى مجلد media</Text>
            </View>
          }
        />

        {playing && <PlayerModal item={playing} onClose={() => setPlaying(null)} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  title: { color: C.text, fontSize: 24, fontWeight: '800', textAlign: 'right' },

  chips: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: C.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: C.borderSoft,
    minWidth: 72,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  chipText: { color: C.textMuted, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: C.white },

  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 8,
  },
  infoText: { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  errorText: { color: C.danger, textAlign: 'center', fontSize: 12, marginBottom: 8 },

  grid: {
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  column: { justifyContent: 'space-between' },

  card: {
    width: CARD_WIDTH,
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    ...SH.card,
  },
  cardBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: { color: C.textMuted, fontSize: 15, marginTop: 12 },
  emptySub: { color: C.textDim, fontSize: 12, marginTop: 6 },

  emoji: { fontSize: 54 },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: { color: C.white, fontSize: 9, marginRight: 3, fontWeight: '700' },

  cardFooter: {
    backgroundColor: 'rgba(7,11,20,0.75)',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  cardTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  cardSub: {
    color: C.textMuted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
});

const stylesPlayer = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    alignSelf: 'flex-start',
    padding: 16,
    zIndex: 10,
  },
  video: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  subtitle: {
    color: '#8a93ab',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
});