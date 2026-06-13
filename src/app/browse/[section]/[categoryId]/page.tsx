'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Play, Star, Filter, X } from 'lucide-react';
import Player from '@/app/Player';
import type { XtreamLiveStream, XtreamVodStream, XtreamSeriesStream } from '@/lib/xtream';
import { usePlaylistUrl } from '@/lib/usePlaylistUrl';

type Section = 'live' | 'movies' | 'series';
type AnyStream = XtreamLiveStream | XtreamVodStream | XtreamSeriesStream;

function getProxiedImageUrl(url: string): string {
  if (!url) return '';
  // Use proxy for external images to avoid CORS issues
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

interface PlayTarget {
  url: string;
  name: string;
}

function getStreamUrl(section: Section, stream: AnyStream, playlistUrl: string): string {
  if (!playlistUrl) return '';

  try {
    const url = new URL(playlistUrl);
    const base = url.origin;
    const username = url.username || url.searchParams.get('username') || '';
    const password = url.password || url.searchParams.get('password') || '';

    if (!username || !password) return '';

    if (section === 'live') {
      const s = stream as XtreamLiveStream;
      return `${base}/live/${username}/${password}/${s.stream_id}.m3u8`;
    }
    if (section === 'movies') {
      const s = stream as XtreamVodStream;
      return `${base}/movie/${username}/${password}/${s.stream_id}.${s.container_extension || 'mkv'}`;
    }
    return '';
  } catch {
    return '';
  }
}

function getIcon(stream: AnyStream, section: Section): string {
  if (section === 'live') return getProxiedImageUrl((stream as XtreamLiveStream).stream_icon || '');
  if (section === 'movies') return getProxiedImageUrl((stream as XtreamVodStream).stream_icon || '');
  return getProxiedImageUrl((stream as XtreamSeriesStream).cover || '');
}

function getRating(stream: AnyStream, section: Section): number | null {
  if (section === 'movies') return (stream as XtreamVodStream).rating_5based || null;
  if (section === 'series') return (stream as XtreamSeriesStream).rating_5based || null;
  return null;
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const section = params.section as Section;
  const categoryId = params.categoryId as string;
  const { playlistUrl } = usePlaylistUrl();

  const [streams, setStreams] = useState<AnyStream[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [minRating, setMinRating] = useState<number>(0);
  const [year, setYear] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [playing, setPlaying] = useState<PlayTarget | null>(null);

  useEffect(() => {
    setLoading(true);

    // Fetch category name
    fetch(`/api/${section}/categories`)
      .then((r) => r.json())
      .then((cats) => {
        const found = cats.find(
          (c: { category_id: string; category_name: string }) => c.category_id === categoryId
        );
        if (found) setCategoryName(found.category_name);
      })
      .catch(() => {});

    // Fetch streams
    const endpoint =
      section === 'series'
        ? `/api/${section}/streams?category_id=${categoryId}`
        : `/api/${section}/streams?category_id=${categoryId}`;

    fetch(endpoint)
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data: AnyStream[]) => setStreams(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [section, categoryId]);

  const handlePlay = useCallback(
    (stream: AnyStream) => {
      if (section === 'series') {
        const s = stream as XtreamSeriesStream;
        router.push(`/series/${s.series_id}`);
        return;
      }
      if (section === 'movies') {
        // Navigate to movie landing page instead of playing inline
        const s = stream as XtreamVodStream;
        router.push(`/movie/${s.stream_id}`);
        return;
      }
      const url = getStreamUrl(section, stream, playlistUrl);
      setPlaying({ url, name: stream.name });
    },
    [section, router, playlistUrl]
  );

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
  };

  const clearFilters = () => {
    setMinRating(0);
    setYear('');
    setSortBy('newest');
  };

  const getYearFromDate = (stream: AnyStream, section: Section): string => {
    if (section === 'movies') {
      const s = stream as XtreamVodStream;
      const date = new Date(s.added);
      return date.getFullYear().toString();
    }
    if (section === 'series') {
      const s = stream as XtreamSeriesStream;
      if (s.releaseDate) {
        const date = new Date(s.releaseDate);
        return date.getFullYear().toString();
      }
      const date = new Date(s.last_modified);
      return date.getFullYear().toString();
    }
    const s = stream as XtreamLiveStream;
    const date = new Date(s.added);
    return date.getFullYear().toString();
  };

  const getDateForSorting = (stream: AnyStream, section: Section): string => {
    if (section === 'movies') {
      return (stream as XtreamVodStream).added;
    }
    if (section === 'series') {
      return (stream as XtreamSeriesStream).last_modified;
    }
    return (stream as XtreamLiveStream).added;
  };

  const filtered = streams
    .filter((s) => {
      // Search filter
      if (activeSearch && !s.name.toLowerCase().includes(activeSearch.toLowerCase())) {
        return false;
      }
      // Rating filter (only for movies and series)
      if ((section === 'movies' || section === 'series') && minRating > 0) {
        const rating = getRating(s, section);
        if (!rating || rating < minRating) {
          return false;
        }
      }
      // Year filter
      if (year) {
        const streamYear = getYearFromDate(s, section);
        if (streamYear !== year) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      const dateA = new Date(getDateForSorting(a, section));
      const dateB = new Date(getDateForSorting(b, section));
      return sortBy === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

  // Get available years from streams
  const availableYears = Array.from(
    new Set(streams.map((s) => getYearFromDate(s, section)))
  ).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0e0e]/90 backdrop-blur-md border-b border-white/5 px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push(`/browse/${section}`)}
          aria-label="Back"
          className="p-2 hover:bg-white/10 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{categoryName || 'Loading...'}</h1>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-32 sm:w-48 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-white/10 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-white/30 transition"
            />
            {activeSearch && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="hidden sm:flex px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full text-sm font-medium transition"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-full transition ${
              showFilters || minRating > 0 || year || sortBy !== 'newest'
                ? 'bg-red-600 text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>
      </header>

      <div className="px-8 py-8">
        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Rating Filter */}
              {(section === 'movies' || section === 'series') && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Min Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-white/30 transition"
                  >
                    <option value={0}>All Ratings</option>
                    <option value={1}>1+ Stars</option>
                    <option value={2}>2+ Stars</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={5}>5 Stars</option>
                  </select>
                </div>
              )}
              {/* Year Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-white/30 transition"
                >
                  <option value="">All Years</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {/* Sort By */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
                  className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-white/30 transition"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-32">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 rounded-full hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-gray-500 text-sm mb-6">{filtered.length} items</p>

            {/* Live TV: list layout */}
            {section === 'live' && (
              <div className="flex flex-col gap-2">
                {filtered.map((stream) => {
                  const s = stream as XtreamLiveStream;
                  return (
                    <button
                      key={s.stream_id}
                      onClick={() => handlePlay(stream)}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-left group"
                    >
                      <div className="w-14 h-10 rounded-lg bg-gray-800 flex-none overflow-hidden">
                        {s.stream_icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.stream_icon}
                            alt={s.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play size={16} className="text-gray-500" />
                          </div>
                        )}
                      </div>
                      <span className="flex-1 font-medium truncate">{s.name}</span>
                      <Play
                        size={18}
                        className="text-gray-600 group-hover:text-white transition flex-none"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Movies & Series: grid layout */}
            {(section === 'movies' || section === 'series') && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {filtered.map((stream) => {
                  const icon = getIcon(stream, section);
                  const rating = getRating(stream, section);
                  const isMovie = section === 'movies';
                  const streamId = isMovie
                    ? (stream as XtreamVodStream).stream_id
                    : (stream as XtreamSeriesStream).series_id;

                  return (
                    <button
                      key={streamId}
                      onClick={() => handlePlay(stream)}
                      className="group flex flex-col gap-2 text-left"
                    >
                      {/* Poster */}
                      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-800">
                        {icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={icon}
                            alt={stream.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                            <Play size={20} className="text-black ml-1" fill="black" />
                          </div>
                        </div>
                      </div>
                      {/* Info */}
                      <div>
                        <p className="text-sm font-medium leading-snug line-clamp-2">
                          {stream.name}
                        </p>
                        {rating != null && rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={11} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-gray-400">{rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-20 text-gray-500">No items found</div>
            )}
          </>
        )}
      </div>

      {/* Player modal */}
      {playing && (
        <Player src={playing.url} onBack={() => setPlaying(null)} />
      )}
    </main>
  );
}
