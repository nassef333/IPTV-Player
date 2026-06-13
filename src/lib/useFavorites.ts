'use client';

import { useState, useEffect, useCallback } from 'react';

export type FavoriteType = 'live' | 'movie' | 'series';

export interface FavoriteItem {
  id: number;           // stream_id or series_id
  name: string;
  cover: string;        // stream_icon or cover
  type: FavoriteType;
  category_id: string;
  container_extension?: string; // movies only
  added_at: number;     // timestamp
}

const STORAGE_KEY = 'iptv_favorites';

function load(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: FavoriteItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // hydrate from localStorage on mount
  useEffect(() => {
    setFavorites(load());
  }, []);

  const isFavorite = useCallback(
    (id: number, type: FavoriteType) =>
      favorites.some((f) => f.id === id && f.type === type),
    [favorites],
  );

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'added_at'>) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id && f.type === item.type);
      const next = exists
        ? prev.filter((f) => !(f.id === item.id && f.type === item.type))
        : [...prev, { ...item, added_at: Date.now() }];
      save(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: number, type: FavoriteType) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => !(f.id === id && f.type === type));
      save(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
