import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useRabahSocket } from '../context/SocketContext';
import colors from '../theme/colors';

export default function WalkieTalkieButton() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const { socket, walkieSettings } = useRabahSocket();
  const soundRef = useRef(null);
  const recordStartRef = useRef(0);

  useEffect(() => {
    // طلب صلاحيات استخدام المايكروفون عند فتح المكون
    Audio.requestPermissionsAsync();
  }, []);

  // ✅ استقبال وتشغيل أصوات التالكي ووكي من الآخرين
  useEffect(() => {
    if (!socket) return;

    const handleReceived = async (data) => {
      try {
        if (!data?.audioBase64) return;

        const fileUri = FileSystem.cacheDirectory + `walkie_${Date.now()}.m4a`;
        await FileSystem.writeAsStringAsync(fileUri, data.audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (soundRef.current) {
          await soundRef.current.unloadAsync().catch(() => {});
        }

        const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
        soundRef.current = sound;
        await sound.playAsync();
      } catch (err) {
        console.error('خطأ تشغيل صوت التالكي ووكي:', err);
      }
    };

    socket.on('walkie_audio_received', handleReceived);
    return () => socket.off('walkie_audio_received', handleReceived);
  }, [socket]);

  async function startRecording() {
    if (walkieSettings?.enabled === false) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordStartRef.current = Date.now();
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('فشل بدء التسجيل', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const duration = Date.now() - recordStartRef.current;
      setRecording(null);

      if (socket && uri) {
        const audioBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        socket.emit('walkie_audio', {
          audioBase64,
          duration,
        });
      }
    } catch (err) {
      console.error('خطأ إيقاف التسجيل', err);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={startRecording}
        onPressOut={stopRecording}
        style={[styles.button, isRecording && styles.recordingButton]}
      >
        <Text style={styles.icon}>{isRecording ? '🎙️' : '📻'}</Text>
        <Text style={styles.label}>
          {isRecording ? 'جاري التسجيل... (افلت للإرسال)' : 'اضغط للتحدث'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    zIndex: 999,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary || '#1877F2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  recordingButton: {
    backgroundColor: '#E41E3F',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  label: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
