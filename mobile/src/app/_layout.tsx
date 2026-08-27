import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const colors = Colors[scheme];
  const navigationTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...navigationTheme, colors: { ...navigationTheme.colors, primary: colors.primary, background: colors.background, card: colors.backgroundElement, text: colors.text, border: colors.border } }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.backgroundElement }, headerTintColor: colors.text, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="algorithm/[id]" options={{ title: 'Algorithm', presentation: 'modal' }} />
        <Stack.Screen name="notation" options={{ title: 'Notation' }} />
        <Stack.Screen name="solve" options={{ title: 'Manual Solver' }} />
        <Stack.Screen name="scanner" options={{ title: 'Camera Scanner' }} />
        <Stack.Screen name="competitions" options={{ title: 'Competitions' }} />
        <Stack.Screen name="about" options={{ title: 'About CuberVerse' }} />
      </Stack>
    </ThemeProvider>
  );
}
