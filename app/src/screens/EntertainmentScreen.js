import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SocketContext } from '../context/SocketContext';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function EntertainmentScreen() {
  const navigation = useNavigation();
  const { socket, isConnected } = useContext(SocketContext) || {};

  // حالات الراديو والبث الصوتي
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [broadcasterName, setBroadcasterName] = useState('');
  const [radioActive, setRadioActive] = useState(false);

  // حالة الطقس التجريبية الأنيقة
  const [weather] = useState({ temp: '28°C', status: 'صافي ومريح', icon: 'sunny' });

  // قائمة الأفلام المتوفرة في سينما السيرفر
  const [movies] = useState([
    { id: '1', title: 'سهرة الـ DJ الخاصة', duration: '1h 45m', category: 'موسيقى & حماس', url: '/files/dj-special.mp4' },
    { id: '2', title: 'تحدي البرمجة المحلّي', duration: '2h 10m', category: 'وثائقي', url: '/files/coding-challenge.mp4' },
  ]);

  useEffect(() => {
    if (!socket) return;

    socket.on('radio_state_change', (data) => {
      if (data) {
        setRadioActive(!!data.active);
        if (data.active) {
          setBroadcasterName(data.broadcaster || '');
          Alert.alert('🎙️ راديو حيّ', `الـ DJ ${data.broadcaster || ''} بدأ بثاً صوتياً مباشراً الآن!`);
        } else {
          setBroadcasterName('');
          setIsListening(false);
        }
      }
    });

    return () => {
      socket.off('radio_state_change');
    };
  }, [socket]);

  const toggleBroadcast = () => {
    if (!isConnected) {
      Alert.alert('خطأ', 'أنت غير متصل بالسيرفر المحلي حالياً!');
      return;
    }

    if (isBroadcasting) {
      socket?.emit('stop_broadcast');
      setIsBroadcasting(false);
    } else {
      socket?.emit('start_broadcast');
      setIsBroadcasting(true);
      Alert.alert('🎙️ ميكروفون مفتوح', 'صوتك يعبر عبر الواي فاي لكل الهواتف المتصلة الآن!');
    }
  };

  const toggleListening = () => {
    if (!radioActive && !isListening) {
      Alert.alert('تنبيه', 'لا يوجد بث راديو نشط حالياً للاستماع إليه.');
      return;
    }
    setIsListening(!isListening);
  };

  return (
    <View style={styles.mainWrapper}>
      {/* 🌟 هيدر علوي مخصص يحتوي على سهم الرجوع المتجاوب */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitlePage}>مركز الترفيه</Text>
        <View style={{ width: 40 }} /> {/* موازن بصري للتصميم */}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* 1️⃣ بطاقة الطقس */}
        <View style={styles.weatherCard}>
          <View style={styles.weatherInfo}>
            <Ionicons name={weather.icon} size={44} color="#f59e0b" />
            <View style={styles.weatherTextContainer}>
              <Text style={styles.weatherTemp}>{weather.temp}</Text>
              <Text style={styles.weatherStatus}>{weather.status}</Text>
            </View>
          </View>
          <View style={styles.weatherHeader}>
            <Text style={styles.weatherTitle}>طقس أولاد موسى المحلي 📍</Text>
            <Text style={styles.weatherSub}>محدث عبر السيرفر</Text>
          </View>
        </View>

        {/* 2️⃣ راديو الـ DJ والاتصال المباشر */}
        <View style={styles.radioSection}>
          <Text style={styles.sectionTitleInside}>🎙️ راديو الـ DJ والاتصال المباشر</Text>
          
          {radioActive && (
            <View style={styles.activeBroadcastBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.activeBroadcastText}>بث مباشر حالي بواسطة: {broadcasterName}</Text>
            </View>
          )}

          <View style={styles.radioButtonsContainer}>
            <TouchableOpacity
              style={[styles.radioButton, isBroadcasting ? styles.buttonActiveRed : styles.buttonPrimary]}
              onPress={toggleBroadcast}
            >
              <FontAwesome5 name="microphone" size={20} color="#fff" />
              <Text style={styles.radioBtnText}>{isBroadcasting ? 'إيقاف البث' : 'تحدث الآن'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radioButton, isListening ? styles.buttonActiveGreen : styles.buttonSecondary]}
              onPress={toggleListening}
            >
              <Ionicons name={isListening ? "volume-high" : "volume-mute"} size={20} color="#fff" />
              <Text style={styles.radioBtnText}>{isListening ? 'مستمع للراديو' : 'استمع للبث'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3️⃣ شبكة الأنشطة والترفيه */}
        <Text style={styles.sectionTitle}>🎮 مركز الترفيه والألعاب المشتركة</Text>
        <View style={styles.gridContainer}>
          
          <TouchableOpacity style={styles.gridCard} onPress={() => Alert.alert('العاب LAN', 'جاري تشغيل تحدي الألعاب الجماعية!')}>
            <View style={[styles.iconCircle, { backgroundColor: '#3b82f6' }]}>
              <Ionicons name="game-controller-outline" size={26} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>مكتبة الألعاب</Text>
            <Text style={styles.cardDesc}>تحديات LAN فورية</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={() => Alert.alert('سينما الواي فاي', 'تصفح الأفلام وحملها من السيرفر بسرعة البرق!')}>
            <View style={[styles.iconCircle, { backgroundColor: '#a855f7' }]}>
              <Ionicons name="film-outline" size={26} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>سينما السيرفر</Text>
            <Text style={styles.cardDesc}>أفلام وبث محلي</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={() => Alert.alert('الريليز القصيرة', 'تصفح فيديوهات الأصدقاء الخفيفة!')}>
            <View style={[styles.iconCircle, { backgroundColor: '#ec4899' }]}>
              <Ionicons name="videocam-outline" size={26} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>مقاطع Reels</Text>
            <Text style={styles.cardDesc}>فيديوهات قصيرة</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={() => Alert.alert('الدردشة العامة', 'غرفة دردشة جماعية فورية بالواي فاي')}>
            <View style={[styles.iconCircle, { backgroundColor: '#10b981' }]}>
              <Ionicons name="chatbubbles-outline" size={26} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>الدردشة الحية</Text>
            <Text style={styles.cardDesc}>تواصل فوري</Text>
          </TouchableOpacity>
        </View>

        {/* 4️⃣ قسم الأفلام النشطة */}
        <Text style={styles.sectionTitle}>🎬 معروض الآن في السينما المحلية</Text>
        <View style={styles.moviesListContainer}>
          <FlatList
            data={movies}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4 }}
            renderItem={({ item }) => (
              <View style={styles.movieCard}>
                <View style={styles.movieIconArea}>
                  <Ionicons name="play-circle" size={40} color="#a855f7" />
                </View>
                <Text style={styles.movieTitle}>{item.title}</Text>
                <Text style={styles.movieCat}>{item.category} • {item.duration}</Text>
                <TouchableOpacity style={styles.watchBtn} onPress={() => Alert.alert('بث سينمائي', `جاري تشغيل فيلم: ${item.title}`)}>
                  <Text style={styles.watchBtnText}>تشغيل البث ⚡</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#161c2a',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  headerTitlePage: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
    textAlign: 'left',
  },
  sectionTitleInside: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 12,
    textAlign: 'left',
  },
  weatherCard: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#1d4ed8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherHeader: {
    alignItems: 'flex-end',
  },
  weatherTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  weatherSub: {
    color: '#bfdbfe',
    fontSize: 11,
    marginTop: 2,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTextContainer: {
    marginLeft: 8,
    alignItems: 'flex-start',
  },
  weatherTemp: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  weatherStatus: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: 'bold',
  },
  radioSection: {
    backgroundColor: '#161c2a',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  radioButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  radioButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonPrimary: { backgroundColor: '#2563eb' },
  buttonSecondary: { backgroundColor: '#334155' },
  buttonActiveRed: { backgroundColor: '#dc2626' },
  buttonActiveGreen: { backgroundColor: '#16a34a' },
  radioBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 12,
  },
  activeBroadcastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  activeBroadcastText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  gridCard: {
    width: (width - 44) / 2,
    backgroundColor: '#161c2a',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  cardDesc: {
    color: '#64748b',
    fontSize: 11,
  },
  moviesListContainer: {
    height: 200,
    paddingHorizontal: 12,
  },
  movieCard: {
    width: 150,
    backgroundColor: '#161c2a',
    borderRadius: 18,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    height: 190,
  },
  movieIconArea: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  movieTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  movieCat: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  watchBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  watchBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  }
});
