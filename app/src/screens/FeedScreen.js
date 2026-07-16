import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRabahSocket } from "../context/SocketContext";
import PostCard from "../components/PostCard";
import PostComposer from "../components/PostComposer";
import colors from "../theme/colors";

export default function FeedScreen() {
  const { posts, onlineUsers, connected } = useRabahSocket();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>RabahDj</Text>
        <View style={styles.statusPill}>
          <View style={[styles.dot, { backgroundColor: connected ? colors.online : colors.danger }]} />
          <Text style={styles.statusText}>
            {connected ? `${onlineUsers.length} متصل الآن` : "غير متصل"}
          </Text>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={
          <>
            <OnlineUsersBar users={onlineUsers} />
            <PostComposer />
          </>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>لا توجد منشورات بعد، كن أول من ينشر شيئاً!</Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

function OnlineUsersBar({ users }) {
  if (!users.length) return null;
  return (
    <ScrollView
      horizontal
      inverted
      showsHorizontalScrollIndicator={false}
      style={styles.onlineBar}
      contentContainerStyle={{ paddingHorizontal: 12 }}
    >
      {users.map((u) => (
        <View key={u.id} style={styles.onlineUser}>
          <View style={[styles.onlineAvatar, { backgroundColor: u.avatarColor }]}>
            <Text style={styles.onlineAvatarText}>{u.name?.[0]?.toUpperCase()}</Text>
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.onlineName} numberOfLines={1}>
            {u.name}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { fontSize: 22, fontWeight: "bold", color: colors.primary },
  statusPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
  statusText: { fontSize: 11, color: colors.subtext, fontWeight: "600" },
  onlineBar: { marginTop: 10, marginBottom: 4 },
  onlineUser: { alignItems: "center", marginLeft: 14, width: 56 },
  onlineAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineAvatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  onlineIndicator: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.online,
    borderWidth: 2,
    borderColor: colors.card,
  },
  onlineName: { fontSize: 11, color: colors.subtext, marginTop: 4 },
  empty: { textAlign: "center", color: colors.subtext, marginTop: 40, fontSize: 14 },
});
