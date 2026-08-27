import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#201b2c', background: '#f8f6fb', backgroundElement: '#ffffff',
    backgroundSelected: '#eee8f6', textSecondary: '#6f687c', border: '#ddd7e5',
    primary: '#6d4aff', primaryMuted: '#ebe6ff', accent: '#e04f9b',
    success: '#268c62', warning: '#a86b08', danger: '#be3b4b', cubeBlue: '#315bd6',
  },
  dark: {
    text: '#f5f1fb', background: '#17151f', backgroundElement: '#211e2b',
    backgroundSelected: '#302b3d', textSecondary: '#aaa2b7', border: '#3b3548',
    primary: '#9a82ff', primaryMuted: '#30284f', accent: '#ef75b7',
    success: '#5fc89b', warning: '#e6aa4f', danger: '#f07886', cubeBlue: '#7595ff',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'system-ui', serif: 'Georgia', rounded: 'system-ui', mono: 'monospace' },
});
export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1040;
