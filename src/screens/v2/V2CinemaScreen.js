import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { SERVER_URL } from '../../api/config';

const { width } = Dimensions.get('window');

const C = {
  bg: '#0B1120',
  surface: '#161F2E',
  border: '#243044',
  primary: '#3B82F6',
  text: '#FFFFFF',
  sub: '#94A3B8',
  muted: '#64748B',
  danger: '#EF4444',
};

const SAMPLE_A =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_B =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

const DEMO_ITEMS = [
  {
    id: 'demo-1',
    title: 'Big Buck Bunny - تجريبي',
    genre: 'رسوم متحركة',
    duration: 'تجريبي',
    category: 'أفلام',
    emoji: '🎬',
    color: '#2E3A6B',
    video: SAMPLE_A,
  },
  {
    id: 'demo-2',
    title: 'Elephants Dream - تجريبي',
    genre: 'خيال',
    duration: 'تجريبي',
    category: 'أفلام',
    emoji: '🎞️',
    color: '#6B5B1E',
    video: SAMPLE_B,
  },
];

const CATEGORIES = ['الكل', 'أفلام', 'كوميديا', 'مسلسلات', 'وثائقي'];

const FETCH_TIMEOUT = 10000; // 10 ثواني

function getCategory(fileName) {
  const name = fileName.toLowerCase();

  if (
    name.includes('comedy') ||
    name.includes('comedic') ||
    name.includes('كوميديا') ||
    name.includes('ضحك')
  ) {
    return 'كوميديا';
  }

  if (
    name.includes('series') ||
    name.includes('episode') ||
    name.includes('مسلسل') ||
    name.includes('حلقة') ||
    name.includes('العائلة')
  ) {
    return 'مسلسلات';
  }

  if (
    name.includes('documentary') ||
    name.includes('document') ||
    name.includes('doc_') ||
    name.includes('وثائقي') ||
    name.includes('طبيعة') ||
    name.includes('فضاء') ||
    name.includes('حي')
  ) {
    return 'وثائقي';
  }

  return 'أفلام';
}

function getEmoji(category) {
  if (category === 'كوميديا') return '😂';
  if (category === 'مسلسلات') return '🎭';
  if (category === 'وثائقي') return '🌍';
  return '🎬';
}

function getColor(category) {
  if (category === 'كوميديا') return '#5B2E6B';
  if (category === 'مسلسلات') return '#6B2E2E';
  if (category === 'وثائقي') return '#1E6B3A';
  return '#2E4A6B';
}

function getTitle(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function normalizeServerFiles(data) {
  const files = Array.isArray(data) ? data : data?.files || data?.media || [];

  return files
    .map((file, index) => {
      const fileName =
        typeof file === 'string'
          ? file
          : file?.name || file?.filename || file?.file;

      if (!fileName) return null;

      const category = getCategory(fileName);

      return {
        id: `server-${fileName}-${index}`,
        title: getTitle(fileName),
        genre: category,
        duration: 'من الشبكة',
        category,
        emoji: getEmoji(category),
        color: getColor(category),
        video: `${SERVER_URL}/media/` + encodeURIComponent(fileName),
        remote: true,
      };
    })
    .filter(Boolean);
}

/* ── مشغل الفيديو ─────────────────────────── */
function PlayerModal({ item, onClose }) {
  const player = useVideoPlayer(item.video, (videoPlayer) => {
    videoPlayer.play();
  });

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={playerStyles.container}>
        <TouchableOpacity
          style={playerStyles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={38} color="#FFFFFF" />
        </TouchableOpacity>

        <VideoView
          style={playerStyles.video}
          player={player}
          nativeControls
          contentFit="contain"
          allowsFullscreen
          allowsPictureInPicture
        />

        <Text style={playerStyles.title}>{item.title}</Text>

        <Text style={playerStyles.subtitle}>
          {item.category} · {item.genre}
        </Text>
      </SafeAreaView>
    </Modal>
  );
}

/* ── بطاقة الفيلم (memo لتحسين الأداء) ─────── */
const MovieCard = memo(function MovieCard({ item, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.card, { backgroundColor: item.color }]}
      onPress={() => onPress(item)}
    >
      <View style={styles.cardImage}>
        <Text style={styles.emoji}>{item.emoji}</Text>

        {item.remote && (
          <View style={styles.networkBadge}>
            <Ionicons name="wifi" size={13} color="#FFFFFF" />
            <Text style={styles.networkText}>الشبكة</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={styles.cardSub}>
          {item.duration} · {item.genre}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

/* ── الشاشة الرئيسية ──────────────────────── */
export default function V2CinemaScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState('الكل');
  const [search, setSearch] = useState('');
  const [playing, setPlaying] = useState(null);
  const [serverItems, setServerItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverError, setServerError] = useState('');

  const loadMedia = useCallback(async (isRefresh = false) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setServerError('');

      const response = await fetch(`${SERVER_URL}/media-list`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('media-list request failed');
      }

      const data = await response.json();
      setServerItems(normalizeServerFiles(data));
    } catch (error) {
      console.log('Cinema media error:', error);
      setServerError(
        error.name === 'AbortError'
          ? 'انتهت مهلة الاتصال بالسيرفر ⏱️'
          : 'تعذر تحميل ملفات السيرفر'
      );
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const allItems = useMemo(
    () => [...DEMO_ITEMS, ...serverItems],
    [serverItems]
  );

  const filteredItems = useMemo(() => {
    let items =
      category === 'الكل'
        ? allItems
        : allItems.filter((item) => item.category === category);

    const query = search.trim().toLowerCase();
    if (query) {
      items = items.filter((item) =>
        item.title.toLowerCase().includes(query)
      );
    }

    return items;
  }, [allItems, category, search]);

  const handlePlay = useCallback((item) => setPlaying(item), []);

  const renderItem = useCallback(
    ({ item }) => <MovieCard item={item} onPress={handlePlay} />,
    [handlePlay]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* الهيدر */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-forward" size={30} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>سينما وتلفاز</Text>
        </View>

        {/* شريط البحث */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن فيلم أو مسلسل..."
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* التصنيفات */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {CATEGORIES.map((itemCategory) => (
              <TouchableOpacity
                key={itemCategory}
                onPress={() => setCategory(itemCategory)}
                style={[
                  styles.categoryButton,
                  category === itemCategory && styles.categoryButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === itemCategory && styles.categoryTextActive,
                  ]}
                >
                  {itemCategory}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* العدّاد + مؤشر التحميل */}
        <View style={styles.infoRow}>
          <Text style={styles.countText}>
            المتاح على شبكتك ({filteredItems.length})
          </Text>

          {loading && <ActivityIndicator size="small" color={C.primary} />}
        </View>

        {/* رسالة الخطأ + زر إعادة المحاولة */}
        {!!serverError && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>{serverError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadMedia()}
            >
              <Ionicons name="refresh" size={14} color="#FFFFFF" />
              <Text style={styles.retryText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* الشبكة */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + 45 },
          ]}
          columnWrapperStyle={styles.column}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadMedia(true)}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyBox}>
                <Ionicons name="film-outline" size={42} color={C.muted} />
                <Text style={styles.emptyText}>
                  {search
                    ? 'لا توجد نتائج مطابقة لبحثك 🔍'
                    : 'لا يوجد محتوى في هذا التصنيف'}
                </Text>
                <Text style={styles.emptyHint}>
                  أضف ملفات MP4 إلى مجلد server/media
                </Text>
              </View>
            )
          }
        />

        {playing && (
          <PlayerModal
            key={playing.id}
            item={playing}
            onClose={() => setPlaying(null)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const CARD_WIDTH = (width - 48) / 2;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    color: C.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
    marginRight: 15,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 16,
    marginBottom: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    paddingVertical: 10,
    textAlign: 'right',
  },
  categories: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  categoryButton: {
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingHorizontal: 17,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  categoryButtonActive: {
    backgroundColor: C.primary,
  },
  categoryText: {
    color: C.sub,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  countText: {
    color: C.sub,
    fontSize: 13,
    textAlign: 'right',
  },
  errorRow: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  errorText: {
    color: '#F59E0B',
    fontSize: 12,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  column: {
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emoji: {
    fontSize: 54,
  },
  networkBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  networkText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginLeft: 3,
  },
  cardFooter: {
    backgroundColor: 'rgba(11,17,32,0.72)',
    padding: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  cardSub: {
    color: '#CBD5E1',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 3,
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: C.sub,
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyHint: {
    color: C.muted,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

const playerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 12,
  },
  video: {
    width: '100%',
    height: 300,
    marginTop: 25,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 15,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
