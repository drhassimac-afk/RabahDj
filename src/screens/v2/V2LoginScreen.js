import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
  Vibration, Animated, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, resetSocket } from '../../api/socket';
import { SERVER_URL, setManualServerIp } from '../../api/config';
import { setCurrentUser } from '../../api/currentUser';

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', success:'#22C55E', danger:'#EF4444', gold:'#FACC15', live:'#A855F7', elevated:'#1E2A3D' };

const AVATAR_COLORS = ['#3B82F6', '#22C55E', '#A855F7', '#F59E0B', '#F43F5E', '#14B8A6', '#EC4899', '#FACC15'];
const LAST_NAME_KEY = 'rabahdj_last_name';
const LAST_COLOR_KEY = 'rabahdj_last_color';

function PressableScale({ style, onPress, disabled, children, activeOpacity = 0.85 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={style}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={activeOpacity}
        onPressIn={onIn}
        onPressOut={onOut}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function V2LoginScreen({ navigation }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | error
  const [msg, setMsg] = useState('');
  const [initData, setInitData] = useState({});
  const [focused, setFocused] = useState(false);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [lastName, setLastName] = useState(null);
  const [showManualIp, setShowManualIp] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [manualBusy, setManualBusy] = useState(false);
  const [manualMsg, setManualMsg] = useState('');
  const [currentServer, setCurrentServer] = useState(SERVER_URL);
  const sock = useRef(getSocket());

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ])).start();

    (async () => {
      try {
        const savedName = await AsyncStorage.getItem(LAST_NAME_KEY);
        const savedColor = await AsyncStorage.getItem(LAST_COLOR_KEY);
        if (savedName) setLastName(savedName);
        if (savedColor && AVATAR_COLORS.includes(savedColor)) setAvatarColor(savedColor);
      } catch (err) { /* تجاهل */ }
    })();
  }, []);

  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  const runShake = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const doConnect = (n, color) => {
    Keyboard.dismiss();
    setCurrentUser(n);
    setStatus('connecting'); setMsg('');
    AsyncStorage.setItem(LAST_NAME_KEY, n).catch(() => {});
    AsyncStorage.setItem(LAST_COLOR_KEY, color).catch(() => {});
    const s = sock.current;
    const onUsersList = (data) => { setStatus('connected'); setInitData(data || {}); s.off('init', onUsersList); s.off('error', onErr); };
    const onErr = (e) => { setStatus('error'); setMsg((e && e.message) || 'فشل الاتصال'); s.off('init', onUsersList); s.off('error', onErr); };
    s.off('init'); s.off('error');
    s.on('init', onUsersList); s.on('error', onErr);
    const doJoin = () => s.emit('join', { name: n, avatarColor: color });
    if (!s.connected) {
      s.once('connect', doJoin);
      s.once('connect_error', () => { setStatus('error'); setMsg('تعذّر الوصول للسيرفر المحلي'); });
    } else doJoin();
  };

  const join = () => {
    const n = name.trim();
    if (!n) {
      setMsg('أدخل اسمك أولاً');
      Vibration.vibrate(60);
      runShake();
      return;
    }
    doConnect(n, avatarColor);
  };

  const quickJoin = () => {
    if (!lastName) return;
    setName(lastName);
    Vibration.vibrate(15);
    doConnect(lastName, avatarColor);
  };

  const retry = () => {
    setStatus('idle');
    setMsg('');
  };

  const applyManualIp = async () => {
    if (!manualIp.trim()) return;
    setManualBusy(true);
    setManualMsg('');
    const res = await setManualServerIp(manualIp.trim());
    setManualBusy(false);
    if (res.ok) {
      resetSocket();
      sock.current = getSocket();
      setCurrentServer(SERVER_URL);
      setShowManualIp(false);
      setManualMsg('');
      setStatus('idle');
      setMsg('');
    } else {
      setManualMsg('تعذّر الوصول لهذا العنوان');
    }
  };

  if (status === 'connected') {
    return (
      <SafeAreaView style={s.safe}>
        <Animated.View style={[s.center, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View style={s.okIcon}><Ionicons name="checkmark-circle" size={60} color={C.success} /></View>
          <Text style={s.title}>تم الدخول</Text>
          <Text style={s.sub}>مرحبًا {name} 👋</Text>
          <PressableScale style={s.btn} onPress={() => navigation.navigate('Wall', { name, initialPosts: initData.posts })}>
            <Ionicons name="newspaper" size={20} color="#fff" style={{ marginLeft:8 }} />
            <Text style={s.btnTxt}>الحائط</Text>
          </PressableScale>
          <PressableScale style={[s.btn, { backgroundColor:'#2A1B3D', marginTop:12 }]} onPress={() => navigation.navigate('Files', { name })}>
            <Ionicons name="paper-plane" size={20} color={C.live} style={{ marginLeft:8 }} />
            <Text style={[s.btnTxt, { color:C.live }]}>مشاركة الملفات</Text>
          </PressableScale>
          <PressableScale style={[s.btn, { backgroundColor:C.elevated, marginTop:12 }]} onPress={() => navigation.navigate('V2AdminLoginScreen')}>
            <Ionicons name="shield-checkmark" size={20} color={C.gold} style={{ marginLeft:8 }} />
            <Text style={[s.btnTxt, { color:C.gold }]}>لوحة الإدارة</Text>
          </PressableScale>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex:1 }}>
      <LinearGradient
        colors={['#0B1120', '#131C30', avatarColor + '22', '#0B1120']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-forward" size={24} color={C.sub} />
          </TouchableOpacity>

          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            <View style={s.top}>
              <View style={s.logoWrap}>
                <Animated.View style={[s.logoGlow, { backgroundColor: avatarColor, transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
                <View style={[s.logo, { borderColor: avatarColor }]}>
                  <Ionicons name="person-circle" size={52} color={avatarColor} />
                </View>
              </View>
              <Text style={s.title}>انضم للشبكة</Text>
              <Text style={s.sub}>أدخل اسمك للاتصال بالسيرفر المحلي</Text>
            </View>

            {!!lastName && status === 'idle' && (
              <PressableScale style={s.quickBtn} onPress={quickJoin}>
                <View style={[s.quickAvatar, { backgroundColor: avatarColor }]}>
                  <Text style={s.quickAvatarTxt}>{lastName.trim().charAt(0)}</Text>
                </View>
                <Text style={s.quickTxt}>دخول سريع باسم {lastName}</Text>
                <Ionicons name="flash" size={18} color={C.gold} />
              </PressableScale>
            )}

            <Animated.View style={[
              s.field,
              focused && s.fieldFocused,
              status === 'error' && s.fieldError,
              { transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] },
            ]}>
              <TextInput
                style={s.input}
                placeholder="اسمك"
                placeholderTextColor={C.muted}
                value={name}
                onChangeText={(t) => { setName(t); if (msg) setMsg(''); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={join}
              />
            </Animated.View>

            <Text style={s.pickerLabel}>لون شخصيتك</Text>
            <View style={s.colorRow}>
              {AVATAR_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => { setAvatarColor(c); Vibration.vibrate(10); }}
                  style={[s.colorDot, { backgroundColor: c }, avatarColor === c && s.colorDotActive]}
                >
                  {avatarColor === c && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            {status === 'error' ? (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={16} color={C.danger} />
                <Text style={s.errTxt}>{msg}</Text>
              </View>
            ) : (
              !!msg && <Text style={s.err}>{msg}</Text>
            )}

            {status === 'error' ? (
              <PressableScale style={[s.btn, { backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border }]} onPress={retry}>
                <Ionicons name="refresh" size={18} color={C.text} style={{ marginLeft: 8 }} />
                <Text style={s.btnTxt}>إعادة المحاولة</Text>
              </PressableScale>
            ) : (
              <PressableScale style={[s.btn, { backgroundColor: avatarColor }]} onPress={join} disabled={status === 'connecting'}>
                {status === 'connecting'
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnTxt}>دخول</Text>}
              </PressableScale>
            )}

            {status === 'error' && !showManualIp && (
              <TouchableOpacity style={s.manualLink} onPress={() => setShowManualIp(true)}>
                <Text style={s.manualLinkTxt}>تغيير عنوان السيرفر يدويًا</Text>
              </TouchableOpacity>
            )}

            {showManualIp && (
              <View style={s.manualBox}>
                <Text style={s.manualLabel}>عنوان IP السيرفر (زي اللي طالع بشاشة Termux)</Text>
                <TextInput
                  style={s.manualInput}
                  placeholder="192.168.1.5"
                  placeholderTextColor={C.muted}
                  value={manualIp}
                  onChangeText={setManualIp}
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                />
                {!!manualMsg && <Text style={s.manualErr}>{manualMsg}</Text>}
                <PressableScale style={[s.btn, { backgroundColor: C.primary, marginTop: 4 }]} onPress={applyManualIp} disabled={manualBusy}>
                  {manualBusy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>اتصال</Text>}
                </PressableScale>
              </View>
            )}
          </Animated.View>

          <Text style={s.note2}>السيرفر: {currentServer.replace('http://', '')}</Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,paddingHorizontal:24},
  back:{alignSelf:'flex-end',padding:8,marginTop:4},
  top:{alignItems:'center',marginTop:20},
  logoWrap:{width:96,height:96,alignItems:'center',justifyContent:'center',marginBottom:18},
  logoGlow:{position:'absolute',width:96,height:96,borderRadius:28},
  logo:{width:96,height:96,borderRadius:28,backgroundColor:C.surface,borderWidth:1.5,alignItems:'center',justifyContent:'center'},
  title:{color:C.text,fontSize:24,fontWeight:'800'},
  sub:{color:C.sub,fontSize:14,marginTop:6,textAlign:'center'},
  quickBtn:{flexDirection:'row-reverse',alignItems:'center',backgroundColor:C.surface,borderRadius:16,borderWidth:1,borderColor:C.gold+'55',paddingVertical:12,paddingHorizontal:14,marginTop:24,gap:10},
  quickAvatar:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center'},
  quickAvatarTxt:{color:'#fff',fontWeight:'700'},
  quickTxt:{color:C.text,fontSize:13,fontWeight:'600',flex:1,marginHorizontal:8,textAlign:'right'},
  field:{marginTop:20,backgroundColor:C.surface,borderRadius:16,borderWidth:1,borderColor:C.border},
  fieldFocused:{borderColor:C.primary},
  fieldError:{borderColor:C.danger},
  input:{color:C.text,fontSize:17,paddingHorizontal:18,paddingVertical:16,textAlign:'right'},
  pickerLabel:{color:C.sub,fontSize:12,fontWeight:'700',marginTop:18,marginBottom:10,textAlign:'right'},
  colorRow:{flexDirection:'row-reverse',flexWrap:'wrap',gap:12},
  colorDot:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'transparent'},
  colorDotActive:{borderColor:'#fff'},
  err:{color:C.danger,fontSize:13,textAlign:'center',marginTop:12},
  errorBox:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',marginTop:12,gap:6},
  errTxt:{color:C.danger,fontSize:13,marginRight:6},
  btn:{marginTop:20,backgroundColor:C.primary,borderRadius:28,height:54,alignItems:'center',justifyContent:'center',flexDirection:'row'},
  btnTxt:{color:'#fff',fontSize:16,fontWeight:'700'},
  note2:{color:C.muted,fontSize:11,textAlign:'center',marginTop:'auto',marginBottom:16},
  manualLink:{alignItems:'center',marginTop:16},
  manualLinkTxt:{color:C.primary,fontSize:13,fontWeight:'700'},
  manualBox:{marginTop:14,backgroundColor:C.surface,borderRadius:16,borderWidth:1,borderColor:C.border,padding:16},
  manualLabel:{color:C.sub,fontSize:12,marginBottom:8,textAlign:'right'},
  manualInput:{backgroundColor:C.elevated,borderWidth:1,borderColor:C.border,borderRadius:12,color:C.text,fontSize:15,paddingHorizontal:14,paddingVertical:10,textAlign:'right'},
  manualErr:{color:C.danger,fontSize:12,marginTop:8,textAlign:'right'},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  okIcon:{marginBottom:18},
});
