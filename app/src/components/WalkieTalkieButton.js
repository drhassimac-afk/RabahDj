import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useRabahSocket } from "../context/SocketContext";
import colors from "../theme/colors";

export default function WalkieTalkieButton() {
  const { walkieSettings, walkieMessages, sendWalkieAudio, userName } = useRabahSocket();
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [lastSender, setLastSender] = useState(null);
  const soundRef = useRef(null);
  const lastPlayedId = useRef(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (!walkieMessages || walkieMessages.length === 0) return;
    const latest = walkieMessages[walkieMessages.length - 1];
    if (latest.id === lastPlayedId.current) return;
    lastPlayedId.current = latest.id;
    playIncomingAudio(latest);
  }, [walkieMessages]);

  const playIncomingAudio = async (msg) => {
    try {
      setLastSender(msg.sender);
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/m4a;base64,${msg.audioBase64}` },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setLastSender(null);
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.error("خطأ في تشغيل الرسالة الصوتية:", err);
    }
  };

  const startRecording = async () => {
    if (!walkieSettings?.enabled) {
      Alert.alert("غير متاح", "نظام التالكي ووكي معطّل حالياً من قبل المشرف.");
      return;
    }
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("صلاحية مطلوبة", "يجب السماح باستخدام الميكروفون لإرسال رسائل صوتية.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error("خطأ في بدء التسجيل:", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const durationMillis = status.durationMillis || 0;

      if (durationMillis < 500) {
        setRecording(null);
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      sendWalkieAudio(base64, durationMillis);
    } catch (err) {
      console.error("خطأ في إيقاف التسجيل:", err);
    }
    setRecording(null);
  };

  return (
    <View style={styles.container}>
      {lastSender ? (
        <View style={styles.playingBanner}>
          <Text style={styles.playingText}>🔊 {lastSender} يتحدث الآن...</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.talkButton, isRecording && styles.talkButtonActive]}
        onPressIn={startRecording}
        onPressOut={stopRecording}
        activeOpacity={0.8}
      >
        <Text style={styles.talkButtonText}>
          {isRecording ? "🎙️ جارٍ التسجيل... اترك للإرسال" : "🎙️ اضغط مطولاً للتحدث"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 16,
    left: 12,
    right: 12,
    alignItems: "center",
  },
  playingBanner: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.online,
  },
  playingText: {
    color: colors.online,
    fontWeight: "600",
    fontSize: 13,
  },
  talkButton: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  talkButtonActive: {
    backgroundColor: colors.danger,
  },
  talkButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
