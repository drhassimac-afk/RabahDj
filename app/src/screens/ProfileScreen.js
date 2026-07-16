import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useRabahSocket } from "../context/SocketContext";
import colors from "../theme/colors";

export default function ProfileScreen() {
  const { userName, serverIp, onlineUsers, posts, disconnect, userId } = useRabahSocket();
  const myPostsCount = posts.filter((p) => p.authorId === userId).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userName?.[0]?.toUpperCase() || "?"}</Text>
        </View>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.subtitle}>متصل بشبكة RabahDj المحلية</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{myPostsCount}</Text>
            <Text style={styles.statLabel}>منشوراتي</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{onlineUsers.length}</Text>
            <Text style={styles.statLabel}>متصلون الآن</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>عنوان السيرفر</Text>
          <Text style={styles.infoValue}>{serverIp}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={disconnect}>
          <Text style={styles.logoutText}>قطع الاتصال</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { alignItems: "center", padding: 24 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "bold", color: colors.text, marginTop: 14 },
  subtitle: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  statsRow: { flexDirection: "row-reverse", marginTop: 24, width: "100%" },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 6,
  },
  statNumber: { fontSize: 22, fontWeight: "bold", color: colors.primary },
  statLabel: { fontSize: 12, color: colors.subtext, marginTop: 4 },
  infoCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: "flex-end",
  },
  infoLabel: { fontSize: 12, color: colors.subtext },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: "600", marginTop: 4 },
  logoutBtn: {
    marginTop: 30,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  logoutText: { color: colors.danger, fontWeight: "700" },
});
