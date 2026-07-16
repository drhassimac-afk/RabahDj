import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRabahSocket } from "../context/SocketContext";
import colors from "../theme/colors";

export default function PostComposer() {
  const { publishPost, userName } = useRabahSocket();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImage(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const handlePublish = () => {
    if (!text.trim() && !image) return;
    publishPost(text.trim(), image);
    setText("");
    setImage(null);
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userName?.[0]?.toUpperCase() || "?"}</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={`بماذا تفكر يا ${userName || ""}؟`}
          placeholderTextColor={colors.subtext}
          value={text}
          onChangeText={setText}
          multiline
          textAlign="right"
        />
      </View>

      {image ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: image }} style={styles.preview} />
          <TouchableOpacity style={styles.removeBtn} onPress={() => setImage(null)}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          <Text style={styles.photoText}>📷 صورة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishBtn, !text.trim() && !image && styles.publishDisabled]}
          onPress={handlePublish}
          disabled={!text.trim() && !image}
        >
          <Text style={styles.publishText}>نشر</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: { flexDirection: "row-reverse", alignItems: "flex-start" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  avatarText: { color: "#fff", fontWeight: "bold" },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 8,
    minHeight: 40,
  },
  previewWrap: { marginTop: 10, position: "relative" },
  preview: { width: "100%", height: 180, borderRadius: 10 },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { color: "#fff", fontWeight: "bold" },
  footer: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  photoBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  photoText: { color: colors.success, fontWeight: "600", fontSize: 14 },
  publishBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 22,
  },
  publishDisabled: { opacity: 0.4 },
  publishText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
