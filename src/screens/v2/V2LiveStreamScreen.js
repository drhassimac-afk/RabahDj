import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RTCPeerConnection, RTCView, mediaDevices } from 'react-native-webrtc';
import { getSocket } from '../../api/socket';

const C = { bg:'#0B1120', surface:'#161F2E', elevated:'#1E2A3D', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', danger:'#EF4444', live:'#A855F7', liveBg:'#2A1B3D' };
const ROOM = 'rabahdj-main';
const RTC_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function PressableScale({ style, onPress, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 60 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.85} onPressIn={onIn} onPressOut={onOut}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function V2LiveStreamScreen({ navigation }) {
  const sock = useRef(getSocket());
  const peersRef = useRef({});      // للمذيع: { viewerId: RTCPeerConnection }
  const pcRef = useRef(null);       // للمشاهد: اتصال وحيد بالمذيع
  const localStreamRef = useRef(null);
  const [role, setRole] = useState(null); // null | 'broadcaster' | 'viewer'
  const [remoteStream, setRemoteStream] = useState(null);
  const [live, setLive] = useState(false);
  const [broadcasterName, setBroadcasterName] = useState('');
  const [toast, setToast] = useState('');
  const tT = useRef(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const livePulse = useRef(new Animated.Value(1)).current;

  const flash = (m) => {
    setToast(m);
    clearTimeout(tT.current);
    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
    tT.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(''));
    }, 2200);
  };

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [role]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(livePulse, { toValue: 1.6, duration: 700, useNativeDriver: true }),
      Animated.timing(livePulse, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    const s = sock.current;
    const onRadioState = (d) => { setLive(!!d.active); setBroadcasterName(d.broadcaster || ''); };
    s.on('radio_state_change', onRadioState);
    return () => s.off('radio_state_change', onRadioState);
  }, []);

  const cleanup = useCallback(() => {
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setRemoteStream(null);
  }, []);

  useEffect(() => () => {
    sock.current.emit('leave-stream-room', { room: ROOM });
    cleanup();
  }, [cleanup]);

  // ===== دور المذيع =====
  const startBroadcast = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({ audio: true, video: { facingMode: 'user' } });
      localStreamRef.current = stream;
      setRole('broadcaster');
      setRemoteStream(stream); // نعرض معاينة الكاميرا لنفسه

      const s = sock.current;
      s.emit('join-stream-room', { room: ROOM, role: 'broadcaster' });
      s.emit('start_broadcast');

      const onViewerJoined = async ({ viewerId }) => {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        peersRef.current[viewerId] = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        pc.onicecandidate = (e) => { if (e.candidate) s.emit('webrtc-ice-candidate', { to: viewerId, candidate: e.candidate }); };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        s.emit('webrtc-offer', { to: viewerId, offer });
      };
      const onAnswer = async ({ from, answer }) => {
        const pc = peersRef.current[from];
        if (pc) await pc.setRemoteDescription(answer);
      };
      const onIce = async ({ from, candidate }) => {
        const pc = peersRef.current[from];
        if (pc && candidate) await pc.addIceCandidate(candidate).catch(() => {});
      };

      s.on('viewer-joined', onViewerJoined);
      s.on('webrtc-answer', onAnswer);
      s.on('webrtc-ice-candidate', onIce);
      Vibration.vibrate(30);
      flash('🔴 البث بدأ');
    } catch (err) {
      flash('⚠️ تعذّر الوصول للكاميرا/المايكروفون');
    }
  };

  const stopBroadcast = () => {
    const s = sock.current;
    s.emit('stop_broadcast');
    s.emit('leave-stream-room', { room: ROOM });
    s.off('viewer-joined'); s.off('webrtc-answer'); s.off('webrtc-ice-candidate');
    cleanup();
    setRole(null);
    Vibration.vibrate(20);
    flash('⏹️ تم إنهاء البث');
  };

  // ===== دور المشاهد =====
  const joinAsViewer = () => {
    setRole('viewer');
    const s = sock.current;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.onicecandidate = (e) => { if (e.candidate) s.emit('webrtc-ice-candidate', { to: null, candidate: e.candidate }); };
    pc.ontrack = (e) => setRemoteStream(e.streams[0]);

    const onOffer = async ({ from, offer }) => {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      s.emit('webrtc-answer', { to: from, answer });
      pc.onicecandidate = (e) => { if (e.candidate) s.emit('webrtc-ice-candidate', { to: from, candidate: e.candidate }); };
    };
    const onIce = async ({ candidate }) => { if (candidate) await pc.addIceCandidate(candidate).catch(() => {}); };
    const onEnded = () => { flash('📴 انتهى البث'); leaveAsViewer(); };

    s.on('webrtc-offer', onOffer);
    s.on('webrtc-ice-candidate', onIce);
    s.on('stream-ended', onEnded);
    s.emit('join-stream-room', { room: ROOM, role: 'viewer' });
    flash('📡 جاري الاتصال بالبث...');
  };

  const leaveAsViewer = () => {
    const s = sock.current;
    s.emit('leave-stream-room', { room: ROOM });
    s.off('webrtc-offer'); s.off('webrtc-ice-candidate'); s.off('stream-ended');
    cleanup();
    setRole(null);
  };

  const exit = () => {
    if (role === 'broadcaster') stopBroadcast();
    else if (role === 'viewer') leaveAsViewer();
    navigation.goBack();
  };

  // ===== شاشة الاختيار (قبل الدخول بأي دور) =====
  if (!role) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-forward" size={24} color={C.sub} />
          </TouchableOpacity>
          <Text style={st.hTitle}>البث المباشر</Text>
          <View style={{ width:24 }} />
        </View>
        <Animated.View style={[st.center, { opacity: fade }]}>
          <View style={st.liveIcon}>
            {live && (
              <Animated.View style={[st.liveIconPulse, { transform: [{ scale: livePulse }], opacity: livePulse.interpolate({ inputRange: [1, 1.6], outputRange: [0.5, 0] }) }]} />
            )}
            <Ionicons name="videocam" size={54} color={C.live} />
          </View>
          {live ? (
            <>
              <Text style={st.statusTxt}>🔴 {broadcasterName || 'أحدهم'} يبثّ الآن</Text>
              <PressableScale style={st.btn} onPress={joinAsViewer}>
                <Ionicons name="eye" size={20} color="#fff" style={{ marginLeft:8 }} />
                <Text style={st.btnTxt}>مشاهدة البث</Text>
              </PressableScale>
            </>
          ) : (
            <>
              <Text style={st.statusTxt}>لا يوجد بث حاليًا</Text>
              <PressableScale style={[st.btn, { backgroundColor:C.live }]} onPress={startBroadcast}>
                <Ionicons name="radio" size={20} color="#fff" style={{ marginLeft:8 }} />
                <Text style={st.btnTxt}>ابدأ البث الآن</Text>
              </PressableScale>
            </>
          )}
        </Animated.View>
        {!!toast && (
          <Animated.View style={[st.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={st.toastTxt}>{toast}</Text>
          </Animated.View>
        )}
      </SafeAreaView>
    );
  }

  // ===== شاشة البث الفعلية (مذيع أو مشاهد) =====
  return (
    <SafeAreaView style={st.safeVideo}>
      {remoteStream ? (
        <RTCView streamURL={remoteStream.toURL()} style={st.video} objectFit="cover" mirror={role === 'broadcaster'} />
      ) : (
        <View style={[st.video, st.videoLoading]}>
          <ActivityIndicator size="large" color={C.live} />
          <Text style={[st.statusTxt, { marginTop: 16 }]}>جاري الاتصال...</Text>
        </View>
      )}
      <View style={st.overlayTop}>
        <View style={st.liveBadge}>
          <Animated.View style={[st.liveDot, { transform: [{ scale: livePulse }] }]} />
          <Text style={st.liveBadgeTxt}>{role === 'broadcaster' ? 'أنت تبثّ' : 'مشاهدة'}</Text>
        </View>
      </View>
      <View style={st.overlayBottom}>
        <PressableScale style={st.exitBtn} onPress={exit}>
          <Ionicons name={role === 'broadcaster' ? 'stop-circle' : 'close-circle'} size={22} color="#fff" />
          <Text style={st.exitTxt}>{role === 'broadcaster' ? 'إنهاء البث' : 'مغادرة'}</Text>
        </PressableScale>
      </View>
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
  safeVideo: { flex:1, backgroundColor:'#000' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:18, paddingVertical:14 },
  hTitle: { color:C.text, fontSize:18, fontWeight:'800' },
  center: { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:30 },
  liveIcon: { width:110, height:110, borderRadius:55, backgroundColor:C.liveBg, alignItems:'center', justifyContent:'center', marginBottom:24 },
  liveIconPulse: { position:'absolute', width:110, height:110, borderRadius:55, backgroundColor:C.live },
  statusTxt: { color:C.text, fontSize:16, fontWeight:'700', marginBottom:24, textAlign:'center' },
  btn: { flexDirection:'row', backgroundColor:C.primary, height:54, borderRadius:27, paddingHorizontal:28, alignItems:'center', justifyContent:'center' },
  btnTxt: { color:'#fff', fontSize:16, fontWeight:'700' },
  video: { flex:1, width:'100%' },
  videoLoading: { alignItems:'center', justifyContent:'center', backgroundColor:'#111' },
  overlayTop: { position:'absolute', top:44, left:16 },
  liveBadge: { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(239,68,68,0.9)', borderRadius:16, paddingHorizontal:12, paddingVertical:6 },
  liveDot: { width:8, height:8, borderRadius:4, backgroundColor:'#fff', marginLeft:6 },
  liveBadgeTxt: { color:'#fff', fontSize:12, fontWeight:'700' },
  overlayBottom: { position:'absolute', bottom:34, alignSelf:'center' },
  exitBtn: { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(0,0,0,0.6)', borderRadius:24, paddingHorizontal:20, paddingVertical:12 },
  exitTxt: { color:'#fff', fontSize:14, fontWeight:'700', marginRight:8 },
  toast: { position:'absolute', bottom:120, alignSelf:'center', backgroundColor:C.elevated, borderWidth:1, borderColor:C.live, borderRadius:14, paddingHorizontal:18, paddingVertical:10 },
  toastTxt: { color:C.text, fontSize:13, fontWeight:'600' },
});
