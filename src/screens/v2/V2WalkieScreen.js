import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { getSocket } from '../../api/socket';

const C = { bg:'#0B1120', surface:'#161F2E', elevated:'#1E2A3D', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', danger:'#EF4444', gold:'#FACC15', walkie:'#14B8A6', walkieBg:'#0F3B36', walkieDark:'#083330' };

export default function V2WalkieScreen({ navigation }) {
  const sock = useRef(getSocket());
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const startRef = useRef(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const [isRecording, setIsRecording] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [log, setLog] = useState([]);
  const [toast, setToast] = useState('');
  const tT = useRef(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const flash = (m) => {
    setToast(m);
    clearTimeout(tT.current);
    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
    tT.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(''));
    }, 1900);
  };

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Audio.requestPermissionsAsync();
    const s = sock.current;

    const onSettings = (w) => setEnabled(!!(w && w.enabled));
    const onReceived = async (data) => {
      try {
        if (!data?.audioBase64) return;
        setLog(prev => [{ id: Date.now().toString(), sender: data.sender, color: data.avatarColor }, ...prev].slice(0, 20));
        const fileUri = FileSystem.cacheDirectory + `walkie_${Date.now()}.m4a`;
        await FileSystem.writeAsStringAsync(fileUri, data.audioBase64, { encoding: FileSystem.EncodingType.Base64 });
        if (soundRef.current) await soundRef.current.unloadAsync().catch(() => {});
        const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
        soundRef.current = sound;
        await sound.playAsync();
        flash('📻 ' + (data.sender || 'مستخدم') + ' يتحدث');
      } catch (err) { flash('⚠️ تعذّر تشغيل الصوت'); }
    };
    const onErr = (e) => { if (e && e.message) flash('⚠️ ' + e.message); };

    s.on('walkie_settings_update', onSettings);
    s.on('walkie_audio_received', onReceived);
    s.on('error', onErr);
    return () => { s.off('walkie_settings_update', onSettings); s.off('walkie_audio_received', onReceived); s.off('error', onErr); };
  }, []);

  useEffect(() => {
    if (!isRecording) { pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isRecording]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  const startRecording = async () => {
    if (!enabled) { flash('🔇 التخاطب اللاسلكي معطّل حاليًا'); Vibration.vibrate(60); return; }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      startRef.current = Date.now();
      setIsRecording(true);
      Vibration.vibrate(30);
    } catch (err) { flash('⚠️ تعذّر بدء التسجيل'); }
  };

  const stopRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const duration = Date.now() - startRef.current;
      recordingRef.current = null;
      if (duration < 400) { flash('⏱️ اضغط مطولًا للتحدث'); return; }
      const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      sock.current.emit('walkie_audio', { audioBase64, duration });
      Vibration.vibrate(20);
      flash('✅ تم الإرسال');
    } catch (err) { flash('⚠️ خطأ أثناء الإرسال'); }
  };

  const Row = ({ item, index }) => {
    const rowFade = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(rowFade, { toValue: 1, duration: 300, delay: Math.min(index, 6) * 40, useNativeDriver: true }).start();
    }, []);
    return (
      <Animated.View style={{ opacity: rowFade }}>
        <View style={st.row}>
          <View style={[st.av, { backgroundColor: item.color || C.walkie }]}><Text style={st.avT}>{(item.sender || '?').trim().charAt(0)}</Text></View>
          <Text style={st.rowTxt}>{item.sender || 'مستخدم'} تحدّث الآن</Text>
          <Ionicons name="volume-medium" size={16} color={C.walkie} />
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-forward" size={24} color={C.sub} />
        </TouchableOpacity>
        <Text style={st.hTitle}>التخاطب اللاسلكي</Text>
        <View style={[st.statusDot, { backgroundColor: enabled ? C.walkie : C.danger }]} />
      </View>

      {!enabled && (
        <View style={st.disabledBanner}><Ionicons name="mic-off" size={16} color={C.danger} /><Text style={st.disabledTxt}>الميزة معطّلة حاليًا من الإدارة</Text></View>
      )}

      <FlatList
        data={log}
        keyExtractor={i => i.id}
        renderItem={Row}
        contentContainerStyle={st.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={st.emptyBox}>
            <Ionicons name="radio-outline" size={40} color={C.muted} />
            <Text style={st.empty}>لسا ما تحدّث أحد{'\n'}اضغط مطولًا على الزر بالأسفل للتحدث</Text>
          </View>
        }
      />

      <Animated.View style={[st.footer, { opacity: fade }]}>
        <View style={st.talkWrap}>
          <Animated.View style={[st.pulseRing, { backgroundColor: isRecording ? C.danger : C.walkie, transform: [{ scale: ringScale }], opacity: isRecording ? ringOpacity : 0 }]} />
          <Animated.View style={{ transform: [{ scale: isRecording ? scale : 1 }] }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              disabled={!enabled}
            >
              <LinearGradient
                colors={enabled ? (isRecording ? ['#F87171', C.danger] : ['#2DD4BF', C.walkieDark]) : [C.muted, '#3A4452']}
                style={st.talkBtn}
              >
                <Ionicons name={isRecording ? 'mic' : 'radio'} size={34} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <Text style={st.hint}>{isRecording ? 'جاري التسجيل... افلت للإرسال' : 'اضغط مطولًا للتحدث'}</Text>
      </Animated.View>

      {!!toast && (
        <Animated.View style={[st.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Text style={st.toastTxt}>{toast}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex:1, backgroundColor:C.bg },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:18, paddingVertical:14 },
  hTitle: { color:C.text, fontSize:18, fontWeight:'800' },
  statusDot: { width:10, height:10, borderRadius:5 },
  disabledBanner: { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#2A1414', paddingVertical:8, marginHorizontal:16, borderRadius:10, marginBottom:8 },
  disabledTxt: { color:C.danger, fontSize:12, fontWeight:'600', marginRight:6 },
  list: { padding:16, paddingBottom:20, flexGrow:1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  empty: { color:C.muted, textAlign:'center', marginTop:14, fontSize:14, lineHeight:22 },
  row: { flexDirection:'row', alignItems:'center', backgroundColor:C.surface, borderRadius:14, padding:12, marginBottom:8, borderWidth:1, borderColor:C.border },
  av: { width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center', marginLeft:10 },
  avT: { color:'#fff', fontWeight:'700' },
  rowTxt: { color:C.text, fontSize:13, flex: 1 },
  footer: { alignItems:'center', paddingBottom:34, paddingTop:10 },
  talkWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position:'absolute', width:120, height:120, borderRadius:60 },
  talkBtn: {
    width:88, height:88, borderRadius:44, alignItems:'center', justifyContent:'center',
    shadowColor: C.walkie, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  hint: { color:C.sub, fontSize:13, marginTop:14, fontWeight:'600' },
  toast: { position:'absolute', bottom:150, alignSelf:'center', backgroundColor:C.elevated, borderWidth:1, borderColor:C.walkie, borderRadius:14, paddingHorizontal:18, paddingVertical:10 },
  toastTxt: { color:C.text, fontSize:13, fontWeight:'600' },
});
