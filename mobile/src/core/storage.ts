import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'cuberverse.native.';

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}${key}`);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export async function removeStored(key: string): Promise<void> {
  await AsyncStorage.removeItem(`${PREFIX}${key}`);
}

export interface SolveRecord { id: string; timeMs: number; cubeType: string; scramble: string; createdAt: string }

export const storageKeys = {
  solves: 'solves.v1', algorithmProgress: 'algorithm-progress.v1', favorites: 'favorites.v1',
  competitionCountry: 'competition-country.v1', wcaProfile: 'wca-profile.v1', wcaCompetitions: 'wca-competitions.v1',
} as const;
