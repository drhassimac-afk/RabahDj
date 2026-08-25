import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  surface: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  primaryText: '#FFFFFF',
  subText: '#94A3B8',
  muted: '#64748B',
  danger: '#F43F5E',
  heart: '#F43F5E',
};

const AVATAR_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#22C55E',
  '#06B6D4',
];

function avatarColor(name = '?') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(ts) {
  if (!ts) return '';

  const diff = Math.floor(
    (Date.now() - new Date(ts).getTime()) / 1000
  );

  if (diff < 10) return 'الآن';
  if (diff < 60) return `منذ ${diff} ث`;

  const m = Math.floor(diff / 60);
  if (m < 60) return `منذ ${m} د`;

  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;

  return 'قبل أيام';
}

export const PostCard = React.memo(
  ({ item, myName, onLike, onDelete, onComments }) => {
    const cleanMyName = (myName || '').trim().toLowerCase();

    const isMine =
      (item.authorName || '').trim().toLowerCase() === cleanMyName;

    const likes = Array.isArray(item.likes) ? item.likes : [];

    const iLiked = likes.some(
      (l) =>
        typeof l === 'string' &&
        l.trim().toLowerCase() === cleanMyName
    );

    const commentCount = (item.comments || []).length;

    const scale = useRef(new Animated.Value(1)).current;

    const handleLike = () => {
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 40,
          friction: 3,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 40,
          friction: 3,
        }),
      ]).start();

      onLike(item.id);
    };

    return (
      <View style={cardStyles.card}>
        <View style={cardStyles.cardHeader}>
          <View
            style={[
              cardStyles.avatar,
              {
                backgroundColor:
                  item.avatarColor ||
                  avatarColor(item.authorName),
              },
            ]}
          >
            <Text style={cardStyles.avatarTxt}>
              {(item.authorName || '?')
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View style={cardStyles.authorBox}>
            <View style={cardStyles.authorRow}>
              <Text style={cardStyles.author}>
                {item.authorName}
              </Text>

              {isMine && (
                <View style={cardStyles.youBadge}>
                  <Text style={cardStyles.youBadgeTxt}>
                    أنت
                  </Text>
                </View>
              )}
            </View>

            {!!(item.createdAt || item.timestamp) && (
              <Text style={cardStyles.time}>
                {timeAgo(item.createdAt || item.timestamp)}
              </Text>
            )}
          </View>

          {isMine && (
            <TouchableOpacity
              style={cardStyles.deleteBtn}
              onPress={() => onDelete(item.id)}
              hitSlop={8}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={C.danger}
              />
            </TouchableOpacity>
          )}
        </View>

        {!!item.text && (
          <Text style={cardStyles.postText}>
            {item.text}
          </Text>
        )}

        <View style={cardStyles.cardFooter}>
          <TouchableOpacity
            style={cardStyles.actionBtn}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Animated.View
              style={{ transform: [{ scale }] }}
            >
              <Ionicons
                name={
                  iLiked ? 'heart' : 'heart-outline'
                }
                size={22}
                color={
                  iLiked ? C.heart : C.subText
                }
              />
            </Animated.View>

            <Text
              style={[
                cardStyles.actionTxt,
                iLiked &&
                  cardStyles.actionTxtLiked,
              ]}
            >
              {likes.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={cardStyles.actionBtn}
            onPress={() => onComments(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={C.subText}
            />

            <Text style={cardStyles.actionTxt}>
              {commentCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  avatarTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  authorBox: {
    flex: 1,
  },

  authorRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  author: {
    color: C.primaryText,
    fontWeight: '700',
    fontSize: 15,
  },

  youBadge: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },

  youBadgeTxt: {
    color: C.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },

  time: {
    color: C.muted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 3,
  },

  deleteBtn: {
    padding: 6,
    borderRadius: 8,
  },

  postText: {
    color: C.primaryText,
    marginTop: 12,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
  },

  cardFooter: {
    flexDirection: 'row-reverse',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
  },

  actionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginLeft: 28,
    paddingVertical: 4,
  },

  actionTxt: {
    color: C.subText,
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500',
  },

  actionTxtLiked: {
    color: C.heart,
    fontWeight: '700',
  },
});
