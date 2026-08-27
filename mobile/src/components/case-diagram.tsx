import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { NxnCube, PUZZLES, PyraminxPuzzle, invertMoves, parseSequence, type Face, type PuzzleId, type PyraminxFace } from '@shared/puzzle';

const STICKER_COLORS: Record<string, string> = { U: '#f2f2f0', R: '#d83b43', F: '#32a85b', D: '#f1d331', L: '#ee8b2a', B: '#3264d9' };

function getStickers(puzzle: PuzzleId, algorithm: string): { n: number; values: string[] } | null {
  try {
    const moves = invertMoves(parseSequence(algorithm, puzzle));
    if (puzzle === 'pyraminx') {
      const model = PyraminxPuzzle.solved(); model.applyMoves(moves);
      return { n: 3, values: Array.from({ length: 9 }, (_, i) => model.getSticker('F' as PyraminxFace, i)) };
    }
    const n = PUZZLES[puzzle].n; const cube = NxnCube.solved(n); cube.applyMoves(moves);
    return { n, values: Array.from({ length: n * n }, (_, i) => cube.getSticker('U' as Face, Math.floor(i / n), i % n)) };
  } catch { return null; }
}

export const CaseDiagram = memo(function CaseDiagram({ puzzle, algorithm, size = 88 }: { puzzle: PuzzleId; algorithm: string; size?: number }) {
  const state = useMemo(() => getStickers(puzzle, algorithm), [puzzle, algorithm]);
  if (!state) return <View style={[styles.fallback, { width: size, height: size }]} />;
  const gap = 2; const cell = (size - gap * (state.n - 1)) / state.n;
  return <View accessibilityLabel="Algorithm case diagram" style={[styles.grid, { width: size, height: size, gap }]}>{state.values.map((value, index) => <View key={index} style={{ width: cell, height: cell, borderRadius: Math.max(1, cell * 0.12), backgroundColor: STICKER_COLORS[value] ?? '#777' }} />)}</View>;
});

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 2, borderRadius: 10, backgroundColor: '#101016' }, fallback: { borderRadius: 10, backgroundColor: '#2d2937' } });
