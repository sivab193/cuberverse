import { useCallback, useEffect, useState } from 'react';
import { readJson, storageKeys, writeJson } from '@/core/storage';

export type Progress = 'learning' | 'learned';
export type ProgressMap = Record<string, Progress>;

export function useAlgorithmProgress() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { void Promise.all([readJson<string[]>(storageKeys.favorites, []), readJson<ProgressMap>(storageKeys.algorithmProgress, {})]).then(([favoriteIds, savedProgress]) => { setFavorites(new Set(favoriteIds)); setProgress(savedProgress); setLoaded(true); }); }, []);
  const toggleFavorite = useCallback((id: string) => { setFavorites((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); void writeJson(storageKeys.favorites, [...next]); return next; }); }, []);
  const cycleProgress = useCallback((id: string) => { setProgress((current) => { const next = { ...current }; if (!next[id]) next[id] = 'learning'; else if (next[id] === 'learning') next[id] = 'learned'; else delete next[id]; void writeJson(storageKeys.algorithmProgress, next); return next; }); }, []);
  return { favorites, progress, loaded, toggleFavorite, cycleProgress };
}
