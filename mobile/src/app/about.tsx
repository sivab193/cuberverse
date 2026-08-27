import { StyleSheet, Text, View } from 'react-native';
import { Card, PageHeader, Screen, SectionTitle, useAppTheme } from '@/components/ui';

export default function AboutScreen() {
  const colors = useAppTheme();
  return <Screen><PageHeader eyebrow="Built for cubers" title="About CuberVerse" description="A practical cube companion that works where practice happens — even without a connection." /><SectionTitle>What works offline</SectionTitle><Card><Text style={[styles.body, { color: colors.textSecondary }]}>Algorithms, progress, favorites, timer history, scrambles, notation, scanning and solver inputs stay on your device. WCA records and competition listings need internet to refresh and show their last cached data when offline.</Text></Card><SectionTitle>Privacy</SectionTitle><Card><Text style={[styles.body, { color: colors.textSecondary }]}>No CuberVerse account is required. Camera frames are processed locally and are not uploaded. Timer history and learning progress are stored only in the app.</Text></Card><SectionTitle>The project</SectionTitle><Card><View style={styles.stack}><Text style={[styles.heading, { color: colors.text }]}>One universal React Native app</Text><Text style={[styles.body, { color: colors.textSecondary }]}>Android is the first release target. The same Expo codebase is structured for iOS and a future React Native web replacement.</Text></View></Card></Screen>;
}
const styles = StyleSheet.create({ body: { fontSize: 15, lineHeight: 23 }, stack: { gap: 6 }, heading: { fontSize: 17, fontWeight: '800' } });
