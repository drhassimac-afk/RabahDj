import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  Image, Dimensions, SafeAreaView, Alert
} from 'react-native';
import { useRabahSocket } from '../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MOVIES = [
  {
    id: 'net_1',
    title: 'بث مباشر: قناة الجزيرة الإخبارية',
    duration: 'بث حي 24/7',
    category: 'أخبار / مباشر',
    thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500',
    url: 'https://www.aljazeera.net/live',
    isWeb: true,
  },
  {
    id: 'net_2',
    title: 'فيلم وثائقي: أسرار الكون والفضاء',
    duration: '1h 25m',
    category: 'وثائقي / علمي',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    isWeb: false,
  },
  {
    id: 'net_3',
    title: 'فيلم قصير: Elephant Dream',
    duration: '10m',
    category: 'أنيميشن / مفتوح',
    thumbnail: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=500',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    isWeb: false,
  },
];

const GAMES = [
  {
    id: 'g1',
    title: 'الشطرنج العالمي',
    icon: 'trophy-outline',
    players: 'لاعب ضد لاعب',
    url: 'https://lichess.org',
    needsInternet: true,
  },
  {
    id: 'g2',
    title: 'تحدي 2048',
    icon: 'help-circle-outline',
    players: 'لاعب واحد',
    url: 'https://play.2048.co/',
    needsInternet: true,
  },
  {
    id: 'g3',
    title: 'سودوكو',
    icon: 'grid-outline',
    players: 'لاعب واحد',
    url: 'https://sudoku.com',
    needsInternet: true,
  },
];

export default function EntertainmentScreen() {
  const { connected } = useRabahSocket();
  const [activeTab, setActiveTab] = useState('movies');
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const handlePlayMovie = useCallback((movie) => {
    if (movie.isWeb) {
      setSelectedType('web');
      setSelectedUrl(movie.url);
    } else {
      setSelectedType('video');
      setSelectedUrl(movie.url);
    }
  }, []);

  const handleOpenGame = useCallback((game) => {
    if (game.needsInternet && !connected) {
      Alert.alert(
        '⚠️ تنبيه',
        'هذه اللعبة تحتاج اتصال بالإنترنت.',
        [{ text: 'حسناً' }]
      );
      return;
    }
    setSelectedType('web');
    setSelectedUrl(game.url);
  }, [connected]);

  const handleClose = useCallback(() => {
    setSelectedUrl(null);
    setSelectedType(null);
  }, []);

  // ✅ عارض WebView
  if (selectedUrl && selectedType === 'web') {
    const { WebView } = require('react-native-webview');
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.videoHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#fff" />
            <Text style={styles.closeText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: selectedUrl }}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      </View>
    );
  }

  // ✅ عارض الفيديو
  if (selectedUrl && selectedType === 'video') {
    return <VideoPlayerScreen url={selectedUrl} onClose={handleClose} />;
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* الهيدر */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎬 بوابة الترفيه</Text>
        <View style={styles.statusBadge}>
          <View style={[
            styles.statusDot,
            { backgroundColor: connected ? '#10b981' : '#ef4444' }
          ]} />
          <Text style={styles.statusText}>
            {connected ? 'متصل' : 'غير متصل'}
          </Text>
        </View>
      </View>

      {/* التبويبات */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'movies' && styles.activeTab]}
          onPress={() => setActiveTab('movies')}
        >
          <Ionicons
            name="film-outline"
            size={20}
            color={activeTab === 'movies' ? '#fff' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'movies' && styles.activeTabText]}>
            سينما
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'games' && styles.activeTab]}
          onPress={() => setActiveTab('games')}
        >
          <Ionicons
            name="game-controller-outline"
            size={20}
            color={activeTab === 'games' ? '#fff' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'games' && styles.activeTabText]}>
            ألعاب
          </Text>
        </TouchableOpacity>
      </View>

      {/* قائمة الأفلام */}
      {activeTab === 'movies' ? (
        <FlatList
          data={MOVIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.movieCard}
              onPress={() => handlePlayMovie(item)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.movieImage}
              />
              <View style={styles.movieDetails}>
                <Text style={styles.movieTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.movieMeta}>
                  <Text style={styles.movieCategory}>{item.category}</Text>
                  <Text style={styles.movieDuration}>⏱ {item.duration}</Text>
                </View>
              </View>
              <View style={styles.playButton}>
                <Ionicons
                  name={item.isWeb ? 'globe-outline' : 'play'}
                  size={22}
                  color="#fff"
                />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        /* قائمة الألعاب */
        <FlatList
          data={GAMES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gameCard}
              onPress={() => handleOpenGame(item)}
              activeOpacity={0.8}
            >
              <View style={styles.gameIconBox}>
                <Ionicons name={item.icon} size={32} color="#3b82f6" />
              </View>
              <View style={styles.gameInfo}>
                <Text style={styles.gameTitle}>{item.title}</Text>
                <Text style={styles.gamePlayers}>👥 {item.players}</Text>
                {item.needsInternet && (
                  <Text style={styles.internetWarning}>🌐 يحتاج إنترنت</Text>
                )}
              </View>
              <Ionicons name="chevron-back" size={24} color="#64748b" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ✅ مكون منفصل لمشغل الفيديو
function VideoPlayerScreen({ url, onClose }) {
  const { useVideoPlayer, VideoView } = require('expo-video');

  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <View style={styles.fullScreenContainer}>
      <View style={styles.videoHeader}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => { player.pause(); onClose(); }}
        >
          <Ionicons name="close" size={24} color="#fff" />
          <Text style={styles.closeText}>إغلاق المشغل</Text>
        </TouchableOpacity>
      </View>
      <VideoView
        player={player}
        style={styles.videoPlayer}
        allowsFullscreen
        allowsPictureInPicture
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  movieCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 10,
  },
  movieImage: {
    width: 85,
    height: 85,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  movieDetails: {
    flex: 1,
    marginRight: 12,
    alignItems: 'flex-end',
  },
  movieTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right',
  },
  movieMeta: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
  },
  movieCategory: {
    color: '#3b82f6',
    fontSize: 12,
  },
  movieDuration: {
    color: '#64748b',
    fontSize: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  gameCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  gameIconBox: {
    width: 55,
    height: 55,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    flex: 1,
    marginRight: 15,
    alignItems: 'flex-end',
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  gamePlayers: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  internetWarning: {
    color: '#f59e0b',
    fontSize: 11,
    marginTop: 4,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 40,
  },
  videoHeader: {
    height: 50,
    paddingHorizontal: 15,
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  videoPlayer: {
    width: width,
    height: 280,
    backgroundColor: '#000',
  },
});
