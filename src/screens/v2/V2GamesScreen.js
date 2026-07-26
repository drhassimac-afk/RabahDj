import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function V2GamesScreen({ navigation }) {
  return (
    <View style={s.container}>
      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}><Ionicons name="arrow-forward" size={28} color="#fff" /></TouchableOpacity>
      <Ionicons name="game-controller" size={100} color="#F59E0B" />
      <Text style={s.title}>الألعاب المحلية</Text>
      <Text style={s.desc}>قريباً: العب مع أصدقائك على الشبكة المحلية بدون إنترنت</Text>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120', alignItems: 'center', justifyContent: 'center', padding: 20 },
  back: { position: 'absolute', top: 50, right: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  desc: { color: '#94A3B8', textAlign: 'center', marginTop: 10, fontSize: 16 }
});
