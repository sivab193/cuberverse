import { Tabs } from 'expo-router';
import { BookOpen, Home, Timer, Trophy, Wrench } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const colors = Colors[useColorScheme() === 'light' ? 'light' : 'dark'];
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textSecondary, tabBarStyle: { backgroundColor: colors.backgroundElement, borderTopColor: colors.border } }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="algorithms" options={{ title: 'Learn', tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }} />
      <Tabs.Screen name="timer" options={{ title: 'Timer', tabBarIcon: ({ color, size }) => <Timer color={color} size={size} /> }} />
      <Tabs.Screen name="tools" options={{ title: 'Tools', tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} /> }} />
      <Tabs.Screen name="wca" options={{ title: 'WCA', tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }} />
    </Tabs>
  );
}
