import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket } from '../../api/socket';

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', gold:'#FACC15', danger:'#EF4444', success:'#22C55E' };

function PressableScale({ style, onPress, disabled, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => !disabled && Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 60 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={style} onPress={onPress} disabled={disabled} activeOpacity={0.75} onPressIn={onIn} onPressOut={onOut}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function Cell({ value, onPress, disabled }) {
  const scale = useRef(new Animated.Value(value ? 1 : 0)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (value && !prevValue.current) {
      scale.setValue(0);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }).start();
    }
    if (!value) scale.setValue(0);
    prevValue.current = value;
  }, [value]);

  return (
    <TouchableOpacity style={s.cell} onPress={onPress} activeOpacity={0.7} disabled={disabled || !!value}>
      <Animated.Text style={[
        s.cellTxt,
        { transform: [{ scale }] },
        value === 'X' && { color: C.primary },
        value === 'O' && { color: C.danger },
      ]}>
        {value || ''}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export default function V2XOGameScreen({ navigation }) {
  const sock = useRef(getSocket());
  const [state, setState] = useState({ board: Array(9).fill(null), turn: 'X', winner: null, players: {} });
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const s = sock.current;
    const onState = (st) => setState(st);
    s.on('xo_state', onState);
    s.emit('xo_join');
    return () => s.off('xo_state', onState);
  }, []);

  const mySymbol = state.players.X === sock.current.id ? 'X' : state.players.O === sock.current.id ? 'O' : null;
  const myTurn = mySymbol && mySymbol === state.turn && !state.winner;

  const press = (i) => {
    if (state.board[i] || state.winner) return;
    if (mySymbol !== state.turn) return;
    sock.current.emit('xo_move', { index: i });
  };

  const reset = () => sock.current.emit('xo_reset');

  let statusText = '';
  let statusColor = C.text;
  if (state.winner === 'draw') { statusText = 'تعادل! 🤝'; statusColor = C.gold; }
  else if (state.winner) {
    const iWon = state.winner === mySymbol;
    statusText = iWon ? 'فزت! 🎉' : `فاز ${state.winner} 🎉`;
    statusColor = iWon ? C.success : C.danger;
  }
  else if (!mySymbol) statusText = 'الغرفة ممتلئة — شاهد فقط';
  else statusText = myTurn ? 'دورك أنت' : 'دور الطرف الآخر';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-forward" size={24} color={C.sub} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>إكس أو</Text>
        <TouchableOpacity onPress={reset} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="refresh" size={22} color={C.gold} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[s.body, { opacity: fade }]}>
        {mySymbol && (
          <View style={[s.symbolChip, { borderColor: mySymbol === 'X' ? C.primary : C.danger }]}>
            <Text style={[s.symbolChipTxt, { color: mySymbol === 'X' ? C.primary : C.danger }]}>أنت: {mySymbol}</Text>
          </View>
        )}
        <Text style={[s.status, { color: statusColor }]}>{statusText}</Text>

        <View style={[s.board, myTurn && s.boardActive]}>
          {state.board.map((cell, i) => (
            <Cell key={i} value={cell} onPress={() => press(i)} disabled={!myTurn} />
          ))}
        </View>

        <PressableScale style={s.resetBtn} onPress={reset}>
          <Text style={s.resetTxt}>لعبة جديدة</Text>
        </PressableScale>
      </Animated.View>
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
  symbolChip: {
    borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 10,
  },
  symbolChipTxt: { fontSize: 13, fontWeight: '800' },
  status: { fontSize: 18, fontWeight: '700', marginBottom: 24 },
  board: {
    width: 270, height: 270, flexDirection: 'row', flexWrap: 'wrap',
    borderRadius: 12, overflow: 'hidden', opacity: 0.85,
  },
  boardActive: { opacity: 1 },
  cell: {
    width: 90, height: 90, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  cellTxt: { fontSize: 42, fontWeight: '900', color: C.text },
  resetBtn: { marginTop: 28, backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  resetTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
