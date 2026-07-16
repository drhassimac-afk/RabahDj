import React, { useState, useEffect, useContext, useRef } from 'react';
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
import { SocketContext } from '../context/SocketContext'; // سياق الاتصال بالسيرفر
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function EntertainmentScreen() {
  const { socket, isConnected } = useContext(SocketContext);
  
  // حالات الراديو والبث الصوتي
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [broadcasterName, setBroadcasterName] = useState('');
  const [radioActive, setRadioActive] = useState(false);

  // حالة الطقس التجريبية الأنيقة
  const [weather, setWeather] = useState({ temp: '28°C', status: 'صافي ومريح', icon: 'sunny' });

  // قائمة الأفلام المتوفرة في سينما السيرفر
  const [movies, setMovies] = useState([
    { id: '1', title: 'سهرة الـ DJ الخاصة', duration: '1h 45m', category: 'موسيقى & حماس', url: '/files/dj-special.mp4' },
    { id: '2', title: 'تحدي البرمجة المحلّي', duration: '2h 10m', category: 'وثائقي', url: '/files/coding-challenge.mp4' },
  ]);

  useEffect(() => {
    if (!socket) return;

    // الاستماع لحالة الراديو من السيرفر
    socket.on('radio_state_change', (data) => {
      setRadioActive(data.active);
      if (data.active) {
        setBroadcasterName(data.broadcaster);
        Alert.alert('🎙️ راديو حيّ', `الـ DJ ${data.broadcaster} بدأ بثاً صوتياً مباشراً الآن!`);
      } else {
        setBroadcasterName('');
        setIsListening(false);
      }
    });

    // استقبال الصوت (موك فني لتأكيد الاستقبال)
    socket.on('audio_stream', (chunk) => {
      if (isListening) {
        // هنا يتم تشغيل دفق الصوت عبر مكتبة مثل expo-av
        // حالياً نوضح للمستخدم استقبال الداتا بنجاح
      }
    });

    return () => {
      socket.off('radio_state_change');
      socket.off('audio_stream');
    };
  }, [socket, isListening]);

  // التحكم في بث الـ DJ (الميكروفون)
  const toggleBroadcast = () => {
    if (!isConnected) {
      Alert.alert('خطأ', 'أنت غير متصل بالسيرفر المحلي حالياً!');
      return;
    }

    if (isBroadcasting) {
      socket.emit('stop_broadcast');
      setIsBroadcasting(false);
    } else {
      socket.emit('start_broadcast');
      setIsBroadcasting(true);
      Alert.alert('🎙️ ميكروفون مفتوح', 'صوتك يعبر عبر الواي فاي لكل الهواتف المتصلة الآن!');
    }
  };

  // التحكم في الاستماع للراديو
  const toggleListening = () => {
    if (!radioActive && !isListening) {
      Alert.alert('تنبيه', 'لا يوجد بث راديو نشط حالياً للاستماع إليه.');
      return;
    }
    setIsListening(!isListening);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      
      {/* 1️⃣ بطاقة الطقس المتدرجة والأنيقة (ثنائية الأبعاد والشفافية كالفلاتر) */}
      <View style={styles.weatherCard}>
        <View style={styles.weatherInfo}>
          <Ionicons name={weather.icon} size={48} color="#f59e0b" />
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

      {/* 2️⃣ راديو الـ DJ واللاسلكي الحماسي (الميكروفون والبث المباشر) */}
      <View style={styles.radioSection}>
        <Text style={styles.sectionTitle}>🎙️ راديو الـ DJ والاتصال المباشر</Text>
        
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
            <FontAwesome5 name="microphone" size={24} color="#fff" />
            <Text style={styles.radioBtnText}>{isBroadcasting ? 'إيقاف البث' : 'تحدث الآن (بث)'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.radioButton, isListening ? styles.buttonActiveGreen : styles.buttonSecondary]} 
            onPress={toggleListening}
          >
            <Ionicons name={isListening ? "volume-high" : "volume-mute"} size={24} color="#fff" />
            <Text style={styles.radioBtnText}>{isListening ? 'مستمع للراديو' : 'استمع للبث'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3️⃣ شبكة الأنشطة والترفيه الرائعة (2 x 2) */}
      <Text style={styles.sectionTitle}>🎮 مركز الترفيه والألعاب المشتركة</Text>
      <View style={styles.gridContainer}>
        
        {/* بطاقة الألعاب */}
        <TouchableOpacity style={styles.gridCard} onPress={() => Alert.alert('العاب LAN', 'جاري تشغيل تحدي الألعاب الجماعية!')}>
          <View style={[styles.iconCircle, { backgroundColor: '#3b82f6' }]}>
            <Ionicons name="game-controller" size={28} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>مكتبة الألعاب</Text>
          <Text style={styles.cardDesc}>تحديات LAN فورية</Text>
        </TouchableOpacity>

        {/* بطاقة سينما السيرفر */}
        <TouchableOpacity style={styles.gridCard} onPress={() => Alert.alert('سينما الواي فاي', 'تصفح الأفلام وحملها من السيرفر بسرعة البرق!')}>
          <View style={[styles.iconCircle, { backgroundColor: '#a855f7' }]}>
            <Ionicons name="film" size={28} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>سينما السيرفر</Text>
          <Text style={styles.cardDesc}>أفلام وبث محلي</Text>
        </TouchableOpacity>

        {/* بطاقة الريلز */}
        <TouchableOpacity style={styles.gridCard} onPress={() => Alert.alert('الريلز القصيرة', 'تصفح فيديوهات الأصدقاء الخفيفة!')}>
          <View style={[styles.iconCircle, { backgroundColor: '#ec4899' }]}>
            <Ionicons name="videocam" size={28} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>مقاطع Reels</Text>
          <Text style={styles.cardDesc}>فيديوهات قصيرة</Text>
        </TouchableOpacity>

        {/* بطاقة الدردشة الحية */}
        <TouchableOpacity style={styles.gridCard} onPress={() => Alert.alert('الدردشة العامة', 'غرفة دردشة جماعية فورية بالواي فاي')}>
          <View style={[styles.iconCircle, { backgroundColor: '#10b981' }]}>
            <Ionicons name="chatbubbles" size={28} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>الدردشة الحية</Text>
          <Text style={styles.cardDesc}>تواصل فوري</Text>
        </TouchableOpacity>

      </View>

      {/* 4️⃣ قسم الأفلام النشطة على السيرفر */}
      <Text style={styles.sectionTitle}>🎬 معروض الآن في السينما المحلية</Text>
      <FlatList 
        data={movies}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
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

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19', // خلفية داكنة غامضة وفخمة متطابقة مع السيرفر
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'right',
  },
  
  // تصميم بطاقة الطقس الأسطورية
  weatherCard: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', // في react native الحقيقي يفضل استخدام LinearGradient، سنحاكيه بالألوان هنا:
    backgroundColor: '#1d4ed8', 
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherHeader: {
    alignItems: 'flex-end',
  },
  weatherTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  weatherSub: {
    color: '#bfdbfe',
    fontSize: 12,
    marginTop: 4,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTextContainer: {
    marginLeft: 10,
    alignItems: 'center',
  },
  weatherTemp: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  weatherStatus: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // الراديو والبث
  radioSection: {
    backgroundColor: '#161c2a',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  radioButtonsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  radioButton: {
    flex: 0.48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 15,
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
  },
  buttonSecondary: {
    backgroundColor: '#334155',
  },
  buttonActiveRed: {
    backgroundColor: '#dc2626',
  },
  buttonActiveGreen: {
    backgroundColor: '#16a34a',
  },
  radioBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 13,
  },
  activeBroadcastBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginLeft: 8,
  },
  activeBroadcastText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // تصميم شبكة الـ 2x2 المتناسقة
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  gridCard: {
    width: (width - 44) / 2,
    backgroundColor: '#161c2a',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  iconCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  cardDesc: {
    color: '#64748b',
    fontSize: 11,
  },

  // كروت السينما الدائرية والأنيقة
  movieCard: {
    width: 160,
    backgroundColor: '#161c2a',
    borderRadius: 20,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  movieIconArea: {
    width: '100%',
    height: 90,
    borderRadius: 15,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  movieTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  movieCat: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  watchBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  watchBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  }
});
                           
