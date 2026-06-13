'use client';

import { useState, useEffect } from 'react';

const PLAYLIST_URL_KEY = 'iptv_playlist_url';
const DEFAULT_PLAYLIST_URL = '';

export function usePlaylistUrl() {
  const [playlistUrl, setPlaylistUrl] = useState<string>(DEFAULT_PLAYLIST_URL);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const storedPlaylist = localStorage.getItem(PLAYLIST_URL_KEY);
    if (storedPlaylist) {
      setPlaylistUrl(storedPlaylist);
    }
    setIsLoaded(true);
  }, []);

  const updatePlaylistUrl = (url: string) => {
    setPlaylistUrl(url);
    localStorage.setItem(PLAYLIST_URL_KEY, url);
  };

  const clearPlaylistUrl = () => {
    setPlaylistUrl(DEFAULT_PLAYLIST_URL);
    localStorage.removeItem(PLAYLIST_URL_KEY);
  };

  return {
    playlistUrl,
    updatePlaylistUrl,
    clearPlaylistUrl,
    isLoaded,
  };
}
