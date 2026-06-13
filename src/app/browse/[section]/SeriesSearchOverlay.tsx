'use client';

import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, X, Star, SlidersHorizontal, ChevronDown,
  Play, Clapperboard, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { XtreamSeriesStream } from '@/lib/xtream';
import { usePlaylistUrl } from '@/lib/usePlaylistUrl';

const PAGE_SIZE = 48;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'rating', label: 'Top rated'    },
  { value: 'name',   label: 'A → Z'        },
];

const RATING_OPTIONS = [
  { label: 'Any', min: 0 },
  { label: '4+',  min: 4 },
  { label: '3+',  min: 3 },
  { label: '2+',  min: 2 },
];

// Generate year options from current year back to 2000
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { label: 'Any', value: 0 },
  ...Array.from({ length: currentYear - 1999 }, (_, i) => ({
    label: (currentYear - i).toString(),
    value: currentYear - i,
  })),
];

// ─── module-level cache — cleared on page reload ───────────────────────────────
let searchCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes


// ─── stars ────────────────────────────────────────────────────────────────────
function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={10}
          className={i <= Math.round(value)
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-700 fill-gray-700'}
        />
      ))}
    </div>
  );
}

// ─── series card ──────────────────────────────────────────────────────────────
function SeriesCard({ series, index, onClose }: {
  series: XtreamSeriesStream;
  index: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [imgErr,  setImgErr]  = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), Math.min(index * 20, 250));
    return () => clearTimeout(t);
  }, [index]);

  const handleClick = () => {
    onClose();
    router.push(`/series/${series.series_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group flex flex-col gap-2 cursor-pointer"
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)',
        transition: 'opacity 0.28s ease, transform 0.28s ease',
      }}
    >
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#1c1c1c]">
        {series.cover && !imgErr
          ? ( // eslint-disable-next-line @next/next/no-img-element
            <img src={series.cover} alt={series.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgErr(true)}
            />)
          : (
            <div className="w-full h-full flex items-center justify-center">
              <Clapperboard size={28} className="text-gray-700" />
            </div>
          )
        }

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {series.rating_5based > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1
                          bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold">
            <Star size={9} className="text-yellow-400 fill-yellow-400" />
            {series.rating_5based.toFixed(1)}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center
                        opacity-0 group-hover:opacity-100
                        scale-75 group-hover:scale-100 transition-all duration-300">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-black/60">
            <Play size={18} className="text-black ml-0.5" fill="black" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3
                        translate-y-2 group-hover:translate-y-0
                        opacity-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-xs font-semibold line-clamp-2 leading-tight">{series.name}</p>
        </div>
      </div>

      <div className="px-0.5">
        <p className="text-xs font-medium line-clamp-2 text-gray-300 leading-snug">{series.name}</p>
        {series.rating_5based > 0 && <div className="mt-1"><Stars value={series.rating_5based} /></div>}
      </div>
    </div>
  );
}

// ─── main overlay ─────────────────────────────────────────────────────────────
export default function SeriesSearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playlistUrl } = usePlaylistUrl();

  // all series — loaded with pagination
  const [pageItems,  setPageItems]  = useState<XtreamSeriesStream[]>([]);
  const [total,     setTotal]     = useState(0);
  const [totalPages,setTotalPages]= useState(0);
  const [fetching,  setFetching]   = useState(false);
  const [fetchError,setFetchError] = useState<string | null>(null);

  // UI state
  const [query,     setQuery]     = useState('');
  const [sort,      setSort]      = useState('newest');
  const [ratingIdx, setRatingIdx] = useState(0);
  const [yearIdx,   setYearIdx]   = useState(0);
  const [page,      setPage]      = useState(1);
  const [showFilt,  setShowFilt]  = useState(false);
  const [sortOpen,  setSortOpen]  = useState(false);
  const [yearOpen,  setYearOpen]  = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ── mount animation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) requestAnimationFrame(() => setMounted(true));
    else      setMounted(false);
  }, [open]);

  // ── focus input ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  // ── Escape ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  // ── load series with pagination ───────────────────────────────────────────────
  const loadSeries = useCallback(async () => {
    const minRating = RATING_OPTIONS[ratingIdx].min;
    const minYear = YEAR_OPTIONS[yearIdx].value;

    const params = new URLSearchParams({
      playlistUrl: playlistUrl || '',
      q: query,
      sort,
      rating_min: minRating.toString(),
      year_min: minYear.toString(),
      page: page.toString(),
      limit: '48',
    });

    const cacheKey = params.toString();
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setPageItems(cached.data.items);
      setTotal(cached.data.total);
      setTotalPages(cached.data.totalPages);
      return;
    }

    setFetching(true);
    setFetchError(null);

    try {
      const res = await fetch(`/api/series/search?${params}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      
      searchCache.set(cacheKey, { data, timestamp: Date.now() });
      setPageItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setFetching(false);
    }
  }, [query, sort, ratingIdx, yearIdx, page]);

  // ── load on mount and when filters change ────────────────────────────────────
  useEffect(() => {
    if (open && hasSearched) {
      loadSeries();
    }
  }, [open, hasSearched, page]);

  // ── handle search button click ─────────────────────────────────────────────────
  const handleSearch = useCallback(() => {
    setPage(1);
    setHasSearched(true);
  }, []);

  // ── scroll to top on page change ─────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // ── reset page on filter changes ───────────────────────────────────────────
  useEffect(() => { setPage(1); }, [sort, ratingIdx, yearIdx]);

  const activeFilters = (ratingIdx !== 0 ? 1 : 0) + (sort !== 'newest' ? 1 : 0) + (yearIdx !== 0 ? 1 : 0);

  if (!open && !mounted) return null;

  return (
    <>
      {/* backdrop */}
      <div onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
        style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.25s ease' }}
      />

      {/* panel */}
      <div ref={scrollRef}
        className="fixed inset-x-0 top-0 bottom-0 z-[70] overflow-y-auto bg-[#0e0e0e]"
        style={{
          transform:  mounted ? 'translateY(0)'   : 'translateY(-20px)',
          opacity:    mounted ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
        }}
      >
        {/* ── sticky header ── */}
        <header className="sticky top-0 z-10 bg-[#0e0e0e]/95 backdrop-blur-lg border-b border-white/5">
          <div className="px-6 py-4 flex items-center gap-3">

            {/* search input */}
            <div className="relative flex-1">
              <Search size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search series, titles…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className="w-full bg-white/6 border border-white/10 rounded-2xl
                           py-3.5 pl-12 pr-24 text-base placeholder:text-gray-600
                           focus:outline-none focus:border-white/25 focus:bg-white/10 transition"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {query && (
                  <button
                    onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                    className="p-1.5 text-gray-500 hover:text-white transition rounded-full hover:bg-white/10"
                    aria-label="Clear"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition"
                >
                  Search
                </button>
              </div>
            </div>

            {/* filters */}
            <button
              onClick={() => setShowFilt((v) => !v)}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition shrink-0
                ${showFilt
                  ? 'bg-white text-black border-white'
                  : 'bg-white/6 border-white/10 hover:border-white/25 hover:bg-white/10'}`}
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-500 rounded-full
                                 text-[10px] font-bold flex items-center justify-center text-white">
                  {activeFilters}
                </span>
              )}
            </button>

            {/* close */}
            <button onClick={onClose}
              className="p-2.5 hover:bg-white/10 rounded-full transition shrink-0"
              aria-label="Close search"
            >
              <X size={20} />
            </button>
          </div>

          {/* filter panel */}
          <div style={{
            maxHeight:  showFilt ? '180px' : '0px',
            opacity:    showFilt ? 1 : 0,
            overflow:   'hidden',
            transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
          }}>
            <div className="px-6 pb-5 pt-2 border-t border-white/5 flex flex-wrap gap-8">

              {/* sort */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium">Sort by</p>
                <div className="relative">
                  <button
                    onClick={() => setSortOpen((v) => !v)}
                    className="flex items-center gap-2 bg-white/6 border border-white/10
                               hover:border-white/25 rounded-xl px-4 py-2 text-sm transition"
                  >
                    {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                    <ChevronDown size={13}
                      className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {sortOpen && (
                    <div className="absolute top-full left-0 mt-2 w-44 bg-[#1c1c1c]
                                    border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                      {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value}
                          onClick={() => { setSort(opt.value); setSortOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-white/10
                            ${sort === opt.value ? 'text-white font-semibold' : 'text-gray-400'}`}
                        >
                          {sort === opt.value && <span className="mr-2 text-purple-500">✓</span>}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* rating */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium">Min rating</p>
                <div className="flex gap-2">
                  {RATING_OPTIONS.map((opt, i) => (
                    <button key={opt.label} onClick={() => setRatingIdx(i)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition
                        ${ratingIdx === i
                          ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/25 hover:text-white'}`}
                    >
                      {opt.min > 0 && <Star size={10} className="fill-current" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* year */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium">Year</p>
                <div className="relative">
                  <button
                    onClick={() => setYearOpen((v) => !v)}
                    className="flex items-center gap-2 bg-white/6 border border-white/10
                               hover:border-white/25 rounded-xl px-4 py-2 text-sm transition"
                  >
                    {YEAR_OPTIONS[yearIdx].label}
                    <ChevronDown size={13}
                      className={`transition-transform ${yearOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {yearOpen && (
                    <div className="absolute top-full left-0 mt-2 w-32 bg-[#1c1c1c]
                                    border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-60 overflow-y-auto">
                      {YEAR_OPTIONS.map((opt, i) => (
                        <button key={opt.value} onClick={() => { setYearIdx(i); setYearOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm transition hover:bg-white/10
                            ${yearIdx === i ? 'text-white font-semibold' : 'text-gray-400'}`}>
                          {yearIdx === i && <span className="mr-2 text-purple-500">✓</span>}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {activeFilters > 0 && (
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => { setSort('newest'); setRatingIdx(0); setYearIdx(0); }}
                    className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition"
                  >
                    <X size={12} /> Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* results meta */}
        <div className="px-6 py-4 flex items-center justify-between min-h-[48px]">
          <p className="text-sm text-gray-500">
            {fetching
              ? 'Loading series…'
              : hasSearched
              ? `${total.toLocaleString()} series found`
              : 'Enter a search term and click Search'}
          </p>
          {fetching && <Loader2 size={15} className="text-gray-500 animate-spin" />}
        </div>

        {/* grid */}
        <div className="px-6 pb-12">
          {fetchError && (
            <div className="text-center py-24">
              <p className="text-red-400 mb-4">{fetchError}</p>
              <button
                onClick={loadSeries}
                className="px-6 py-2 bg-red-600 rounded-full hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* initial skeleton */}
          {fetching && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="w-full aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
                  <div className="h-2.5 w-3/4 rounded bg-white/5 animate-pulse" />
                  <div className="h-2 w-1/2 rounded bg-white/5 animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {!fetching && hasSearched && pageItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-700">
              <Clapperboard size={48} />
              <p className="text-lg">No series found</p>
              {query && (
                <button onClick={() => setQuery('')}
                  className="text-sm text-red-400 hover:text-red-300 transition">
                  Clear search
                </button>
              )}
            </div>
          )}

          {!fetching && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-700">
              <Clapperboard size={48} />
              <p className="text-lg">Search for series</p>
              <p className="text-sm text-gray-500">Enter a series name and click Search</p>
            </div>
          )}

          {!fetching && hasSearched && pageItems.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
              {pageItems.map((series, i) => (
                <SeriesCard key={series.series_id} series={series} index={i} onClose={onClose} />
              ))}
            </div>
          )}
        </div>

        {/* pagination */}
        {!fetching && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pb-12 flex-wrap">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-full bg-white/6 hover:bg-white/12
                         disabled:opacity-25 disabled:cursor-not-allowed transition">
              <ChevronLeft size={17} />
            </button>

            {(() => {
              let start = Math.max(1, page - 3);
              const end = Math.min(totalPages, start + 6);
              start     = Math.max(1, end - 6);
              return Array.from({ length: end - start + 1 }, (_, i) => start + i);
            })().map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition
                  ${p === page
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                    : 'bg-white/6 hover:bg-white/14 text-gray-400 hover:text-white'}`}
              >
                {p}
              </button>
            ))}

            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-full bg-white/6 hover:bg-white/12
                         disabled:opacity-25 disabled:cursor-not-allowed transition">
              <ChevronRight size={17} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
