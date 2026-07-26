import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { getSocket } from '../../api/socket';

const C = { bg:'#0B1120', surface:'#161F2E', elevated:'#1E2A3D', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', danger:'#EF4444', gold:'#FACC15', walkie:'#14B8A6', walkieBg:'#0F3B36' };

export default function V2WalkieScreen({ navigation }) {
  const sock = useRef(getSocket());
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const startRef = useRef(0);
  const pulse = useRef(new Animated.Value(0)).current;

  const [isRecording, setIsRecording] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [log, setLog] = useState([]);
  const [toast, setToast] = useState('');
  const tT = useRef(null);

  const flash = (m) => { setToast(m); clearTimeout(tT.current); tT.current = setTimeout(()=>setToast(''),1900); };

  useEffect(() => {
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

  const Row = ({ item }) => (
    <View style={st.row}>
      <View style={[st.av, { backgroundColor: item.color || C.walkie }]}><Text style={st.avT}>{(item.sender || '?').trim().charAt(0)}</Text></View>
      <Text style={st.rowTxt}>{item.sender || 'مستخدم'} تحدّث الآن</Text>
    </View>
  );

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-forward" size={24} color={C.sub} /></TouchableOpacity>
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
        ListEmptyComponent={<Text style={st.empty}>لسا ما تحدّث أحد 📻{'\n'}اضغط مطولًا على الزر بالأسفل للتحدث</Text>}
      />

      <View style={st.footer}>
        <Animated.View style={[st.pulseRing, isRecording && { transform: [{ scale }] }]} />
        <TouchableOpacity
          activeOpacity={0.85}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          disabled={!enabled}
          style={[st.talkBtn, isRecording && st.talkBtnActive, !enabled && st.talkBtnDisabled]}
        >
          <Ionicons name={isRecording ? 'mic' : 'radio'} size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={st.hint}>{isRecording ? 'جاري التسجيل... افلت للإرسال' : 'اضغط مطولًا للتحدث'}</Text>
      </View>

      {!!toast && <View style={st.toast}><Text style={st.toastTxt}>{toast}</Text></View>}
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
  empty: { color:C.muted, textAlign:'center', marginTop:60, fontSize:14, lineHeight:22 },
  row: { flexDirection:'row', alignItems:'center', backgroundColor:C.surface, borderRadius:14, padding:12, marginBottom:8, borderWidth:1, borderColor:C.border },
  av: { width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center', marginLeft:10 },
  avT: { color:'#fff', fontWeight:'700' },
  rowTxt: { color:C.text, fontSize:13 },
  footer: { alignItems:'center', paddingBottom:34, paddingTop:10 },
  pulseRing: { position:'absolute', bottom:34, width:100, height:100, borderRadius:50, backgroundColor:C.walkie, opacity:0.25 },
  talkBtn: { width:84, height:84, borderRadius:42, backgroundColor:C.walkie, alignItems:'center', justifyContent:'center', elevation:6 },
  talkBtnActive: { backgroundColor:C.danger },
  talkBtnDisabled: { backgroundColor:C.muted },
  hint: { color:C.sub, fontSize:13, marginTop:14, fontWeight:'600' },
  toast: { position:'absolute', bottom:150, alignSelf:'center', backgroundColor:C.elevated, borderWidth:1, borderColor:C.walkie, borderRadius:14, paddingHorizontal:18, paddingVertical:10 },
  toastTxt: { color:C.text, fontSize:13, fontWeight:'600' },
});
