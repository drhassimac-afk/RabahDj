import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRabahSocket } from '../context/SocketContext';

export default function WalkieTalkieButton() {
  const { walkieSettings, sendWalkieAudio, userName } = useRabahSocket();
  const [isTalking, setIsTalking] = useState(false);
  const [sound, setSound] = useState(null);
  const waveAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTalking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1.3,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      waveAnim.setValue(1);
    }
  }, [isTalking]);

  const playBeepSound = async (type) => {
    try {
      const { sound: soundObj } = await Audio.Sound.createAsync(
        type === 'start'
          ? { uri: 'https://actions.google.com/sounds/v1/tones/beep_short.ogg' }
          : { uri: 'https://actions.google.com/sounds/v1/tones/single_beep.ogg' }
      );
      setSound(soundObj);
      await soundObj.playAsync();
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  if (!walkieSettings?.enabled) return null;

  const handlePressIn = () => {
    setIsTalking(true);
    playBeepSound('start');
  };

  const handlePressOut = () => {
    setIsTalking(false);
    playBeepSound('stop');
    // إرسال إشارة صوتية عبر الـ Socket
    if (sendWalkieAudio) {
      sendWalkieAudio("demo_audio_payload", 2);
    }
  };

  return (
    <View style={styles.container}>
      {isTalking && (
        <View style={styles.speakerPill}>
          <Ionicons name="volume-high" size={14} color="#00ffcc" />
          <Text style={styles.speakerText}>{userName || 'أنت'} تبث الآن...</Text>
        </View>
      )}

      <Animated.View style={[styles.waveCircle, isTalking && { transform: [{ scale: waveAnim }] }]} />

      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.button, isTalking && styles.buttonActive]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Ionicons name={isTalking ? "mic" : "radio"} size={26} color={isTalking ? "#0b0f19" : "#fff"} />
        <Text style={[styles.btnText, isTalking && styles.btnTextActive]}>
          {isTalking ? "تحدث الآن..." : "اضغط للتحدث PTT"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  speakerPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#00ffcc',
  },
  speakerText: {
    color: '#00ffcc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  waveCircle: {
    position: 'absolute',
    width: 140,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 204, 0.25)',
  },
  button: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  buttonActive: {
    backgroundColor: '#00ffcc',
    borderColor: '#fff',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnTextActive: {
    color: '#0b0f19',
  },
});
