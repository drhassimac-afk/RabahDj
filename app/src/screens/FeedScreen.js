import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { useRabahSocket } from "../context/SocketContext";
import PostCard from "../components/PostCard";
import PostComposer from "../components/PostComposer";
import colors from "../theme/colors";
import WalkieTalkieButton from "../components/WalkieTalkieButton";

// منشورات تجريبية رائعة تحتوي على صور لتشاهد جمال التصميم فوراً!
const MOCK_POSTS = [
  {
    id: "1",
    author: {
      name: "رابح دي جي",
      avatarColor: "#1877F2",
    },
    content: "أهلاً بكم في تطبيقي الجديد RabahDj! تم تشغيل الواجهات وتنسيق الألوان بنجاح. ما رأيكم بالتصميم؟ 🚀🎨",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800", // صورة مؤتمر تكنولوجي رائعة
    likes: 12,
    commentsCount: 5,
    createdAt: "منذ دقيقتين",
  },
  {
    id: "2",
    author: {
      name: "أحمد المطور",
      avatarColor: "#42B72A",
    },
    content: "التطبيق يبدو مذهلاً والسرعة خرافية! الألوان متناسقة ومريحة جداً للعين. بالتوفيق يا رابح! 🌟👏",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800", // صورة دي جي وموسيقى مناسبة لاسم تطبيقك
    likes: 8,
    commentsCount: 2,
    createdAt: "منذ ساعة",
  }
];

// مستخدمون نشطون تجريبيون ليظهر الشريط العلوي مفعماً بالحيوية!
const MOCK_ONLINE_USERS = [
  { id: "u1", name: "Rabah", avatarColor: "#1877F2" },
  { id: "u2", name: "Ahmed", avatarColor: "#42B72A" },
  { id: "u3", name: "Sarah", avatarColor: "#E41E3F" },
  { id: "u4", name: "Yacine", avatarColor: "#0D5CD6" },
];

export default function FeedScreen() {
  const { posts, onlineUsers, connected } = useRabahSocket();

  // إذا كان السيرفر متصلاً نستخدم البيانات الحقيقية، وإلا نستخدم البيانات التجريبية لكي لا يظل التطبيق فارغاً!
  const displayPosts = posts && posts.length > 0 ? posts : MOCK_POSTS;
  const displayOnlineUsers = onlineUsers && onlineUsers.length > 0 ? onlineUsers : MOCK_ONLINE_USERS;
  const isConnected = connected || false;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>RabahDj</Text>
        <View style={styles.statusPill}>
          <View style={[styles.dot, { backgroundColor: isConnected ? colors.online : colors.danger }]} />
          <Text style={styles.statusText}>
            {isConnected ? `${displayOnlineUsers.length} متصل الآن` : "معاينة (بدون اتصال)"}
          </Text>
        </View>
      </View>

      <FlatList
        data={displayPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={
          <>
            <OnlineUsersBar users={displayOnlineUsers} />
            <PostComposer />
          </>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>لا توجد منشورات بعد، كن أول من ينشر شيئاً!</Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <WalkieTalkieButton />
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
      {users.map((u) => {
        const avatarBg = u.avatarColor || colors.primary;
        return (
          <View key={u.id} style={styles.onlineUser}>
            <View style={[styles.onlineAvatar, { backgroundColor: avatarBg }]}>
              <Text style={styles.onlineAvatarText}>{u.name?.[0]?.toUpperCase()}</Text>
              <View style={styles.onlineIndicator} />
            </View>
            <Text style={styles.onlineName} numberOfLines={1}>
              {u.name}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: colors.background,
    // يحل مشكلة تداخل شريط الساعة والبطارية بالأعلى
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 
  },
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
