import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { ChevronDown, ChevronRight, Search, Star } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { algorithms, CUBE_TYPE_TO_PUZZLE, type Algorithm, type CubeType, type MethodType } from '@shared/algorithms';

import { CaseDiagram } from '@/components/case-diagram';
import { Card, Chip, EmptyState, PageHeader, Screen, useAppTheme } from '@/components/ui';
import { useAlgorithmProgress } from '@/hooks/use-algorithm-progress';

const CUBE_ORDER: CubeType[] = ['3x3', '2x2', '4x4', '5x5', '6x6', '7x7', 'pyraminx'];
const METHOD_ORDER: MethodType[] = ['Beginners', '2-Look', 'CFOP', 'OH', 'Ortega', 'CLL', 'EG-1', 'Reduction', 'L4E'];
const CATEGORY_ORDER = ['Cross', 'Layer 1', 'First Layer', 'F2L', 'Second Layer', 'Third Layer', '2-Look OLL', '2-Look PLL', 'Winter Variation', 'OLL', 'OH OLL', 'CLL', 'EG-1', 'COLL', 'PBL', 'PLL', 'OH PLL', 'Last Layer', 'OLL Parity', 'PLL + Parity', 'Tips'];
const ordered = <T,>(values: T[], reference: T[]) => [...values].sort((a, b) => { const ai = reference.indexOf(a); const bi = reference.indexOf(b); return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi); });

export default function AlgorithmsScreen() {
  const colors = useAppTheme();
  const { favorites, progress } = useAlgorithmProgress();
  const [cube, setCube] = useState<CubeType>('3x3'); const [method, setMethod] = useState<MethodType>('Beginners'); const [search, setSearch] = useState(''); const [open, setOpen] = useState<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);
  const cubeTypes = useMemo(() => ordered([...new Set(algorithms.map((a) => a.cubeType))], CUBE_ORDER), []);
  const methods = useMemo(() => ordered([...new Set(algorithms.filter((a) => a.cubeType === cube).map((a) => a.method))], METHOD_ORDER), [cube]);
  useEffect(() => { if (!methods.includes(method)) setMethod(methods[0]); }, [methods, method]);
  const visible = useMemo(() => { const needle = search.trim().toLowerCase(); return algorithms.filter((a) => a.cubeType === cube && a.method === method && (!needle || `${a.name} ${a.category} ${a.group ?? ''} ${a.algorithm}`.toLowerCase().includes(needle))); }, [cube, method, search]);
  const sections = useMemo(() => ordered([...new Set(visible.map((a) => a.category))], CATEGORY_ORDER).map((category) => ({ category, algorithms: visible.filter((a) => a.category === category) })), [visible]);
  useEffect(() => { setOpen(new Set(sections.slice(0, 1).map((section) => section.category))); }, [sections]);
  const jump = (category: string) => { setOpen((current) => new Set(current).add(category)); const index = sections.findIndex((section) => section.category === category); scrollRef.current?.scrollTo({ y: 290 + Math.max(0, index) * 62, animated: true }); };
  return (
    <Screen scroll={false}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.page} stickyHeaderIndices={[3]} keyboardShouldPersistTaps="handled">
        <PageHeader eyebrow="Offline library" title="Algorithms" description={`${algorithms.length} cases, using the same verified data as CuberVerse on the web.`} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{cubeTypes.map((value) => <Chip key={value} label={value === 'pyraminx' ? 'Pyraminx' : value.toUpperCase()} selected={cube === value} onPress={() => setCube(value)} />)}</ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{methods.map((value) => <Chip key={value} label={value} selected={method === value} onPress={() => setMethod(value)} />)}</ScrollView>
        <View style={[styles.sticky, { backgroundColor: colors.background }]}>
          <View style={[styles.search, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}><Search color={colors.textSecondary} size={18} /><TextInput value={search} onChangeText={setSearch} placeholder="Search cases or moves…" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text }]} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jump}>{sections.map((section) => <Chip key={section.category} label={`${section.category} ${section.algorithms.length}`} selected={open.has(section.category)} onPress={() => jump(section.category)} />)}</ScrollView>
        </View>
        {sections.length === 0 ? <EmptyState title="No algorithms found" body="Try another puzzle, method, or search." /> : sections.map((section) => <AlgorithmSection key={section.category} title={section.category} items={section.algorithms} expanded={open.has(section.category)} onToggle={() => setOpen((current) => { const next = new Set(current); if (next.has(section.category)) next.delete(section.category); else next.add(section.category); return next; })} favorites={favorites} progress={progress} />)}
      </ScrollView>
    </Screen>
  );
}

function AlgorithmSection({ title, items, expanded, onToggle, favorites, progress }: { title: string; items: Algorithm[]; expanded: boolean; onToggle: () => void; favorites: Set<string>; progress: Record<string, string> }) {
  const colors = useAppTheme();
  return <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}><Pressable onPress={onToggle} style={styles.sectionHeader}><ChevronDown color={colors.textSecondary} size={20} style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} /><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.sectionCount, { color: colors.textSecondary }]}>{items.length}</Text></Pressable>{expanded ? <View style={[styles.sectionBody, { borderTopColor: colors.border }]}>{items.map((algorithm) => <Pressable key={algorithm.id} onPress={() => router.push({ pathname: '/algorithm/[id]', params: { id: algorithm.id } })}><Card style={styles.algorithmCard}><CaseDiagram puzzle={CUBE_TYPE_TO_PUZZLE[algorithm.cubeType]} algorithm={algorithm.algorithm} size={66} /><View style={styles.algorithmCopy}><View style={styles.nameRow}><Text numberOfLines={2} style={[styles.algorithmName, { color: colors.text }]}>{algorithm.name}</Text>{favorites.has(algorithm.id) ? <Star fill={colors.warning} color={colors.warning} size={15} /> : null}</View><Text numberOfLines={1} style={[styles.algorithmMoves, { color: colors.primary }]}>{algorithm.algorithm}</Text>{progress[algorithm.id] ? <Text style={[styles.status, { color: progress[algorithm.id] === 'learned' ? colors.success : colors.warning }]}>{progress[algorithm.id]}</Text> : null}</View><ChevronRight color={colors.textSecondary} size={18} /></Card></Pressable>)}</View> : null}</View>;
}

const styles = StyleSheet.create({ page: { paddingBottom: 30 }, chips: { gap: 8, paddingBottom: 12 }, sticky: { paddingTop: 4, paddingBottom: 10, zIndex: 2 }, search: { minHeight: 46, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, marginBottom: 9 }, input: { flex: 1, paddingHorizontal: 10, fontSize: 15 }, jump: { gap: 7 }, section: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: 'hidden', marginBottom: 10 }, sectionHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15 }, sectionTitle: { flex: 1, fontSize: 19, fontWeight: '800' }, sectionCount: { fontSize: 13, fontWeight: '800' }, sectionBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 10, gap: 9 }, algorithmCard: { padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }, algorithmCopy: { flex: 1, gap: 4 }, nameRow: { flexDirection: 'row', gap: 6, alignItems: 'center' }, algorithmName: { flex: 1, fontSize: 15, fontWeight: '800' }, algorithmMoves: { fontSize: 13, fontFamily: 'monospace' }, status: { fontSize: 11, textTransform: 'uppercase', fontWeight: '900' } });
