import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useRabahSocket } from '../context/SocketContext';
import colors from '../theme/colors';

export default function WalkieTalkieButton() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const { socket } = useRabahSocket();

  useEffect(() => {
    // طلب صلاحيات استخدام المايكروفون عند فتح المكون
    Audio.requestPermissionsAsync();
  }, []);

  async function startRecording() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('فشل بدء التسجيل', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    // عند الإفلات نرسل حدث الصوت عبر السوكت
    if (socket && uri) {
      socket.emit('walkie_talkie_audio', { audioUri: uri });
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
    backgroundColor: '#E41E3F', // لون أحمر عند التسجيل
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
