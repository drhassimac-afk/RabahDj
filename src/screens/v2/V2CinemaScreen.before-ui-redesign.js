import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

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

import {
  Ionicons,
} from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useVideoPlayer,
  VideoView,
} from 'expo-video';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  SERVER_URL,
} from '../../api/config';

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
    rating: getRating('Big Buck Bunny'),
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
    rating: getRating('Elephants Dream'),
  },
];

const CATEGORIES = [
  'الكل',
  'أفلام',
  'كوميديا',
  'مسلسلات',
  'وثائقي',
];

function getCategory(fileName) {
  const name = fileName.toLowerCase();

  if (
    name.includes('comedy') ||
    name.includes('comedic') ||
    name.includes('k comedy') ||
    name.includes('كوميديا') ||
    name.includes('ضحك')
  ) {
    return 'كوميديا';
  }

  if (
    name.includes('series') ||
    name.includes('episode') ||
    name.includes('مسلسل') ||
    name.includes('حلقة')
  ) {
    return 'مسلسلات';
  }

  if (
    name.includes('documentary') ||
    name.includes('document') ||
    name.includes('doc_') ||
    name.includes('وثائقي')
  ) {
    return 'وثائقي';
  }

  return 'أفلام';
}

function getEmoji(category) {
  if (category === 'كوميديا') {
    return '😂';
  }

  if (category === 'مسلسلات') {
    return '🎭';
  }

  if (category === 'وثائقي') {
    return '🌍';
  }

  return '🎬';
}

function getColor(category) {
  if (category === 'كوميديا') {
    return '#5B2E6B';
  }

  if (category === 'مسلسلات') {
    return '#6B2E2E';
  }

  if (category === 'وثائقي') {
    return '#1E6B3A';
  }

  return '#2E4A6B';
}

function getTitle(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function getRating(seed) {
  // تقييم ثابت لكل عنصر مبني على اسمه (بدل رقم عشوائي يتغيّر كل مرة)
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }
  const rating = 3.8 + (hash % 12) / 10; // بين 3.8 و 4.9
  return Math.round(rating * 10) / 10;
}

const FAVORITES_KEY = 'rabahdj_cinema_favorites';

function normalizeServerFiles(data) {
  const files = Array.isArray(data)
    ? data
    : data?.files || data?.media || [];

  return files
    .map((file, index) => {
      const fileName =
        typeof file === 'string'
          ? file
          : file?.name ||
            file?.filename ||
            file?.file;

      if (!fileName) {
        return null;
      }

      const category = getCategory(fileName);

      return {
        id: `server-${fileName}-${index}`,
        title: getTitle(fileName),
        genre: category,
        duration: 'من الشبكة',
        category,
        emoji: getEmoji(category),
        color: getColor(category),
        rating: getRating(fileName),

        // نبني الرابط من SERVER_URL حتى لا نستخدم IP خاطئًا
        video:
          `${SERVER_URL}/media/` +
          encodeURIComponent(fileName),

        remote: true,
      };
    })
    .filter(Boolean);
}

function PlayerModal({ item, onClose }) {
  const player = useVideoPlayer(
    item.video,
    (videoPlayer) => {
      videoPlayer.play();
    }
  );

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={playerStyles.container}>
        <TouchableOpacity
          style={playerStyles.closeButton}
          onPress={onClose}
        >
          <Ionicons
            name="close-circle"
            size={38}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <VideoView
          style={playerStyles.video}
          player={player}
          nativeControls
          contentFit="contain"
          allowsFullscreen
          allowsPictureInPicture
        />

        <Text style={playerStyles.title}>
          {item.title}
        </Text>

        <Text style={playerStyles.subtitle}>
          {item.category} · {item.genre}
        </Text>
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
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY)
      .then((raw) => {
        if (raw) setFavorites(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;

    async function loadMedia() {
      try {
        setLoading(true);
        setServerError('');

        const response = await fetch(
          `${SERVER_URL}/media-list`
        );

        if (!response.ok) {
          throw new Error('media-list request failed');
        }

        const data = await response.json();
        const items = normalizeServerFiles(data);

        if (mounted) {
          setServerItems(items);
        }
      } catch (error) {
        console.log('Cinema media error:', error);

        if (mounted) {
          setServerError(
            'تعذر تحميل ملفات السيرفر'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMedia();

    return () => {
      mounted = false;
    };
  }, []);

  const allItems = useMemo(() => {
    return [
      ...DEMO_ITEMS,
      ...serverItems,
    ];
  }, [serverItems]);

  const filteredItems = useMemo(() => {
    if (category === 'الكل') {
      return allItems;
    }

    return allItems.filter(
      (item) => item.category === category
    );
  }, [allItems, category]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-forward"
              size={30}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            سينما وتلفاز
          </Text>

          <View style={styles.headerBadge}>
            <Ionicons
              name="film"
              size={20}
              color="#FFFFFF"
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {CATEGORIES.map((itemCategory) => (
            <TouchableOpacity
              key={itemCategory}
              onPress={() =>
                setCategory(itemCategory)
              }
              style={[
                styles.categoryButton,
                category === itemCategory &&
                  styles.categoryButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === itemCategory &&
                    styles.categoryTextActive,
                ]}
              >
                {itemCategory}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.infoRow}>
          {loading && (
            <ActivityIndicator
              size="small"
              color={C.primary}
            />
          )}
        </View>

        {!!serverError && (
          <Text style={styles.errorText}>
            {serverError}
          </Text>
        )}

        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.grid,
            {
              paddingBottom: insets.bottom + 45,
            },
          ]}
          columnWrapperStyle={styles.column}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.card}
              onPress={() => setPlaying(item)}
            >
              <View style={styles.cardImage}>
                <TouchableOpacity
                  style={styles.favButton}
                  onPress={() => toggleFavorite(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
                    size={18}
                    color={favorites.includes(item.id) ? C.danger : '#FFFFFF'}
                  />
                </TouchableOpacity>

                <Text style={styles.emoji}>
                  {item.emoji}
                </Text>

                {item.remote && (
                  <View style={styles.networkBadge}>
                    <Ionicons
                      name="wifi"
                      size={13}
                      color="#FFFFFF"
                    />
                    <Text style={styles.networkText}>
                      الشبكة
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <Text
                  style={styles.cardTitle}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#FACC15" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons
                name="film-outline"
                size={42}
                color={C.muted}
              />

              <Text style={styles.emptyText}>
                لا يوجد محتوى في هذا التصنيف
              </Text>

              <Text style={styles.emptyHint}>
                أضف ملفات MP4 إلى مجلد server/media
              </Text>
            </View>
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

  headerBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categories: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
    paddingVertical: 6,
    paddingBottom: 10,
  },

  categoryButton: {
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginLeft: 6,
  },

  categoryButtonActive: {
    backgroundColor: C.primary,
  },

  categoryText: {
    color: C.sub,
    fontSize: 12,
    fontWeight: '600',
  },

  categoryTextActive: {
    color: '#FFFFFF',
  },

  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 0,
    marginBottom: 4,
    minHeight: 4,
  },

  countText: {
    color: C.sub,
    fontSize: 13,
    textAlign: 'right',
  },

  errorText: {
    color: '#F59E0B',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
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
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },

  favButton: {
    position: 'absolute',
    top: 9,
    right: 9,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
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

  ratingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },

  ratingText: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
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
