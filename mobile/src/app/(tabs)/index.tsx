import { Link } from 'expo-router';
import { BookOpen, Camera, ChevronRight, Timer, Trophy } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { algorithms } from '@shared/algorithms';

import { Card, PageHeader, Screen, useAppTheme } from '@/components/ui';

const FEATURES = [
  { href: '/algorithms' as const, icon: BookOpen, title: 'Learn algorithms', body: 'Beginner paths through CFOP, OLL, PLL and more — available offline.' },
  { href: '/timer' as const, icon: Timer, title: 'Practice timer', body: 'Scrambles, session history, Ao5 and Ao12 without an account.' },
  { href: '/scanner' as const, icon: Camera, title: 'Scan & solve', body: 'Capture your puzzle with the camera. Images stay on this device.' },
  { href: '/wca' as const, icon: Trophy, title: 'WCA profile', body: 'Public records for 2017BALA04, cached after the first load.' },
];

export default function HomeScreen() {
  const colors = useAppTheme();
  const methods = new Set(algorithms.map((item) => item.method)).size;
  return (
    <Screen>
      <PageHeader eyebrow="Native · offline first" title="Master the cube, anywhere." description="CuberVerse for Android, iOS and web — one React Native codebase with your algorithms and practice tools on-device." />
      <View style={styles.stats}>
        <Card style={styles.stat}><Text style={[styles.statValue, { color: colors.primary }]}>{algorithms.length}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Algorithms</Text></Card>
        <Card style={styles.stat}><Text style={[styles.statValue, { color: colors.accent }]}>{methods}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Methods</Text></Card>
        <Card style={styles.stat}><Text style={[styles.statValue, { color: colors.success }]}>Offline</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Core tools</Text></Card>
      </View>
      <View style={styles.featureList}>
        {FEATURES.map(({ href, icon: Icon, title, body }) => (
          <Link key={href} href={href} asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <Card style={styles.feature}>
                <View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}><Icon color={colors.primary} size={23} /></View>
                <View style={styles.featureCopy}><Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.featureBody, { color: colors.textSecondary }]}>{body}</Text></View>
                <ChevronRight color={colors.textSecondary} size={20} />
              </Card>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }, stat: { flexGrow: 1, minWidth: 95, padding: 14 }, statValue: { fontSize: 22, fontWeight: '900' }, statLabel: { fontSize: 12, marginTop: 3 }, featureList: { gap: 12 }, feature: { flexDirection: 'row', alignItems: 'center', gap: 14 }, icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, featureCopy: { flex: 1, gap: 3 }, featureTitle: { fontSize: 17, fontWeight: '800' }, featureBody: { fontSize: 13, lineHeight: 19 }, pressed: { opacity: 0.72 } });
