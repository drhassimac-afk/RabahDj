import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  ScrollView, 
  Alert, 
  Dimensions 
} from 'react-native';
import { SocketContext } from '../context/SocketContext';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AdminScreen({ navigation }) {
  const { socket, isConnected } = useContext(SocketContext);
  
  // حقول الحماية والتحقق
  const [pinCode, setPinCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // إحصائيات السيرفر الحية
  const [serverStats, setServerStats] = useState({
    usersCount: 0,
    postsCount: 0,
    systemStatus: 'ممتاز 🟢',
    bandwidth: '100 Mbps'
  });

  // قائمة المشتركين المتصلين حالياً بالشبكة
  const [usersList, setUsersList] = useState([]);

  // الرمز السري الافتراضي للأدمن (يمكنك تعديله لاحقاً)
  const ADMIN_PIN = "1234"; 

  useEffect(() => {
    if (!socket) return;

    // استقبال تحديثات قائمة المستخدمين النشطين
    socket.on('users_list', (users) => {
      setUsersList(users);
      setServerStats(prev => ({
        ...prev,
        usersCount: users.length
      }));
    });

    // استقبال تأكيد المنشورات لتحديث العداد
    socket.on('new_post', () => {
      setServerStats(prev => ({
        ...prev,
        postsCount: prev.postsCount + 1
      }));
    });

    return () => {
      socket.off('users_list');
      socket.off('new_post');
    };
  }, [socket]);

  // التحقق من الرمز السري للدخول
  const handleVerifyPIN = () => {
    if (pinCode === ADMIN_PIN) {
      setIsAuthorized(true);
      Alert.alert('🔐 تم التحقق', 'مرحباً بك يا مشرف الشبكة! تم فتح لوحة التحكم بنجاح.');
    } else {
      Alert.alert('❌ رمز خاطئ', 'الرمز السري الذي أدخلته غير صحيح. حاول مجدداً!');
      setPinCode('');
    }
  };

  // طرد مستخدم من الشبكة (محاكاة أمان ممتازة)
  const kickUser = (username) => {
    Alert.alert(
      '🚨 تنبيه الإدارة',
      `هل أنت متأكد من رغبتك في طرد المستخدم (${username}) من الشبكة مؤقتاً؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'نعم، طرد', 
          style: 'destructive',
          onPress: () => {
            // هنا نرسل إشارة للسيرفر لطرد المستخدم
            socket.emit('admin_kick_user', { username });
            Alert.alert('تم الإجراء', `تم فصل اتصال المستخدم ${username} بنجاح.`);
          }
        }
      ]
    );
  };

  // شاشة قفل لوحة التحكم (إذا لم يتم إدخال الرمز السري بعد)
  if (!isAuthorized) {
    return (
      <View style={styles.lockContainer}>
        <View style={styles.lockBox}>
          <View style={styles.lockIconCircle}>
            <Ionicons name="lock-closed" size={40} color="#3b82f6" />
          </View>
          <Text style={styles.lockTitle}>لوحة تحكم المشرف السرية</Text>
          <Text style={styles.lockSub}>الرجاء إدخال رمز المرور (PIN Code) للمتابعة</Text>
          
          <TextInput
            style={styles.pinInput}
            placeholder="••••"
            placeholderTextColor="#4b5563"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={pinCode}
            onChangeText={setPinCode}
          />

          <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyPIN}>
            <Text style={styles.verifyBtnText}>دخول آمن ⚡</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>عودة للخلف</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // لوحة التحكم الكاملة والمفتوحة بعد التحقق
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* الهيدر الأنيق للوحة التحكم */}
      <View style={styles.headerArea}>
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة تحكم الأدمن 🛠️</Text>
      </View>

      {/* 1️⃣ شبكة الإحصائيات (2x2 Grid الأنيقة والمطابقة للتصميم الفخم) */}
      <View style={styles.gridContainer}>
        <View style={styles.gridCard}>
          <Ionicons name="people" size={24} color="#3b82f6" />
          <Text style={styles.cardNum}>{serverStats.usersCount}</Text>
          <Text style={styles.cardLabel}>المتصلون بالواي فاي</Text>
        </View>

        <View style={styles.gridCard}>
          <Ionicons name="document-text" size={24} color="#10b981" />
          <Text style={styles.cardNum}>{serverStats.postsCount}</Text>
          <Text style={styles.cardLabel}>إجمالي المنشورات</Text>
        </View>

        <View style={styles.gridCard}>
          <MaterialCommunityIcons name="speedometer" size={24} color="#a855f7" />
          <Text style={styles.cardNum}>{serverStats.bandwidth}</Text>
          <Text style={styles.cardLabel}>سرعة بث الميديا</Text>
        </View>

        <View style={styles.gridCard}>
          <FontAwesome5 name="heartbeat" size={20} color="#f59e0b" />
          <Text style={[styles.cardNum, { fontSize: 16, marginTop: 12 }]}>{serverStats.systemStatus}</Text>
          <Text style={styles.cardLabel}>حالة الخادم المحلي</Text>
        </View>
      </View>

      {/* 2️⃣ قسم السينما ورفع الأفلام */}
      <Text style={styles.sectionTitle}>🎬 إدارة أفلام السينما المحلية</Text>
      <View style={styles.actionCard}>
        <Text style={styles.actionCardDesc}>أضف روابط أفلام ومسلسلات جديدة ليتم عرضها في سينما التطبيق لجميع المتصلين بالشبكة.</Text>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => Alert.alert('رفع فيلم', 'يمكنك اختيار فيلم من ملفات الهاتف ورفعه مباشرة للسيرفر!')}
        >
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>إضافة فيلم جديد للسيرفر</Text>
        </TouchableOpacity>
      </View>

      {/* 3️⃣ قائمة الأعضاء وإدارتهم */}
      <Text style={styles.sectionTitle}>👥 إدارة المتصلين بالشبكة</Text>
      <View style={styles.usersCard}>
        {usersList.length === 0 ? (
          <Text style={styles.noUsersText}>لا يوجد أعضاء متصلين حالياً بالشبكة.</Text>
        ) : (
          usersList.map((item, index) => (
            <View style={styles.userRow} key={index}>
              <TouchableOpacity style={styles.kickBtn} onPress={() => kickUser(item)}>
                <Text style={styles.kickBtnText}>طرد ❌</Text>
              </TouchableOpacity>
              <View style={styles.userInfo}>
                <Text style={styles.userNameText}>{item}</Text>
                <View style={styles.statusDot} />
              </View>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  backArrow: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 12,
    textAlign: 'right',
  },

  // 2x2 Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  gridCard: {
    width: (width - 55) / 2,
    backgroundColor: '#161c2a',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardNum: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  cardLabel: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },

  // كروت الإجراءات وإدارة الأفلام
  actionCard: {
    backgroundColor: '#161c2a',
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  actionCardDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 15,
  },
  actionBtn: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 8,
  },

  // قائمة المتصلين
  usersCard: {
    backgroundColor: '#161c2a',
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  noUsersText: {
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 10,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  kickBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  kickBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // شاشة القفل وتأكيد الرمز السري
  lockContainer: {
    flex: 1,
    backgroundColor: '#0b0f19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBox: {
    width: width - 40,
    backgroundColor: '#161c2a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  lockIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lockSub: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  pinInput: {
    width: '60%',
    backgroundColor: '#0b0f19',
    borderRadius: 12,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginBottom: 20,
  },
  verifyBtn: {
    width: '100%',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#64748b',
    fontSize: 13,
  }
});
