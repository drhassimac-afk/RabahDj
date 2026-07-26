import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MOVIES = [
  { id: '1', title: 'فيلم ترفيهي 1', duration: '2h 15m', image: 'https://via.placeholder.com/150/000000/FFFFFF?text=Movie+1' },
  { id: '2', title: 'مسلسل محلي', duration: 'Season 1', image: 'https://via.placeholder.com/150/000000/FFFFFF?text=Series+1' },
];

export default function V2CinemaScreen({ navigation }) {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-forward" size={28} color="#fff" /></TouchableOpacity>
        <Text style={s.headerTitle}>السينما المحلية</Text>
      </View>
      <FlatList
        data={MOVIES}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card}>
            <Image source={{ uri: item.image }} style={s.img} />
            <View style={s.info}>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.sub}>{item.duration}</Text>
            </View>
            <Ionicons name="play-circle" size={40} color="#3B82F6" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120', padding: 20 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginRight: 15 },
  card: { flexDirection: 'row-reverse', backgroundColor: '#161F2E', borderRadius: 15, padding: 12, marginBottom: 15, alignItems: 'center' },
  img: { width: 80, height: 80, borderRadius: 10 },
  info: { flex: 1, marginRight: 15 },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sub: { color: '#94A3B8', fontSize: 13, marginTop: 4 }
});
