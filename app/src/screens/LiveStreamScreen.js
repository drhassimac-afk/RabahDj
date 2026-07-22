import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Dimensions, PermissionsAndroid, Platform } from 'react-native';
import { useRabahSocket } from '../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCView,
} from 'react-native-webrtc';

const { width, height } = Dimensions.get('window');
const ROOM = 'المركزية';

// ✅ بدون سيرفرات STUN/TURN خارجية - الشبكة محلية بالكامل
const PC_CONFIG = { iceServers: [] };

async function requestMediaPermissions() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    return (
      granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (err) {
    console.error('خطأ في طلب الأذونات:', err);
    return false;
  }
}

export default function LiveStreamScreen() {
  const { connected, socket, mySocketId } = useRabahSocket();

  const [mode, setMode] = useState(null); // 'broadcaster' | 'viewer' | null
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);

  const peersRef = useRef({}); // للمذيع: { viewerId: RTCPeerConnection }
  const viewerPcRef = useRef(null); // للمشاهد: اتصال واحد بالمذيع
  const broadcasterIdRef = useRef(null); // للمشاهد: هوية المذيع

  // ✅ تنظيف شامل عند إغلاق الشاشة
  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleViewerJoined = async ({ viewerId }) => {
      if (mode !== 'broadcaster' || !localStream) return;
      await createOfferForViewer(viewerId);
    };

    const handleOffer = async ({ from, offer }) => {
      if (mode !== 'viewer') return;
      broadcasterIdRef.current = from;
      await handleReceivedOffer(offer, from);
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(answer);
      }
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      try {
        if (mode === 'broadcaster') {
          const pc = peersRef.current[from];
          if (pc && candidate) await pc.addIceCandidate(candidate);
        } else if (mode === 'viewer' && viewerPcRef.current && candidate) {
          await viewerPcRef.current.addIceCandidate(candidate);
        }
      } catch (err) {
        console.error('خطأ ICE candidate:', err);
      }
    };

    const handleStreamEnded = () => {
      if (mode === 'viewer') {
        Alert.alert('انتهى البث', 'أنهى المذيع البث المباشر.');
        stopEverything();
      }
    };

    socket.on('viewer-joined', handleViewerJoined);
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('stream-ended', handleStreamEnded);

    return () => {
      socket.off('viewer-joined', handleViewerJoined);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('stream-ended', handleStreamEnded);
    };
  }, [socket, mode, localStream]);

  // ========================================
  // 📡 جانب المذيع (Broadcaster)
  // ========================================
  const createOfferForViewer = async (viewerId) => {
    const pc = new RTCPeerConnection(PC_CONFIG);
    peersRef.current[viewerId] = pc;

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', {
          to: viewerId,
          candidate: event.candidate,
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('webrtc-offer', { to: viewerId, offer });

    setViewerCount(Object.keys(peersRef.current).length);
  };

  const startBroadcasting = async () => {
    if (!connected) {
      Alert.alert('خطأ في الاتصال', 'يجب أن تكون متصلاً بالسيرفر المحلي أولاً.');
      return;
    }

    const hasPermissions = await requestMediaPermissions();
    if (!hasPermissions) {
      Alert.alert('الأذونات مطلوبة', 'يجب السماح بالوصول للكاميرا والميكروفون للبث المباشر.');
      return;
    }

    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
        },
      });

      setLocalStream(stream);
      setMode('broadcaster');
      socket.emit('join-stream-room', { room: ROOM, role: 'broadcaster' });
    } catch (err) {
      console.error('خطأ في فتح الكاميرا:', err);
      Alert.alert('خطأ', 'تعذّر الوصول للكاميرا أو الميكروفون.');
    }
  };

  // ========================================
  // 👁 جانب المشاهد (Viewer)
  // ========================================
  const handleReceivedOffer = async (offer, broadcasterId) => {
    const pc = new RTCPeerConnection(PC_CONFIG);
    viewerPcRef.current = pc;
    peersRef.current[broadcasterId] = pc;

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', {
          to: broadcasterId,
          candidate: event.candidate,
        });
      }
    };

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('webrtc-answer', { to: broadcasterId, answer });
  };

  const startWatching = () => {
    if (!connected) {
      Alert.alert('خطأ في الاتصال', 'يجب أن تكون متصلاً بالسيرفر المحلي أولاً.');
      return;
    }

    setMode('viewer');
    socket.emit('join-stream-room', { room: ROOM, role: 'viewer' });
    Alert.alert('وضع المشاهدة', 'بانتظار بدء المذيع للبث...');
  };

  // ========================================
  // 🛑 إيقاف كل شيء وتنظيف الموارد
  // ========================================
  const stopEverything = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    Object.values(peersRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    peersRef.current = {};

    if (viewerPcRef.current) {
      try {
        viewerPcRef.current.close();
      } catch (e) {}
      viewerPcRef.current = null;
    }

    if (socket && mode) {
      socket.emit('leave-stream-room', { room: ROOM });
    }

    setLocalStream(null);
    setRemoteStream(null);
    setViewerCount(0);
    setMode(null);
  };

  const handleStopButton = () => {
    stopEverything();
    Alert.alert('تم الإيقاف', mode === 'broadcaster' ? 'تم إنهاء البث المباشر.' : 'تم الخروج من المشاهدة.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraPreview}>
        {mode === 'broadcaster' && localStream ? (
          <>
            <View style={styles.liveBadge}>
              <View style={styles.redDot} />
              <Text style={styles.liveText}>مباشر LAN • {viewerCount} مشاهد</Text>
            </View>
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.video}
              objectFit="cover"
              mirror={true}
            />
          </>
        ) : mode === 'viewer' && remoteStream ? (
          <>
            <View style={styles.liveBadge}>
              <View style={styles.redDot} />
              <Text style={styles.liveText}>مباشر LAN</Text>
            </View>
            <RTCView
              streamURL={remoteStream.toURL()}
              style={styles.video}
              objectFit="cover"
            />
          </>
        ) : (
          <>
            <Ionicons
              name={mode === 'viewer' ? 'hourglass-outline' : 'videocam-off'}
              size={64}
              color="#64748b"
            />
            <Text style={styles.previewText}>
              {mode === 'viewer'
                ? 'بانتظار بدء المذيع للبث...'
                : 'الكاميرا مغلقة'}
            </Text>
          </>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <Text style={styles.roomText}>غرفة البث الحالية: {ROOM}</Text>

        {mode ? (
          <TouchableOpacity
            style={[styles.streamButton, styles.stopButton]}
            onPress={handleStopButton}
            activeOpacity={0.8}
          >
            <Ionicons name="stop-circle" size={28} color="#fff" />
            <Text style={styles.buttonText}>
              {mode === 'broadcaster' ? 'إيقاف البث المباشر' : 'الخروج من المشاهدة'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.streamButton, styles.halfButton]}
              onPress={startBroadcasting}
              activeOpacity={0.8}
            >
              <Ionicons name="radio-button-on" size={24} color="#fff" />
              <Text style={styles.buttonText}>بدء البث</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.streamButton, styles.halfButton, styles.watchButton]}
              onPress={startWatching}
              activeOpacity={0.8}
            >
              <Ionicons name="eye" size={24} color="#fff" />
              <Text style={styles.buttonText}>مشاهدة البث</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  cameraPreview: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827', margin: 20, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', position: 'relative', overflow: 'hidden' },
  video: { width: '100%', height: '100%' },
  liveBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderColor: '#ef4444', zIndex: 10 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginLeft: 6 },
  liveText: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' },
  previewText: { color: '#94a3b8', marginTop: 15, fontSize: 14, textAlign: 'center' },
  controlsContainer: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, alignItems: 'center' },
  roomText: { color: '#94a3b8', fontSize: 14, marginBottom: 15 },
  buttonRow: { flexDirection: 'row', width: '100%', gap: 10 },
  streamButton: { backgroundColor: '#3b82f6', flexDirection: 'row-reverse', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, alignItems: 'center', justifyContent: 'center', width: '100%' },
  halfButton: { flex: 1, width: undefined },
  watchButton: { backgroundColor: '#8b5cf6' },
  stopButton: { backgroundColor: '#ef4444' },
  buttonText: { color: '#fff', fontWeight: 'bold', marginRight: 8, fontSize: 15 },
});
