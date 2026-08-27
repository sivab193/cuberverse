import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/components/ui';
import type { PuzzleController } from '@/core/puzzle-controller';
import { usePuzzleControllerState } from '@/core/puzzle-controller';

export function PuzzleControls({ controller }: { controller: PuzzleController }) {
  const colors = useAppTheme(); const state = usePuzzleControllerState(controller);
  const button = (label: string, action: () => void, icon: React.ReactNode) => <Pressable accessibilityLabel={label} onPress={action} style={[styles.button, { borderColor: colors.border, backgroundColor: colors.backgroundSelected }]}>{icon}</Pressable>;
  return <View style={styles.wrapper}><Text style={[styles.position, { color: colors.textSecondary }]}>{state.position} / {state.total}</Text><View style={styles.row}>{button('Restart', () => controller.seekTo(0), <RotateCcw color={colors.text} size={20} />)}{button('Previous move', () => controller.stepBack(), <SkipBack color={colors.text} size={20} />)}{button(state.playing ? 'Pause' : 'Play', () => state.playing ? controller.pause() : controller.play(), state.playing ? <Pause color={colors.text} size={22} /> : <Play color={colors.text} size={22} />)}{button('Next move', () => controller.stepForward(), <SkipForward color={colors.text} size={20} />)}</View></View>;
}
const styles = StyleSheet.create({ wrapper: { gap: 10, alignItems: 'center', paddingTop: 12 }, position: { fontSize: 13, fontWeight: '700' }, row: { flexDirection: 'row', gap: 10 }, button: { width: 46, height: 42, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, alignItems: 'center', justifyContent: 'center' } });
