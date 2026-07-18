import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRabahSocket } from '../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen() {
  const { connected, socket } = useRabahSocket();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [activeRoom, setActiveRoom] = useState('المركزية');

  useEffect(() => {
    if (connected && isStreaming) {
      // الانضمام لغرفة البث على السيرفر المحلي لتنسيق الكاميرات
      socket.emit('join-stream-room', activeRoom);
    }
  }, [isStreaming, connected]);

  const toggleStream = () => {
    if (!connected) {
      Alert.alert('خطأ في الاتصال', 'يجب أن تكون متصلاً بالسيرفر المحلي أولاً لبث الكاميرا.');
      return;
    }
    
    if (isStreaming) {
      setIsStreaming(false);
      setIsCamOn(false);
      Alert.alert('تم إنهاء البث', 'تم إغلاق الكاميرا وإيقاف البث الحي المحلي.');
    } else {
      setIsStreaming(true);
      setIsCamOn(true);
      Alert.alert('بث مباشر', 'أنت الآن تبث الكاميرا عبر الشبكة المحلية لجميع الهواتف المتصلة!');
    }
  };

  return (
    <View style={styles.container}>
      {/* منطقة عرض الكاميرا (هنا يتم ربط كاميرا الـ WebRTC) */}
      <View style={styles.cameraPreview}>
        {isCamOn ? (
          <View style={styles.liveBadge}>
            <View style={styles.redDot} />
            <Text style={styles.liveText}>مباشر LAN</Text>
          </View>
        ) : null}

        <Ionicons 
          name={isCamOn ? "videocam" : "videocam-off"} 
          size={64} 
          color={isCamOn ? '#10b981' : '#64748b'} 
        />
        <Text style={styles.previewText}>
          {isCamOn ? "📡 الكاميرا تبث الآن على الشبكة المحلية..." : "الكاميرا مغلقة"}
        </Text>
      </View>

      {/* لوحة التحكم السفلى */}
      <View style={styles.controlsContainer}>
        <Text style={styles.roomText}>غرفة البث الحالية: {activeRoom}</Text>
        
        <TouchableOpacity 
          style={[styles.streamButton, isStreaming && styles.stopButton]} 
          onPress={toggleStream}
          activeOpacity={0.8}
        >
          <Ionicons name={isStreaming ? "stop-circle" : "radio-button-on"} size={28} color="#fff" />
          <Text style={styles.buttonText}>
            {isStreaming ? "إيقاف البث المباشر" : "بدء بث الكاميرا الحية"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  cameraPreview: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827', margin: 20, borderRadius: 20, borderHorizontal: 1, borderColor: '#1e293b', position: 'relative' },
  liveBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginLeft: 6 },
  liveText: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' },
  previewText: { color: '#94a3b8', marginTop: 15, fontSize: 14, textAlign: 'center' },
  controlsContainer: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, alignItems: 'center' },
  roomText: { color: '#94a3b8', fontSize: 14, marginBottom: 15 },
  streamButton: { backgroundColor: '#3b82f6', flexDirection: 'row-reverse', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 30, alignItems: 'center', justifyContent: 'center', width: '100%' },
  stopButton: { backgroundColor: '#ef4444' },
  buttonText: { color: '#fff', fontWeight: 'bold', marginRight: 10, fontSize: 16 }
});
