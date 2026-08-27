import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { invertMoves, parseSequence } from '@shared/puzzle';
import type { MappingError, SolvablePuzzleId } from '@shared/solver/state-mapping';
import { validateFacelets } from '@shared/solver/validate';

import { ColorReview, solvedFacelets } from '@/components/color-review';
import { AppButton, Card, Chip, MonoText, PageHeader, Screen, useAppTheme } from '@/components/ui';
import { PuzzleCanvas } from '@/components/puzzle-viewer/canvas';
import { PuzzleControls } from '@/components/puzzle-viewer/controls';
import { usePuzzleController } from '@/core/puzzle-controller';
import { solveFaceletsNative } from '@/core/solver';

const PUZZLES: { id: SolvablePuzzleId; label: string }[] = [{ id: '333', label: '3x3' }, { id: '222', label: '2x2' }, { id: 'pyraminx', label: 'Pyraminx' }];
export default function SolveScreen() {
  const params = useLocalSearchParams<{ puzzle?: SolvablePuzzleId; facelets?: string }>();
  const colors = useAppTheme(); const [puzzle, setPuzzle] = useState<SolvablePuzzleId>(params.puzzle ?? '333'); const [facelets, setFacelets] = useState(() => params.facelets ?? solvedFacelets(params.puzzle ?? '333')); const [solution, setSolution] = useState(''); const [message, setMessage] = useState(''); const [solving, setSolving] = useState(false);
  useEffect(() => { if (!params.puzzle) return; setPuzzle(params.puzzle); setFacelets(params.facelets ?? solvedFacelets(params.puzzle)); setSolution(''); }, [params.puzzle, params.facelets]);
  const validation = useMemo(() => validateFacelets(puzzle, facelets), [puzzle, facelets]); const errors: MappingError[] = validation.ok ? [] : validation.errors;
  const controller = usePuzzleController(puzzle);
  const changePuzzle = (next: SolvablePuzzleId) => { setPuzzle(next); setFacelets(solvedFacelets(next)); setSolution(''); setMessage(''); };
  const solve = async () => { setSolving(true); setMessage(''); setSolution(''); try { const result = await solveFaceletsNative(puzzle, facelets); if (!result.ok) { setMessage(result.message); return; } if (!result.moveCount) { setMessage('This puzzle is already solved.'); return; } setSolution(result.solution); controller.setBase(invertMoves(parseSequence(result.solution, puzzle))); controller.setTimeline(result.solution); } catch (error) { setMessage(error instanceof Error ? error.message : 'Solver failed unexpectedly.'); } finally { setSolving(false); } };
  return <Screen><PageHeader eyebrow="On-device search" title="Manual solver" description="Tap stickers to cycle their colors. Validation and solving happen entirely on this device." /><View style={styles.chips}>{PUZZLES.map((item) => <Chip key={item.id} label={item.label} selected={puzzle === item.id} onPress={() => changePuzzle(item.id)} />)}</View><Card><ColorReview puzzle={puzzle} facelets={facelets} onChange={(value) => { setFacelets(value); setSolution(''); }} errors={errors} /></Card>{errors.length ? <Card style={[styles.notice, { borderColor: colors.danger }]}>{errors.slice(0, 3).map((error, index) => <Text key={index} style={[styles.error, { color: colors.danger }]}>{error.message}</Text>)}</Card> : null}{message ? <Text style={[styles.message, { color: colors.warning }]}>{message}</Text> : null}<View style={styles.actions}><AppButton variant="secondary" onPress={() => changePuzzle(puzzle)}>Reset colors</AppButton><AppButton disabled={!validation.ok || solving} onPress={() => void solve()}><View style={styles.inline}><Sparkles color="#fff" size={17} /><Text style={styles.solveText}>{solving ? 'Preparing solver…' : 'Solve it'}</Text></View></AppButton></View>{solution ? <View style={styles.solution}><Card style={styles.solutionCard}><Text style={[styles.solutionLabel, { color: colors.textSecondary }]}>SOLUTION · {solution.split(/\s+/).length} MOVES</Text><MonoText style={styles.solutionMoves}>{solution}</MonoText></Card><PuzzleCanvas controller={controller} /><PuzzleControls controller={controller} /></View> : null}</Screen>;
}
const styles = StyleSheet.create({ chips: { flexDirection: 'row', gap: 8, marginBottom: 14 }, notice: { marginTop: 12, gap: 5 }, error: { fontSize: 13, lineHeight: 19 }, message: { marginTop: 12, textAlign: 'center', fontWeight: '700' }, actions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 14 }, inline: { flexDirection: 'row', gap: 8, alignItems: 'center' }, solveText: { color: '#fff', fontWeight: '900' }, solution: { marginTop: 20, gap: 12 }, solutionCard: { alignItems: 'center', gap: 8 }, solutionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1 }, solutionMoves: { textAlign: 'center', fontSize: 17 } });
