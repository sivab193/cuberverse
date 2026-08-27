import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { CheckCircle, Copy, Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { algorithms, CUBE_TYPE_TO_PUZZLE } from '@shared/algorithms';
import { invertMoves, parseSequence } from '@shared/puzzle';

import { AppButton, Card, EmptyState, MonoText, Screen, useAppTheme } from '@/components/ui';
import { PuzzleCanvas } from '@/components/puzzle-viewer/canvas';
import { PuzzleControls } from '@/components/puzzle-viewer/controls';
import { usePuzzleController } from '@/core/puzzle-controller';
import { useAlgorithmProgress } from '@/hooks/use-algorithm-progress';

export function generateStaticParams() {
  return algorithms.map(({ id }) => ({ id }));
}

export default function AlgorithmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const algorithm = algorithms.find((item) => item.id === id);
  if (!algorithm) return <Screen><EmptyState title="Algorithm not found" body="This case may have moved in a newer library version." /></Screen>;
  return <AlgorithmDetail algorithm={algorithm} />;
}

function AlgorithmDetail({ algorithm }: { algorithm: (typeof algorithms)[number] }) {
  const colors = useAppTheme(); const puzzle = CUBE_TYPE_TO_PUZZLE[algorithm.cubeType]; const controller = usePuzzleController(puzzle); const { favorites, progress, toggleFavorite, cycleProgress } = useAlgorithmProgress();
  useEffect(() => { controller.setBase(invertMoves(parseSequence(algorithm.algorithm, puzzle))); controller.setTimeline(algorithm.algorithm); }, [algorithm, controller, puzzle]);
  const copy = async () => { await Clipboard.setStringAsync(algorithm.algorithm); void Haptics.selectionAsync(); };
  return <Screen><View style={styles.header}><Text style={[styles.category, { color: colors.primary }]}>{algorithm.cubeType.toUpperCase()} · {algorithm.method} · {algorithm.category}</Text><Text style={[styles.title, { color: colors.text }]}>{algorithm.name}</Text><Text style={[styles.description, { color: colors.textSecondary }]}>{algorithm.description}</Text></View><PuzzleCanvas controller={controller} /><PuzzleControls controller={controller} /><Card style={styles.algorithm}><MonoText style={styles.moves}>{algorithm.algorithm}</MonoText><AppButton variant="secondary" onPress={copy}><View style={styles.buttonContent}><Copy color={colors.text} size={17} /><Text style={{ color: colors.text, fontWeight: '800' }}>Copy moves</Text></View></AppButton></Card>{algorithm.recognition ? <Card><Text style={[styles.label, { color: colors.text }]}>Recognition</Text><Text style={[styles.description, { color: colors.textSecondary }]}>{algorithm.recognition}</Text></Card> : null}<View style={styles.actions}><AppButton style={styles.flex} variant="secondary" onPress={() => toggleFavorite(algorithm.id)}><View style={styles.buttonContent}><Star color={colors.warning} fill={favorites.has(algorithm.id) ? colors.warning : 'transparent'} size={18} /><Text style={{ color: colors.text, fontWeight: '800' }}>{favorites.has(algorithm.id) ? 'Favorited' : 'Favorite'}</Text></View></AppButton><AppButton style={styles.flex} variant="secondary" onPress={() => cycleProgress(algorithm.id)}><View style={styles.buttonContent}><CheckCircle color={colors.success} size={18} /><Text style={{ color: colors.text, fontWeight: '800' }}>{progress[algorithm.id] ?? 'Not started'}</Text></View></AppButton></View></Screen>;
}
const styles = StyleSheet.create({ header: { gap: 7, marginBottom: 18 }, category: { fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }, title: { fontSize: 30, lineHeight: 36, fontWeight: '900' }, description: { fontSize: 15, lineHeight: 23 }, algorithm: { marginTop: 18, gap: 14, alignItems: 'stretch' }, moves: { textAlign: 'center', fontSize: 18, lineHeight: 28 }, buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 }, label: { fontSize: 17, fontWeight: '900', marginBottom: 6 }, actions: { flexDirection: 'row', gap: 10, marginTop: 12 }, flex: { flex: 1 } });
