'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Tv, Film, Clapperboard, Play, Heart, Loader2, X, ChevronRight, Layers, Star, Menu } from 'lucide-react';
import Player from '@/app/Player';
import { useFavorites } from '@/lib/useFavorites';
import { usePlaylistUrl } from '@/lib/usePlaylistUrl';
import { useLanguage } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import MovieSearchOverlay from './MovieSearchOverlay';
import SeriesSearchOverlay from './SeriesSearchOverlay';

type Section = 'live' | 'movies' | 'series';

interface IPTVItem {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
  type: 'movie' | 'series' | 'live';
}

const SECTION_META: Record<Section, {
  label: string;
  icon: React.ElementType;
  accent: string;
  dimAccent: string;
  hero: string;
}> = {
  live: {
    label: 'Live TV',
    icon: Tv,
    accent: '#3b82f6', dimAccent: 'rgba(59,130,246,0.15)',
    hero: 'from-blue-950 via-[#0e0e0e] to-[#0e0e0e]',
  },
  movies: {
    label: 'Movies',
    icon: Film,
    accent: '#ef4444', dimAccent: 'rgba(239,68,68,0.15)',
    hero: 'from-red-950 via-[#0e0e0e] to-[#0e0e0e]',
  },
  series: {
    label: 'Series',
    icon: Clapperboard,
    accent: '#a855f7', dimAccent: 'rgba(168,85,247,0.15)',
    hero: 'from-purple-950 via-[#0e0e0e] to-[#0e0e0e]',
  },
};

interface PlayTarget { url: string; name: string; }

function buildStreamUrl(stream: IPTVItem, playlistUrl: string): string {
  // If the stream already has a valid URL, use it
  if (stream.url && (stream.url.startsWith('http://') || stream.url.startsWith('https://'))) {
    return stream.url;
  }

  // Otherwise, build the URL from playlist URL for Xtream Codes
  try {
    const url = new URL(playlistUrl);
    const base = url.origin;
    const username = url.username || url.searchParams.get('username') || '';
    const password = url.password || url.searchParams.get('password') || '';

    if (!username || !password) {
      return stream.url || '';
    }

    // Build Xtream Codes stream URL
    const ext = stream.type === 'live' ? 'm3u8' : stream.type === 'movie' ? 'mkv' : 'mp4';
    const path = stream.type === 'live' ? 'live' : stream.type === 'movie' ? 'movie' : 'series';
    return `${base}/${path}/${username}/${password}/${stream.id}.${ext}`;
  } catch {
    return stream.url || '';
  }
}

function getStreamUrl(stream: IPTVItem, playlistUrl: string): string {
  return buildStreamUrl(stream, playlistUrl);
}

function getProxiedImageUrl(url: string): string {
  if (!url) return '';
  // Use proxy for external images to avoid CORS issues
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function getIcon(stream: IPTVItem): string {
  return getProxiedImageUrl(stream.logo || '');
}

function getRating(stream: IPTVItem): number | null {
  return null;
}

// ── Category list skeleton ────────────────────────────────────────────────────
function CatSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-2">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="h-9 rounded-xl bg-white/5 animate-pulse" style={{ opacity: 1 - i * 0.04 }} />
      ))}
    </div>
  );
}

// ── Stream grid skeleton ──────────────────────────────────────────────────────
function StreamSkeleton({ section }: { section: Section }) {
  if (section === 'live') {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="w-full aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-white/5 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function BrowsePage() {
  const params  = useParams();
  const router  = useRouter();
  const section = params.section as Section;
  const meta    = SECTION_META[section];
  const { t, direction } = useLanguage();
  const { playlistUrl, isLoaded: credentialsLoaded } = usePlaylistUrl();

  // ── streams state ───────────────────────────────────────────────────────────
  const [streams,       setStreams]       = useState<IPTVItem[]>([]);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError,   setStreamError]   = useState<string | null>(null);
  const [streamSearch,  setStreamSearch]  = useState('');

  // ── groups state ────────────────────────────────────────────────────────────
  const [groups,       setGroups]       = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // ── misc ────────────────────────────────────────────────────────────────────
  const [playing,     setPlaying]     = useState<PlayTarget | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  // ── load categories ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!meta || !credentialsLoaded || !playlistUrl) return;
    setStreamLoading(true);
    setStreamError(null);

    const params = new URLSearchParams({ playlistUrl, section });
    fetch(`/api/categories?${params}`)
      .then((r) => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then((data: { categories: any[] }) => {
        const categoryNames = data.categories.map((cat: any) => cat.category_name || cat.name);
        setGroups(categoryNames);
        
        if (categoryNames.length > 0) {
          setSelectedGroup(categoryNames[0]);
        }
      })
      .catch((err) => setStreamError(err.message))
      .finally(() => setStreamLoading(false));
  }, [section, meta, credentialsLoaded, playlistUrl]);

  // ── load streams for selected category ───────────────────────────────────────
  useEffect(() => {
    if (!selectedGroup || !playlistUrl || !section) return;
    setStreamLoading(true);
    setStreamError(null);

    // Find category ID from groups
    const params = new URLSearchParams({ playlistUrl, section });
    fetch(`/api/categories?${params}`)
      .then((r) => r.json())
      .then((data: { categories: any[] }) => {
        const category = data.categories.find((cat: any) => 
          cat.category_name === selectedGroup || cat.name === selectedGroup
        );
        
        if (category) {
          const streamParams = new URLSearchParams({ 
            playlistUrl, 
            section, 
            categoryId: category.category_id.toString()
          });
          return fetch(`/api/channels?${streamParams}`);
        }
        throw new Error('Category not found');
      })
      .then((r) => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then((data: { channels: any[] }) => {
        // Transform API response to IPTVItem format
        const transformed = data.channels.map((item: any): IPTVItem => ({
          id: item.stream_id || item.series_id || item.id,
          name: item.name,
          logo: item.stream_icon || item.cover || item.icon,
          url: item.url,
          group: selectedGroup,
          type: section === 'movies' ? 'movie' : section,
        }));
        setStreams(transformed);
      })
      .catch((err) => setStreamError(err.message))
      .finally(() => setStreamLoading(false));
  }, [selectedGroup, playlistUrl, section]);

  const handlePlay = useCallback(
    (stream: IPTVItem) => {
      const url = getStreamUrl(stream, playlistUrl);
      setPlaying({ url, name: stream.name });
    },
    [playlistUrl],
  );

  const openSearch  = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  if (!meta) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center text-white">
        <p>{t('common.invalidSection')}</p>
      </div>
    );
  }

  if (!playlistUrl) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">يجب إضافة رابط البلاي ليست أولاً</p>
          <Link href="/settings" className="text-accent hover:underline">
            اذهب إلى الإعدادات
          </Link>
        </div>
      </div>
    );
  }

  const Icon = meta.icon;

  const filteredGroups = groups.filter((g) => g.toLowerCase().includes(streamSearch.toLowerCase()));

  const filteredStreams = selectedGroup
    ? streams.filter((s) => s.group === selectedGroup && s.name.toLowerCase().includes(streamSearch.toLowerCase()))
    : streams.filter((s) => s.name.toLowerCase().includes(streamSearch.toLowerCase()));

  const effectiveLoading = streamLoading;

  return (
    <main className="h-screen bg-[#0e0e0e] text-white flex flex-col overflow-hidden" dir={direction}>

      {/* ── TOP HEADER ── */}
      <header className={`bg-gradient-to-r ${meta.hero} border-b border-white/5 shrink-0`}>
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          {/* back */}
          <button onClick={() => router.push('/')} aria-label="Back"
            className="p-2 hover:bg-white/10 rounded-full transition shrink-0">
            <ArrowLeft size={18} />
          </button>

          {/* mobile menu toggle */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu"
            className="lg:hidden p-2 hover:bg-white/10 rounded-full transition shrink-0">
            <Menu size={18} />
          </button>

          {/* icon + title */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: meta.dimAccent, border: `1px solid ${meta.accent}30` }}>
              <Icon size={18} style={{ color: meta.accent }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold leading-none">{meta.label}</h1>
              <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: meta.accent }}>{t(meta.label === 'Live TV' ? 'common.liveTV' : meta.label === 'Movies' ? 'common.movies' : meta.label === 'Series' ? 'common.series' : 'common.liveTV')}</p>
            </div>
          </div>

          {/* movie search CTA */}
          {section === 'movies' && (
            <button onClick={openSearch}
              className="flex items-center gap-2 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white/50
                         hover:text-white transition shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              aria-label="Open movie search"
            >
              <Search size={14} className="shrink-0" />
              <span className="hidden sm:inline">{t('common.searchAllMovies')}</span>
            </button>
          )}

          {/* series search CTA */}
          {section === 'series' && (
            <button onClick={openSearch}
              className="flex items-center gap-2 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white/50
                         hover:text-white transition shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              aria-label="Open series search"
            >
              <Search size={14} className="shrink-0" />
              <span className="hidden sm:inline">{t('common.searchAllSeries')}</span>
            </button>
          )}

          {/* Language toggle */}
          <LanguageToggle />
        </div>
      </header>

      {/* ── TWO-PANEL BODY ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── SIDEBAR: categories ── */}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-white/5 flex flex-col bg-[#111] overflow-hidden transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

          {/* sidebar search */}
          <div className="p-3 border-b border-white/5 shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                type="text"
                placeholder={t('common.searchCategories')}
                value={streamSearch}
                onChange={(e) => setStreamSearch(e.target.value)}
                className="w-full rounded-xl py-2 pl-8 pr-8 text-sm placeholder:text-white/25
                           focus:outline-none transition bg-white/5 border border-white/8
                           focus:border-white/20 focus:bg-white/8"
              />
              {streamSearch && (
                <button onClick={() => setStreamSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* category list */}
          <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/10">
            {streamLoading && <CatSkeleton />}

            {!streamLoading && filteredGroups.map((group) => {
              const isActive = group === selectedGroup;
              return (
                <button
                  key={group}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 mx-2 rounded-xl text-sm transition-all flex items-center justify-between gap-2 group
                    ${isActive
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                  style={{
                    width: 'calc(100% - 16px)',
                    ...(isActive ? { borderLeft: `3px solid ${meta.accent}` } : { borderLeft: '3px solid transparent' }),
                  }}
                >
                  <span className="truncate">{group}</span>
                  {isActive && <ChevronRight size={12} style={{ color: meta.accent }} />}
                </button>
              );
            })}

            {!streamLoading && filteredGroups.length === 0 && (
              <div className="flex flex-col items-center py-12 gap-2 text-white/20">
                <Layers size={24} />
                <p className="text-xs">{t('common.noCategories')}</p>
              </div>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div ref={contentRef} className="flex-1 overflow-y-auto flex flex-col">

          {/* content header */}
          <div className="sticky top-0 z-20 bg-[#0e0e0e]/95 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold truncate">
                {selectedGroup || t('common.selectCategory')}
              </h2>
              {!effectiveLoading && streams.length > 0 && (
                <p className="text-[10px] sm:text-xs text-white/30 mt-0.5">
                  {filteredStreams.length}
                  {streamSearch
                    ? ` ${t('common.of')} ${streams.length}`
                    : ''}{' '}
                  {section === 'live' ? t('common.channels') : section === 'movies' ? t('common.movies') : t('common.series')}
                </p>
              )}
            </div>

            {/* stream search — live only; movies/series use the global overlay */}
            {section === 'live' && (
              <div className="relative w-40 sm:w-56 shrink-0">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('common.searchChannels')}
                  value={streamSearch}
                  onChange={(e) => setStreamSearch(e.target.value)}
                  className="w-full rounded-xl py-2 pl-8 pr-8 text-xs sm:text-sm placeholder:text-white/25
                             focus:outline-none transition bg-white/5 border border-white/8
                             focus:border-white/20"
                />
                {streamSearch && (
                  <button onClick={() => setStreamSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

          </div>

          {/* stream content */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 flex-1">

            {/* loading */}
            {effectiveLoading && <StreamSkeleton section={section} />}

            {/* error */}
            {!effectiveLoading && streamError && (
              <div className="text-center py-24">
                <p className="text-red-400 mb-4">{streamError}</p>
                <button onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-red-600 rounded-full hover:bg-red-700 transition">
                  {t('common.retry')}
                </button>
              </div>
            )}

            {/* no selection */}
            {!effectiveLoading && !streamError && !selectedGroup && (
              <div className="flex flex-col items-center justify-center py-32 gap-3 text-white/20">
                <Layers size={40} />
                <p>{t('common.selectCategory')}</p>
              </div>
            )}

            {/* live tv list */}
            {!effectiveLoading && !streamError && section === 'live' && filteredStreams.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {filteredStreams.map((stream, idx) => {
                  const fav = isFavorite(Number(stream.id), 'live');
                  return (
                    <div
                      key={`${stream.id}-${idx}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition group"
                    >
                      <button onClick={() => handlePlay(stream)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                        <div className="w-12 h-9 rounded-lg bg-gray-800 flex-none overflow-hidden">
                          {stream.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={stream.logo} alt={stream.name}
                              className="w-full h-full object-contain"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play size={14} className="text-gray-500" />
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-sm font-medium truncate">{stream.name}</span>
                      </button>
                      {/* fav button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite({ id: Number(stream.id), name: stream.name, cover: stream.logo, type: 'live', category_id: '' });
                        }}
                        aria-label={fav ? t('common.removeFromFavorites') : t('common.addToFavorites')}
                        className={`p-2 rounded-full transition shrink-0 opacity-0 group-hover:opacity-100
                          ${fav ? 'text-red-500 opacity-100' : 'text-white/30 hover:text-red-400'}`}
                      >
                        <Heart size={15} fill={fav ? 'currentColor' : 'none'} />
                      </button>
                      <Play size={16} className="text-gray-600 group-hover:text-white transition shrink-0 opacity-0 group-hover:opacity-100" onClick={() => handlePlay(stream)} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* movies / series grid */}
            {!effectiveLoading && !streamError && (section === 'movies' || section === 'series') && filteredStreams.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredStreams.map((stream) => {
                  const icon = getIcon(stream);
                  const rating = getRating(stream);
                  const fav = isFavorite(Number(stream.id), section === 'movies' ? 'movie' : 'series');

                  return (
                    <div key={stream.id} className="group flex flex-col gap-2">
                      <Link
                        key={`poster-${stream.id}`}
                        href={`/${section === 'movies' ? 'movie' : 'series'}/${stream.id}`}
                        className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-800"
                      >
                        {icon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={icon} alt={stream.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        {/* hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition pointer-events-none" />
                        {/* play icon on hover */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition">
                          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                            <Play size={20} className="text-black ml-0.5" fill="black" />
                          </div>
                        </div>
                        {/* fav button — top-right */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite({
                              id: Number(stream.id),
                              name: stream.name,
                              cover: icon,
                              type: section === 'movies' ? 'movie' : 'series',
                              category_id: '',
                            });
                          }}
                          aria-label={fav ? t('common.removeFromFavorites') : t('common.addToFavorites')}
                          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition z-10
                            ${fav
                              ? 'bg-red-500/80 text-white opacity-100'
                              : 'bg-black/50 text-white/60 opacity-0 group-hover:opacity-100 hover:text-red-400'}`}
                        >
                          <Heart size={13} fill={fav ? 'currentColor' : 'none'} />
                        </button>
                      </Link>
                      <Link
                        key={`title-${stream.id}`}
                        href={`/${section === 'movies' ? 'movie' : 'series'}/${stream.id}`}
                        className="text-left"
                      >
                        <p className="text-xs font-medium leading-snug line-clamp-2 text-white/85">{stream.name}</p>
                        {rating != null && rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] text-gray-400">{rating.toFixed(1)}</span>
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* empty */}
            {!effectiveLoading && !streamError && selectedGroup && filteredStreams.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-white/20">
                <Layers size={36} />
                <p className="text-sm">
                  {streamSearch ? `${t('common.noResultsFor')} "${streamSearch}"` : t('common.noItemsInThisCategory')}
                </p>
                {streamSearch && (
                  <button onClick={() => setStreamSearch('')}
                    className="text-xs text-red-400 hover:text-red-300 transition">
                    {t('common.clearSearch')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── player modal ── */}
      {playing && (
        <Player src={playing.url} onBack={() => setPlaying(null)} />
      )}

      {/* ── search overlays ── */}
      {section === 'movies' && (
        <MovieSearchOverlay open={searchOpen} onClose={closeSearch} />
      )}
      {section === 'series' && (
        <SeriesSearchOverlay open={searchOpen} onClose={closeSearch} />
      )}

    </main>
  );
}