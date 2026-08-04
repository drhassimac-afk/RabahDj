import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8' };

const SAMPLE_A = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_B = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

const ITEMS = [
  { id:'1', title:'فيلم الخيال', genre:'خيال علمي', dur:'2h 10m', emoji:'🚀', color:'#2E3A6B', cat:'أفلام', video:SAMPLE_A },
  { id:'2', title:'الأبطال',     genre:'أكشن',       dur:'2h 5m',  emoji:'⚡', color:'#6B5B1E', cat:'أفلام', video:SAMPLE_B },
  { id:'3', title:'كوميديا',     genre:'كوميدي',      dur:'1h 20m', emoji:'😂', color:'#5B2E6B', cat:'أفلام', video:SAMPLE_A },
  { id:'4', title:'مسلسل العائلة', genre:'دراما',     dur:'45 دقيقة', emoji:'🎭', color:'#6B2E2E', cat:'مسلسلات', video:SAMPLE_B },
  { id:'5', title:'ليالي الحي', genre:'دراما',        dur:'50 دقيقة', emoji:'🌙', color:'#2E4A6B', cat:'مسلسلات', video:SAMPLE_A },
  { id:'6', title:'الطبيعة',    genre:'وثائقي',       dur:'1h 30m', emoji:'🦁', color:'#1E6B3A', cat:'وثائقي', video:SAMPLE_B },
  { id:'7', title:'الفضاء',     genre:'مغامرة',       dur:'1h 50m', emoji:'🛰️', color:'#1E4A6B', cat:'وثائقي', video:SAMPLE_A },
];

const CATS = ['الكل', 'أفلام', 'مسلسلات', 'وثائقي'];

function PlayerModal({ item, onClose }) {
  const player = useVideoPlayer(item.video, (p) => { p.play(); });
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={p.container}>
        <TouchableOpacity style={p.closeBtn} onPress={onClose}>
          <Ionicons name="close-circle" size={36} color="#fff" />
        </TouchableOpacity>
        <VideoView style={p.video} player={player} allowsFullscreen allowsPictureInPicture />
        <Text style={p.title}>{item.title}</Text>
      </SafeAreaView>
    </Modal>
  );
}

export default function V2CinemaScreen({ navigation }) {
  const [cat, setCat] = useState('الكل');
  const [playing, setPlaying] = useState(null);

  const list = cat === 'الكل' ? ITEMS : ITEMS.filter((i) => i.cat === cat);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-forward" size={26} color="#fff" /></TouchableOpacity>
        <Text style={s.headerTitle}>سينما وتلفاز</Text>
      </View>

      <View style={s.tabsRow}>
        {CATS.map((c) => (
          <TouchableOpacity key={c} onPress={() => setCat(c)} style={[s.tab, cat === c && s.tabActive]}>
            <Text style={[s.tabTxt, cat === c && s.tabTxtActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.countTxt}>المتاح على شبكتك ({list.length})</Text>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={s.grid}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.card, { backgroundColor: item.color }]} onPress={() => setPlaying(item)}>
            <Text style={s.emoji}>{item.emoji}</Text>
            <View style={s.cardFooter}>
              <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={s.cardSub}>{item.dur} · {item.genre}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {playing && <PlayerModal item={playing} onClose={() => setPlaying(null)} />}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 44, marginBottom: 14, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginRight: 14 },
  tabsRow: { flexDirection: 'row-reverse', paddingHorizontal: 16, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: C.surface, marginLeft: 8 },
  tabActive: { backgroundColor: C.primary },
  tabTxt: { color: C.sub, fontSize: 13, fontWeight: '600' },
  tabTxtActive: { color: '#fff' },
  countTxt: { color: C.sub, fontSize: 12, textAlign: 'right', paddingHorizontal: 20, marginBottom: 10 },
  grid: { paddingHorizontal: 16, paddingBottom: 30 },
  card: { width: '48%', height: 170, borderRadius: 16, marginBottom: 14, overflow: 'hidden', justifyContent: 'space-between' },
  emoji: { fontSize: 48, textAlign: 'center', marginTop: 24 },
  cardFooter: { backgroundColor: 'rgba(11,17,32,0.55)', padding: 10 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  cardSub: { color: '#CBD5E1', fontSize: 11, textAlign: 'right', marginTop: 2 },
});
const p = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  closeBtn: { position: 'absolute', top: 40, left: 16, zIndex: 10 },
  video: { width: '100%', height: 300, marginTop: 80 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 16 },
});
