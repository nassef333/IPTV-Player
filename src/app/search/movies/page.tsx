'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, X, Star, SlidersHorizontal,
  ChevronDown, Play, Film, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Player from '@/app/Player';
import type { XtreamVodStream } from '@/lib/xtream';

const XTREAM_BASE = process.env.NEXT_PUBLIC_XTREAM_BASE_URL || '';
const USERNAME = process.env.NEXT_PUBLIC_XTREAM_USERNAME || '';
const PASSWORD = process.env.NEXT_PUBLIC_XTREAM_PASSWORD || '';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'A → Z' },
];

const RATING_OPTIONS = [
  { label: 'Any', min: 0, max: 5 },
  { label: '4+', min: 4, max: 5 },
  { label: '3+', min: 3, max: 5 },
  { label: '2+', min: 2, max: 5 },
];

interface SearchResult {
  items: XtreamVodStream[];
  total: number;
  page: number;
  totalPages: number;
}

interface PlayTarget { url: string; name: string }

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Stars component ──────────────────────────────────────────────────────────
function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={10}
          className={
            i <= Math.round(value)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-600 fill-gray-600'
          }
        />
      ))}
    </div>
  );
}

// ─── Movie card ───────────────────────────────────────────────────────────────
function MovieCard({
  movie,
  onPlay,
  index,
}: {
  movie: XtreamVodStream;
  onPlay: (m: XtreamVodStream) => void;
  index: number;
}) {
  const [imgError, setImgError] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // staggered entrance
  useEffect(() => {
    const delay = Math.min(index * 30, 400);
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      ref={ref}
      className="group flex flex-col gap-2 text-left cursor-pointer"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
      onClick={() => onPlay(movie)}
    >
      {/* Poster */}
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-900">
        {movie.stream_icon && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.stream_icon}
            alt={movie.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={32} className="text-gray-700" />
          </div>
        )}

        {/* Dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating badge */}
        {movie.rating_5based > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[11px] font-bold text-white">{movie.rating_5based.toFixed(1)}</span>
          </div>
        )}

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-100 scale-75">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-black/50">
            <Play size={22} className="text-black ml-1" fill="black" />
          </div>
        </div>

        {/* Title on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-xs font-semibold line-clamp-2 leading-snug">{movie.name}</p>
        </div>
      </div>

      {/* Below poster */}
      <div>
        <p className="text-sm font-medium leading-snug line-clamp-2 text-gray-200">
          {movie.name}
        </p>
        {movie.rating_5based > 0 && (
          <div className="mt-1">
            <Stars value={movie.rating_5based} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MoviesSearchPage() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [ratingIdx, setRatingIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<PlayTarget | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 350);
  const rating = RATING_OPTIONS[ratingIdx];

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedQuery, sort, ratingIdx]);

  // Fetch
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      q: debouncedQuery,
      sort,
      rating_min: String(rating.min),
      rating_max: String(rating.max),
      page: String(page),
      limit: '48',
    });
    fetch(`/api/movies/search?${params}`)
      .then((r) => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then((data: SearchResult) => setResult(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [debouncedQuery, sort, rating.min, rating.max, page]);

  const handlePlay = useCallback((movie: XtreamVodStream) => {
    if (!XTREAM_BASE || !USERNAME || !PASSWORD) return;
    const url = `${XTREAM_BASE}/movie/${USERNAME}/${PASSWORD}/${movie.stream_id}.${movie.container_extension || 'mkv'}`;
    setPlaying({ url, name: movie.name });
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (ratingIdx !== 0) n++;
    if (sort !== 'newest') n++;
    return n;
  }, [ratingIdx, sort]);

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-white">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-40 bg-[#0e0e0e]/95 backdrop-blur-lg border-b border-white/5">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/browse/movies')}
            className="p-2 hover:bg-white/10 rounded-full transition shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Search bar */}
          <div className="relative flex-1 max-w-2xl">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              placeholder="Search all movies…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white/8 border border-white/10 rounded-2xl py-3 pl-11 pr-10 text-sm
                         placeholder:text-gray-500 focus:outline-none focus:border-white/30 focus:bg-white/12 transition"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition"
                aria-label="Clear"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-medium transition
              ${showFilters
                ? 'bg-white text-black border-white'
                : 'bg-white/8 border-white/10 hover:border-white/25 hover:bg-white/12'}`}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Filter panel ── */}
        <div
          style={{
            maxHeight: showFilters ? '200px' : '0px',
            opacity: showFilters ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
          }}
        >
          <div className="px-6 pb-5 pt-2 flex flex-wrap gap-6 border-t border-white/5">

            {/* Sort */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Sort by</p>
              <div className="relative">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex items-center gap-2 bg-white/8 border border-white/10 hover:border-white/25 rounded-xl px-4 py-2 text-sm transition"
                >
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                </button>
                {sortOpen && (
                  <div className="absolute top-full left-0 mt-2 w-44 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value); setSortOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-white/10
                          ${sort === opt.value ? 'text-white font-semibold' : 'text-gray-400'}`}
                      >
                        {opt.value === sort && <span className="mr-2 text-red-500">✓</span>}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Min rating</p>
              <div className="flex gap-2">
                {RATING_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.label}
                    onClick={() => setRatingIdx(i)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition
                      ${ratingIdx === i
                        ? 'bg-yellow-400/15 border-yellow-400/50 text-yellow-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/25 hover:text-white'}`}
                  >
                    {opt.min > 0 && <Star size={11} className="fill-current" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => { setSort('newest'); setRatingIdx(0); }}
                  className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition"
                >
                  <X size={13} /> Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Results bar ── */}
      <div className="px-6 py-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading
            ? 'Searching…'
            : result
            ? `${result.total.toLocaleString()} movies found`
            : ''}
        </p>
        {loading && <Loader2 size={16} className="text-gray-500 animate-spin" />}
      </div>

      {/* ── Grid ── */}
      <div className="px-6 pb-12">
        {error && (
          <div className="text-center py-32">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 rounded-full hover:bg-red-700 transition">
              Retry
            </button>
          </div>
        )}

        {!error && result?.items.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-600">
            <Film size={48} />
            <p className="text-lg">No movies found</p>
            {query && (
              <button onClick={() => setQuery('')} className="text-sm text-red-400 hover:text-red-300 transition">
                Clear search
              </button>
            )}
          </div>
        )}

        {result && result.items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {result.items.map((movie, i) => (
              <MovieCard key={movie.stream_id} movie={movie} onPlay={handlePlay} index={i} />
            ))}
          </div>
        )}

        {/* Skeleton while loading first page */}
        {loading && !result && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="w-full aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-white/5 animate-pulse" />
                <div className="h-2 w-1/2 rounded bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pb-12">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 rounded-full bg-white/8 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(7, result.totalPages) }, (_, i) => {
            // show pages around current
            const half = 3;
            let start = Math.max(1, page - half);
            const end = Math.min(result.totalPages, start + 6);
            start = Math.max(1, end - 6);
            return start + i;
          }).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition
                ${p === page
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                  : 'bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white'}`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={page >= result.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-full bg-white/8 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Player ── */}
      {playing && <Player src={playing.url} onBack={() => setPlaying(null)} />}
    </main>
  );
}
