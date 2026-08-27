import { Link } from 'expo-router';
import { Book, Camera, ChevronRight, Info, Keyboard, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, PageHeader, Screen, useAppTheme } from '@/components/ui';

const TOOLS = [
  { href: '/notation' as const, icon: Book, title: 'Notation guide', body: 'Face, slice, wide and rotation moves.' },
  { href: '/scanner' as const, icon: Camera, title: 'Camera scanner', body: 'Capture all faces and classify sticker colors on-device.' },
  { href: '/solve' as const, icon: Keyboard, title: 'Manual solver', body: 'Enter or correct every sticker and generate a solution.' },
  { href: '/competitions' as const, icon: MapPin, title: 'Competitions', body: 'Browse upcoming WCA competitions by country.' },
  { href: '/about' as const, icon: Info, title: 'About', body: 'The CuberVerse story, privacy, and offline behavior.' },
];

export default function ToolsScreen() {
  const colors = useAppTheme();
  return <Screen><PageHeader eyebrow="Everything else" title="Tools" description="Solving, scanning, notation and competition discovery." /><View style={styles.list}>{TOOLS.map(({ href, icon: Icon, title, body }) => <Link key={href} href={href} asChild><Pressable><Card style={styles.row}><Icon color={colors.primary} size={24} /><View style={styles.copy}><Text style={[styles.title, { color: colors.text }]}>{title}</Text><Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text></View><ChevronRight color={colors.textSecondary} size={20} /></Card></Pressable></Link>)}</View></Screen>;
}
const styles = StyleSheet.create({ list: { gap: 12 }, row: { flexDirection: 'row', gap: 14, alignItems: 'center' }, copy: { flex: 1, gap: 3 }, title: { fontSize: 17, fontWeight: '800' }, body: { fontSize: 13, lineHeight: 19 } });
