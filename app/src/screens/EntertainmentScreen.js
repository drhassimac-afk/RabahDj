import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  Image, Dimensions 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRabahSocket } from '../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function EntertainmentScreen() {
  const { connected } = useRabahSocket();
  const [activeTab, setActiveTab] = useState('movies');
  const [selectedGameUrl, setSelectedGameUrl] = useState(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  const [movies] = useState([
    {
      id: 'net_1',
      title: 'بث مباشر: قناة الجزيرة الإخبارية',
      duration: 'بث حي 24/7',
      category: 'أخبار / مباشر',
      thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500',
      url: 'https://live-channels-edge.apple.com/us/news/aljazeera/index.m3u8'
    },
    {
      id: 'net_2',
      title: 'فيلم وثائقي: أسرار الكون والفضاء',
      duration: '1h 25m',
      category: 'وثائقي / علمي',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
  ]);

  const games = [
    { id: 'g1', title: 'لعبة الشطرنج العالمية', icon: 'trophy-outline', players: 'لاعب ضد لاعب', url: 'https://lichess.org' },
    { id: 'g2', title: 'تحدي الأرقام والذكاء 2048', icon: 'help-circle-outline', players: 'لاعب واحد', url: 'https://play.2048.co/' }
  ];

  const player = useVideoPlayer(activeVideoUrl, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.play();
  });

  const handlePlayMovie = (movie) => {
    setActiveVideoUrl(movie.url);
  };

  if (activeVideoUrl) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.videoHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={() => { player.pause(); setActiveVideoUrl(null); }}>
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

  if (selectedGameUrl) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.videoHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedGameUrl(null)}>
            <Ionicons name="close" size={24} color="#fff" />
            <Text style={styles.closeText}>إغلاق اللعبة</Text>
          </TouchableOpacity>
        </View>
        <WebView source={{ uri: selectedGameUrl }} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>بوابة الترفيه الذكية</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>{connected ? 'متصل بالسيرفر' : 'بدون اتصال'}</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'movies' && styles.activeTab]} onPress={() => setActiveTab('movies')}>
          <Ionicons name="film-outline" size={20} color={activeTab === 'movies' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'movies' && styles.activeTabText]}>سينما الإنترنت</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'games' && styles.activeTab]} onPress={() => setActiveTab('games')}>
          <Ionicons name="game-controller-outline" size={20} color={activeTab === 'games' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'games' && styles.activeTabText]}>ألعاب سحابية</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'movies' ? (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.movieCard} onPress={() => handlePlayMovie(item)}>
              <Image source={{ uri: item.thumbnail }} style={styles.movieImage} />
              <View style={styles.movieDetails}>
                <Text style={styles.movieTitle}>{item.title}</Text>
                <View style={styles.movieMeta}>
                  <Text style={styles.movieCategory}>{item.category}</Text>
                  <Text style={styles.movieDuration}>🌐 {item.duration}</Text>
                </View>
              </View>
              <View style={styles.playButton}>
                <Ionicons name="play" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gameCard} onPress={() => setSelectedGameUrl(item.url)}>
              <View style={styles.gameIconBox}>
                <Ionicons name={item.icon} size={32} color="#3b82f6" />
              </View>
              <View style={styles.gameInfo}>
                <Text style={styles.gameTitle}>{item.title}</Text>
                <Text style={styles.gamePlayers}>{item.players}</Text>
              </View>
              <Ionicons name="chevron-back" size={24} color="#64748b" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', paddingTop: 50 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#94a3b8', fontSize: 12 },
  tabsContainer: { flexDirection: 'row-reverse', paddingHorizontal: 20, marginBottom: 15 },
  tab: { flex: 1, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#1e293b', marginHorizontal: 5 },
  activeTab: { backgroundColor: '#3b82f6' },
  tabText: { color: '#64748b', fontWeight: 'bold', marginRight: 8, fontSize: 14 },
  activeTabText: { color: '#fff' },
  listContent: { paddingHorizontal: 20, paddingBottom: 80 },
  movieCard: { backgroundColor: '#1e293b', borderRadius: 16, marginBottom: 15, overflow: 'hidden', flexDirection: 'row-reverse', alignItems: 'center', padding: 10 },
  movieImage: { width: 80, height: 80, borderRadius: 12 },
  movieDetails: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  movieTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  movieMeta: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', marginTop: 5 },
  movieCategory: { color: '#3b82f6', fontSize: 12 },
  movieDuration: { color: '#64748b', fontSize: 12 },
  playButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  gameCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 15, marginBottom: 12, flexDirection: 'row-reverse', alignItems: 'center' },
  gameIconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center' },
  gameInfo: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  gameTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  gamePlayers: { color: '#64748b', fontSize: 12, marginTop: 4 },
  fullScreenContainer: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  videoHeader: { height: 50, paddingHorizontal: 15, justifyContent: 'center', backgroundColor: '#111827' },
  closeButton: { flexDirection: 'row', alignItems: 'center' },
  closeText: { color: '#fff', marginLeft: 8, fontWeight: 'bold', fontSize: 14 },
  videoPlayer: { width: '100%', height: 250, backgroundColor: '#000' }
});
