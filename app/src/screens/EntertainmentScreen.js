import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  ScrollView, Image, Alert, Dimensions, ActivityIndicator 
} from 'react-native';
import { useRabahSocket } from '../context/SocketContext';
import colors from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function EntertainmentScreen() {
  const { connected } = useRabahSocket();
  const [activeTab, setActiveTab] = useState('movies'); // 'movies' أو 'games'

  // بيانات الأفلام التجريبية (المرفوعة على السيرفر المحلي في مجلد public/movies)
  const [movies, setMovies] = useState([
    {
      id: '1',
      title: 'فيلم الأكشن والسرعة',
      duration: '2h 10m',
      category: 'أكشن / إثارة',
      thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
      url: 'http://192.168.100.2:4000/public/movies/action.mp4'
    },
    {
      id: '2',
      title: 'رحلة في أعماق الطبيعة',
      duration: '1h 45m',
      category: 'وثائقي',
      thumbnail: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500',
      url: 'http://192.168.100.2:4000/public/movies/nature.mp4'
    }
  ]);

  // قائمة الألعاب المحلية المتوفرة
  const games = [
    { id: 'g1', title: 'تحدي الأسئلة والذكاء', icon: 'help-circle-outline', players: 'لعبة جماعية' },
    { id: 'g2', title: 'سرعة البديهة والتصويب', icon: 'thunderstorm-outline', players: 'لاعب ضد لاعب' }
  ];

  const handlePlayMovie = (movie) => {
    if (!connected) {
      Alert.alert('تنبيه', 'أنت غير متصل بالسيرفر المحلي حالياً. يرجى الاتصال من شاشة الدخول.');
      return;
    }
    Alert.alert('بدء البث', `جاري تشغيل: ${movie.title} من السيرفر المحلي...`);
    // هنا يتم استدعاء مشغل الفيديو في التطبيق وتمرير رابط الـ movie.url
  };

  const handleStartGame = (game) => {
    Alert.alert('العاب الواي فاي', `جاري تحضير غرفة اللعب لـ ${game.title}...`);
  };

  return (
    <View style={styles.container}>
      {/* البار العلوي */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>بوابة الترفيه المحلي</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>{connected ? 'متصل بالشبكة' : 'بدون اتصال'}</Text>
        </View>
      </View>

      {/* أزرار التنقل بين السينما والألعاب */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'movies' && styles.activeTab]}
          onPress={() => setActiveTab('movies')}
        >
          <Ionicons name="film-outline" size={20} color={activeTab === 'movies' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'movies' && styles.activeTabText]}>سينما الواي فاي</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'games' && styles.activeTab]}
          onPress={() => setActiveTab('games')}
        >
          <Ionicons name="game-controller-outline" size={20} color={activeTab === 'games' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'games' && styles.activeTabText]}>ألعاب الشبكة</Text>
        </TouchableOpacity>
      </View>

      {/* المحتوى المتبدل */}
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
                  <Text style={styles.movieDuration}>⏱️ {item.duration}</Text>
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
            <TouchableOpacity style={styles.gameCard} onPress={() => handleStartGame(item)}>
              <View style={styles.gameIconBox}>
                <Ionicons name={item.icon} size={32} color="#3b82f6" />
              </View>
              <View style={styles.gameInfo}>
                <Text style={styles.gameTitle}>{item.title}</Text>
                <Text style={styles.gamePlayers}>{item.players}</Text>
              </View>
              <Ionicons name="arrow-back-outline" size={20} color="#64748b" />
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
  gamePlayers: { color: '#64748b', fontSize: 12, marginTop: 4 }
});
