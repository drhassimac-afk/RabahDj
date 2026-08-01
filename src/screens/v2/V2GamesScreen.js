import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket } from '../../api/socket';
import { getCurrentUser } from '../../api/currentUser';

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', gold:'#FACC15', danger:'#EF4444' };

export default function V2GamesScreen({ navigation }) {
  const sock = useRef(getSocket());
  const [state, setState] = useState({ board: Array(9).fill(null), turn: 'X', winner: null, players: {} });

  useEffect(() => {
    const s = sock.current;
    const onState = (st) => setState(st);
    s.on('xo_state', onState);
    s.emit('xo_join');
    return () => s.off('xo_state', onState);
  }, []);

  const mySymbol = state.players.X === sock.current.id ? 'X' : state.players.O === sock.current.id ? 'O' : null;

  const press = (i) => {
    if (state.board[i] || state.winner) return;
    if (mySymbol !== state.turn) return;
    sock.current.emit('xo_move', { index: i });
  };

  const reset = () => sock.current.emit('xo_reset');

  let statusText = '';
  if (state.winner === 'draw') statusText = 'تعادل! 🤝';
  else if (state.winner) statusText = `فاز ${state.winner === mySymbol ? 'أنت' : state.winner} 🎉`;
  else if (!mySymbol) statusText = 'الغرفة ممتلئة — شاهد فقط';
  else statusText = mySymbol === state.turn ? 'دورك أنت' : 'دور الطرف الآخر';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={24} color={C.sub} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>إكس أو</Text>
        <TouchableOpacity onPress={reset}>
          <Ionicons name="refresh" size={22} color={C.gold} />
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        <Text style={s.mySymbol}>{mySymbol ? `أنت: ${mySymbol}` : 'مشاهد'}</Text>
        <Text style={s.status}>{statusText}</Text>

        <View style={s.board}>
          {state.board.map((cell, i) => (
            <TouchableOpacity key={i} style={s.cell} onPress={() => press(i)} activeOpacity={0.7}>
              <Text style={[s.cellTxt, cell === 'X' && { color: C.primary }, cell === 'O' && { color: C.danger }]}>
                {cell || ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.resetBtn} onPress={reset}>
          <Text style={s.resetTxt}>لعبة جديدة</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  mySymbol: { color: C.sub, fontSize: 14, marginBottom: 8 },
  status: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 24 },
  board: { width: 270, height: 270, flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: 90, height: 90, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  cellTxt: { fontSize: 42, fontWeight: '900', color: C.text },
  resetBtn: { marginTop: 28, backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  resetTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
