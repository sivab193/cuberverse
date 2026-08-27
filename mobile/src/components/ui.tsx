import type { ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, type TextStyle, useColorScheme, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth } from '@/constants/theme';

export function useAppTheme() {
  return Colors[useColorScheme() === 'light' ? 'light' : 'dark'];
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const colors = useAppTheme();
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      {scroll ? <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  const colors = useAppTheme();
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}
      <Text style={[styles.pageTitle, { color: colors.text }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const colors = useAppTheme();
  return <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }, style]}>{children}</View>;
}

export function AppButton({ children, onPress, variant = 'primary', disabled = false, style }: { children: ReactNode; onPress?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; disabled?: boolean; style?: ViewStyle }) {
  const colors = useAppTheme();
  const background = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.backgroundSelected : 'transparent';
  const foreground = variant === 'primary' || variant === 'danger' ? '#ffffff' : colors.text;
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: background, borderColor: variant === 'ghost' ? colors.border : background }, pressed && styles.pressed, disabled && styles.disabled, style]}>
      {typeof children === 'string' ? <Text style={[styles.buttonText, { color: foreground }]}>{children}</Text> : children}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const colors = useAppTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, { backgroundColor: selected ? colors.primaryMuted : colors.backgroundElement, borderColor: selected ? colors.primary : colors.border }, pressed && styles.pressed]}>
      <Text style={[styles.chipText, { color: selected ? colors.primary : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, count }: { children: string; count?: number }) {
  const colors = useAppTheme();
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{children}</Text>
      {count !== undefined ? <Text style={[styles.count, { color: colors.textSecondary }]}>{count}</Text> : null}
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  const colors = useAppTheme();
  return <Card style={styles.empty}><Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.emptyBody, { color: colors.textSecondary }]}>{body}</Text></Card>;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  const colors = useAppTheme();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.textSecondary }}>{label}</Text></View>;
}

export function MonoText({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const colors = useAppTheme();
  return <Text selectable style={[styles.mono, { color: colors.text }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, scrollContent: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: MaxContentWidth, padding: 18, paddingBottom: 36 },
  header: { gap: 8, marginBottom: 24 }, eyebrow: { fontSize: 12, lineHeight: 16, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase' },
  pageTitle: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.8 }, description: { fontSize: 16, lineHeight: 24, maxWidth: 700 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 16 },
  button: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '700' }, pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] }, disabled: { opacity: 0.45 },
  chip: { minHeight: 38, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }, chipText: { fontSize: 14, fontWeight: '700' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 12 }, sectionTitle: { fontSize: 21, lineHeight: 28, fontWeight: '800' }, count: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 }, emptyTitle: { fontSize: 18, fontWeight: '800' }, emptyBody: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  loading: { padding: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 15, lineHeight: 23 },
});
