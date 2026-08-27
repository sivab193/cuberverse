import { Pressable, StyleSheet, Text, View } from 'react-native';
import { faceLetters, faceletCount, type MappingError, type SolvablePuzzleId } from '@shared/solver/state-mapping';
import { useAppTheme } from '@/components/ui';

const COLORS: Record<string, string> = { U: '#f1f5f9', D: '#fde047', F: '#4ade80', B: '#3b82f6', R: '#ef4444', L: '#fb923c' };
const FACE_NAMES: Record<string, string> = { U: 'Up', R: 'Right', F: 'Front', D: 'Down', L: 'Left', B: 'Back' };

export function solvedFacelets(puzzle: SolvablePuzzleId) {
  const letters = faceLetters(puzzle); const perFace = faceletCount(puzzle) / letters.length;
  return letters.map((letter) => letter.repeat(perFace)).join('');
}

export function ColorReview({ puzzle, facelets, onChange, errors = [] }: { puzzle: SolvablePuzzleId; facelets: string; onChange: (value: string) => void; errors?: MappingError[] }) {
  const colors = useAppTheme(); const letters = faceLetters(puzzle); const perFace = faceletCount(puzzle) / letters.length; const n = puzzle === '222' ? 2 : 3; const highlighted = new Set(errors.flatMap((error) => error.facelets));
  const cycle = (index: number) => { const current = facelets[index]; const next = letters[(letters.indexOf(current) + 1) % letters.length]; onChange(`${facelets.slice(0, index)}${next}${facelets.slice(index + 1)}`); };
  return <View style={styles.faces}>{letters.map((face, faceIndex) => <View key={face} style={styles.face}><Text style={[styles.faceLabel, { color: colors.textSecondary }]}>{FACE_NAMES[face] ?? face}</Text><View style={[styles.grid, { width: n * 42 + (n - 1) * 3 }]}>{Array.from({ length: perFace }, (_, localIndex) => { const index = faceIndex * perFace + localIndex; const value = facelets[index]; return <Pressable key={index} accessibilityLabel={`${FACE_NAMES[face] ?? face} sticker ${localIndex + 1}, ${value}`} onPress={() => cycle(index)} style={[styles.sticker, { backgroundColor: COLORS[value] ?? '#777', borderColor: highlighted.has(index) ? colors.danger : '#11131b' }]} />; })}</View></View>)}</View>;
}
const styles = StyleSheet.create({ faces: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }, face: { alignItems: 'center', gap: 6 }, faceLabel: { fontSize: 11, fontWeight: '800' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 }, sticker: { width: 42, height: 42, borderRadius: 7, borderWidth: 2 } });
