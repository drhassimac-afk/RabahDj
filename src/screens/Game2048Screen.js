import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const BOARD_SIZE = width - 40;
const CELL_MARGIN = 6;
const CELL_SIZE = (BOARD_SIZE - CELL_MARGIN * 10) / 4;

const TILE_COLORS = {
  0: '#1e293b',
  2: '#334155',
  4: '#475569',
  8: '#f59e0b',
  16: '#f97316',
  32: '#ef4444',
  64: '#dc2626',
  128: '#8b5cf6',
  256: '#7c3aed',
  512: '#6d28d9',
  1024: '#3b82f6',
  2048: '#10b981',
};

function emptyGrid() {
  return Array(4).fill(null).map(() => Array(4).fill(0));
}

function addRandomTile(grid) {
  const empties = [];
  grid.forEach((row, r) => row.forEach((v, c) => { if (v === 0) empties.push([r, c]); }));
  if (empties.length === 0) return grid;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const newGrid = grid.map((row) => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

function slideRowLeft(row) {
  let arr = row.filter((v) => v !== 0);
  let scoreGained = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      scoreGained += arr[i];
      arr[i + 1] = 0;
    }
  }
  arr = arr.filter((v) => v !== 0);
  while (arr.length < 4) arr.push(0);
  return { row: arr, scoreGained };
}

function moveLeft(grid) {
  let moved = false;
  let scoreGained = 0;
  const newGrid = grid.map((row) => {
    const { row: newRow, scoreGained: gained } = slideRowLeft(row);
    if (JSON.stringify(newRow) !== JSON.stringify(row)) moved = true;
    scoreGained += gained;
    return newRow;
  });
  return { grid: newGrid, moved, scoreGained };
}

function reverseGrid(grid) {
  return grid.map((row) => [...row].reverse());
}

function transposeGrid(grid) {
  return grid[0].map((_, c) => grid.map((row) => row[c]));
}

function moveRight(grid) {
  const reversed = reverseGrid(grid);
  const result = moveLeft(reversed);
  return { grid: reverseGrid(result.grid), moved: result.moved, scoreGained: result.scoreGained };
}

function moveUp(grid) {
  const transposed = transposeGrid(grid);
  const result = moveLeft(transposed);
  return { grid: transposeGrid(result.grid), moved: result.moved, scoreGained: result.scoreGained };
}

function moveDown(grid) {
  const transposed = transposeGrid(grid);
  const result = moveRight(transposed);
  return { grid: transposeGrid(result.grid), moved: result.moved, scoreGained: result.scoreGained };
}

function canMove(grid) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return true;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

function initGrid() {
  let grid = emptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
}

export default function Game2048Screen({ navigation }) {
  const [grid, setGrid] = useState(initGrid);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const handleMove = useCallback((moveFn) => {
    if (gameOver) return;

    setGrid((prevGrid) => {
      const result = moveFn(prevGrid);
      if (!result.moved) return prevGrid;

      setScore((s) => s + result.scoreGained);

      const hasWon = result.grid.some((row) => row.some((v) => v === 2048));
      if (hasWon && !won) {
        setWon(true);
        setTimeout(() => Alert.alert('🎉 فزت!', 'وصلت لـ 2048! تقدر تكمل اللعب.'), 100);
      }

      const newGrid = addRandomTile(result.grid);

      if (!canMove(newGrid)) {
        setGameOver(true);
        setTimeout(() => Alert.alert('😔 انتهت اللعبة', `نتيجتك النهائية: ${score + result.scoreGained}`), 100);
      }

      return newGrid;
    });
  }, [gameOver, won, score]);

  const startNewGame = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تحدي 2048</Text>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>النقاط</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>

      <View style={styles.board}>
        {grid.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((value, c) => (
              <View
                key={c}
                style={[
                  styles.cell,
                  { backgroundColor: TILE_COLORS[value] || '#10b981' },
                ]}
              >
                {value !== 0 && (
                  <Text style={[styles.cellText, value > 4 && styles.cellTextLight]}>
                    {value}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => handleMove(moveUp)}>
          <Ionicons name="chevron-up" size={30} color="#fff" />
        </TouchableOpacity>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => handleMove(moveRight)}>
            <Ionicons name="chevron-back" size={30} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => handleMove(moveLeft)}>
            <Ionicons name="chevron-forward" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.controlBtn} onPress={() => handleMove(moveDown)}>
          <Ionicons name="chevron-down" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.newGameBtn} onPress={startNewGame}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.newGameText}>لعبة جديدة</Text>
      </TouchableOpacity>
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
  scoreBox: { backgroundColor: '#141b2d', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center' },
  scoreLabel: { color: '#64748b', fontSize: 11 },
  scoreValue: { color: '#f59e0b', fontSize: 18, fontWeight: 'bold' },
  board: {
    backgroundColor: '#141b2d',
    borderRadius: 12,
    padding: CELL_MARGIN,
    marginTop: 10,
  },
  row: { flexDirection: 'row' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: CELL_MARGIN / 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { color: '#e2e8f0', fontSize: 24, fontWeight: 'bold' },
  cellTextLight: { color: '#fff' },
  controls: { marginTop: 30, alignItems: 'center' },
  controlsRow: { flexDirection: 'row', gap: 60, marginVertical: 8 },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newGameBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 30,
  },
  newGameText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
