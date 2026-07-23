import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const BOARD_SIZE = width - 40;
const CELL_SIZE = BOARD_SIZE / 9;

// ✅ ثلاث ألغاز جاهزة مع حلولها الكاملة (0 = خانة فارغة)
const PUZZLES = [
  {
    puzzle: [
      [5,3,0, 0,7,0, 0,0,0],
      [6,0,0, 1,9,5, 0,0,0],
      [0,9,8, 0,0,0, 0,6,0],
      [8,0,0, 0,6,0, 0,0,3],
      [4,0,0, 8,0,3, 0,0,1],
      [7,0,0, 0,2,0, 0,0,6],
      [0,6,0, 0,0,0, 2,8,0],
      [0,0,0, 4,1,9, 0,0,5],
      [0,0,0, 0,8,0, 0,7,9],
    ],
    solution: [
      [5,3,4, 6,7,8, 9,1,2],
      [6,7,2, 1,9,5, 3,4,8],
      [1,9,8, 3,4,2, 5,6,7],
      [8,5,9, 7,6,1, 4,2,3],
      [4,2,6, 8,5,3, 7,9,1],
      [7,1,3, 9,2,4, 8,5,6],
      [9,6,1, 5,3,7, 2,8,4],
      [2,8,7, 4,1,9, 6,3,5],
      [3,4,5, 2,8,6, 1,7,9],
    ],
  },
  {
    puzzle: [
      [0,0,0, 2,6,0, 7,0,1],
      [6,8,0, 0,7,0, 0,9,0],
      [1,9,0, 0,0,4, 5,0,0],
      [8,2,0, 1,0,0, 0,4,0],
      [0,0,4, 6,0,2, 9,0,0],
      [0,5,0, 0,0,3, 0,2,8],
      [0,0,9, 3,0,0, 0,7,4],
      [0,4,0, 0,5,0, 0,3,6],
      [7,0,3, 0,1,8, 0,0,0],
    ],
    solution: [
      [4,3,5, 2,6,9, 7,8,1],
      [6,8,2, 5,7,1, 4,9,3],
      [1,9,7, 8,3,4, 5,6,2],
      [8,2,6, 1,9,5, 3,4,7],
      [3,7,4, 6,8,2, 9,1,5],
      [9,5,1, 7,4,3, 6,2,8],
      [5,1,9, 3,2,6, 8,7,4],
      [2,4,8, 9,5,7, 1,3,6],
      [7,6,3, 4,1,8, 2,5,9],
    ],
  },
];

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export default function SudokuScreen({ navigation }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [board, setBoard] = useState(cloneBoard(PUZZLES[0].puzzle));
  const [selected, setSelected] = useState(null); // [row, col]
  const [wrongCells, setWrongCells] = useState({});

  const originalPuzzle = PUZZLES[puzzleIndex].puzzle;
  const solution = PUZZLES[puzzleIndex].solution;

  const isFixed = (r, c) => originalPuzzle[r][c] !== 0;

  const handleCellPress = (r, c) => {
    if (isFixed(r, c)) return;
    setSelected([r, c]);
  };

  const handleNumberPress = (num) => {
    if (!selected) return;
    const [r, c] = selected;

    const newBoard = cloneBoard(board);
    newBoard[r][c] = num;
    setBoard(newBoard);

    const key = `${r}-${c}`;
    const newWrong = { ...wrongCells };
    if (num !== 0 && num !== solution[r][c]) {
      newWrong[key] = true;
    } else {
      delete newWrong[key];
    }
    setWrongCells(newWrong);
  };

  const handleClear = () => handleNumberPress(0);

  const checkComplete = () => {
    const hasEmpty = board.some((row) => row.some((v) => v === 0));
    if (hasEmpty) {
      Alert.alert('غير مكتملة', 'لا زال فيه خانات فارغة.');
      return;
    }
    const isCorrect = board.every((row, r) => row.every((v, c) => v === solution[r][c]));
    if (isCorrect) {
      Alert.alert('🎉 ممتاز!', 'حللت اللغز بشكل صحيح!');
    } else {
      Alert.alert('❌ فيه أخطاء', 'راجع الخانات المحددة بالأحمر.');
    }
  };

  const startNewPuzzle = () => {
    const nextIndex = (puzzleIndex + 1) % PUZZLES.length;
    setPuzzleIndex(nextIndex);
    setBoard(cloneBoard(PUZZLES[nextIndex].puzzle));
    setSelected(null);
    setWrongCells({});
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سودوكو</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.board}>
        {board.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((value, c) => {
              const key = `${r}-${c}`;
              const selectedCell = selected && selected[0] === r && selected[1] === c;
              const fixed = isFixed(r, c);
              const wrong = wrongCells[key];

              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.cell,
                    (c + 1) % 3 === 0 && c !== 8 && styles.borderRight,
                    (r + 1) % 3 === 0 && r !== 8 && styles.borderBottom,
                    selectedCell && styles.cellSelected,
                    fixed && styles.cellFixed,
                  ]}
                  onPress={() => handleCellPress(r, c)}
                  activeOpacity={fixed ? 1 : 0.6}
                >
                  <Text
                    style={[
                      styles.cellText,
                      fixed && styles.cellTextFixed,
                      wrong && styles.cellTextWrong,
                    ]}
                  >
                    {value !== 0 ? value : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.numberPad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity key={num} style={styles.numberBtn} onPress={() => handleNumberPress(num)}>
            <Text style={styles.numberBtnText}>{num}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.numberBtn} onPress={handleClear}>
          <Ionicons name="backspace-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={checkComplete}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>تحقق</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.newPuzzleBtn]} onPress={startNewPuzzle}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>لغز جديد</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', alignItems: 'center' },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backBtn: { padding: 5 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: '#141b2d',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  row: { flexDirection: 'row' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderRight: { borderRightWidth: 2, borderRightColor: '#3b82f6' },
  borderBottom: { borderBottomWidth: 2, borderBottomColor: '#3b82f6' },
  cellSelected: { backgroundColor: '#1e3a8a' },
  cellFixed: { backgroundColor: '#1e293b' },
  cellText: { color: '#3b82f6', fontSize: 18, fontWeight: '600' },
  cellTextFixed: { color: '#f8fafc', fontWeight: 'bold' },
  cellTextWrong: { color: '#ef4444' },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: BOARD_SIZE,
    marginTop: 20,
    gap: 8,
  },
  numberBtn: {
    width: (BOARD_SIZE - 8 * 5) / 5,
    height: 46,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  actionsRow: { flexDirection: 'row', gap: 15, marginTop: 25 },
  actionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  newPuzzleBtn: { backgroundColor: '#3b82f6' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
