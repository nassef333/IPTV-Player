'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Play, Star, Clock, Calendar, User,
  Clapperboard, ChevronRight, Loader2, Heart,
} from 'lucide-react';
import Player from '@/app/Player';
import type { XtreamSeriesInfo, XtreamSeriesEpisode } from '@/lib/xtream';
import { useFavorites } from '@/lib/useFavorites';
import { usePlaylistUrl } from '@/lib/usePlaylistUrl';

function getEpisodeUrl(episode: XtreamSeriesEpisode, playlistUrl: string): string {
  try {
    const url = new URL(playlistUrl);
    const baseUrl = url.origin;
    const username = url.username || url.searchParams.get('username') || '';
    const password = url.password || url.searchParams.get('password') || '';

    if (!username || !password) return '';
    return `${baseUrl}/series/${username}/${password}/${episode.id}.${episode.container_extension || 'mp4'}`;
  } catch {
    return '';
  }
}

function formatDuration(secs?: number): string {
  if (!secs) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Episode row ──────────────────────────────────────────────────────────────
function EpisodeRow({
  episode,
  onPlay,
  accent,
}: {
  episode: XtreamSeriesEpisode;
  onPlay: (ep: XtreamSeriesEpisode) => void;
  accent: string;
}) {
  const [imgErr, setImgErr] = useState(false);
  const thumb = episode.info?.movie_image;
  const dur   = formatDuration(episode.info?.duration_secs);

  return (
    <button
      onClick={() => onPlay(episode)}
      className="w-full flex items-start gap-3 sm:gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10
                 transition text-left group"
      aria-label={`Play ${episode.title}`}
    >
      {/* thumbnail */}
      <div className="relative w-24 sm:w-32 aspect-video rounded-lg overflow-hidden bg-gray-800 shrink-0">
        {thumb && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={episode.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={18} className="text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition
                        flex items-center justify-center">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full flex items-center justify-center">
            <Play size={14} className="text-black ml-0.5" fill="black" />
          </div>
        </div>
        {dur && (
          <span className="absolute bottom-1 right-1 text-[9px] sm:text-[10px] bg-black/80 rounded px-1 py-0.5">
            {dur}
          </span>
        )}
      </div>

      {/* meta */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
            style={{ background: `${accent}25`, color: accent }}
          >
            E{episode.episode_num}
          </span>
          <p className="text-xs sm:text-sm font-medium truncate">{episode.title}</p>
        </div>
        {episode.info?.plot && (
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
            {episode.info.plot}
          </p>
        )}
        {episode.info?.releasedate && (
          <p className="text-[10px] sm:text-[11px] text-gray-600 mt-1">{episode.info.releasedate}</p>
        )}
      </div>
    </button>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function SeriesDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const seriesId = params.id as string;

  const [info,    setInfo]    = useState<XtreamSeriesInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [playing, setPlaying] = useState<{ url: string; name: string } | null>(null);

  const accent = '#a855f7';
  const { isFavorite, toggleFavorite } = useFavorites();
  const { playlistUrl } = usePlaylistUrl();

  useEffect(() => {
    if (!playlistUrl) {
      setError('Playlist URL is required. Please set it in settings.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/series/info?series_id=${seriesId}&playlistUrl=${encodeURIComponent(playlistUrl)}`)
      .then((r) => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then((data: XtreamSeriesInfo) => {
        setInfo(data);
        // default to first available season
        const firstSeason = data.seasons?.[0]?.season_number
          ?? parseInt(Object.keys(data.episodes ?? {})[0] ?? '1', 10);
        setSelectedSeason(firstSeason);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [seriesId, playlistUrl]);

  const handlePlay = useCallback((ep: XtreamSeriesEpisode) => {
    setPlaying({ url: getEpisodeUrl(ep, playlistUrl || ''), name: ep.title });
  }, [playlistUrl]);

  // ── seasons that actually have episodes ───────────────────────────────────
  const availableSeasons = info
    ? (info.seasons ?? []).filter((s) => info.episodes?.[String(s.season_number)]?.length > 0)
    : [];

  // if seasons array is empty but episodes exist, synthesise season tabs
  const syntheticSeasons = info && availableSeasons.length === 0
    ? Object.keys(info.episodes ?? {})
        .map(Number)
        .sort((a, b) => a - b)
    : null;

  const currentEpisodes: XtreamSeriesEpisode[] = info?.episodes?.[String(selectedSeason)] ?? [];

  // ── backdrop ──────────────────────────────────────────────────────────────
  const backdrop = info?.info?.backdrop_path?.[0] ?? '';
  const cover    = info?.info?.cover ?? '';

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-white">

      {/* ── hero ── */}
      <div className="relative">
        {/* backdrop image */}
        {backdrop && (
          <div className="absolute inset-0 h-[350px] sm:h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backdrop}
              alt=""
              className="w-full h-full object-cover opacity-25"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0e0e0e]/60 to-[#0e0e0e]" />
          </div>
        )}

        <div className="relative px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
          {/* back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white transition mb-4 sm:mb-6 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs sm:text-sm">Back</span>
          </button>

          {loading && (
            <div className="flex flex-col items-center justify-center py-24 sm:py-32 gap-4">
              <Loader2 size={32} className="animate-spin text-purple-500" />
              <p className="text-gray-400 text-xs sm:text-sm">Loading series…</p>
            </div>
          )}

          {error && (
            <div className="text-center py-24 sm:py-32">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 sm:px-6 py-2 bg-red-600 rounded-full hover:bg-red-700 transition text-xs sm:text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && info && (
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 pb-6 sm:pb-8">
              {/* cover poster */}
              <div className="shrink-0">
                <div className="w-32 sm:w-40 md:w-52 aspect-[2/3] rounded-2xl overflow-hidden bg-gray-800 shadow-2xl shadow-black/60 mx-auto md:mx-0">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={info.info.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Clapperboard size={36} className="text-gray-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{info.info.name}</h1>

                {/* badges row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                  {info.info.rating_5based > 0 && (
                    <span className="flex items-center gap-1 bg-yellow-400/15 border border-yellow-400/30
                                     text-yellow-300 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full">
                      <Star size={11} className="fill-current" />
                      {info.info.rating_5based.toFixed(1)}
                    </span>
                  )}
                  {info.info.releaseDate && (
                    <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400">
                      <Calendar size={12} />
                      {info.info.releaseDate}
                    </span>
                  )}
                  {info.info.episode_run_time && info.info.episode_run_time !== '0' && (
                    <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400">
                      <Clock size={12} />
                      {info.info.episode_run_time} min / ep
                    </span>
                  )}
                  {info.info.genre && (
                    <span className="text-[10px] sm:text-xs text-gray-400">{info.info.genre}</span>
                  )}
                </div>

                {/* plot */}
                {info.info.plot && (
                  <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
                    {info.info.plot}
                  </p>
                )}

                {/* cast / director */}
                <div className="mt-3 sm:mt-4 flex flex-col gap-1.5">
                  {info.info.director && (
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      <span className="text-gray-400 font-medium">Director: </span>
                      {info.info.director}
                    </p>
                  )}
                  {info.info.cast && (
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      <span className="text-gray-400 font-medium">
                        <User size={11} className="inline mr-1" />Cast:{' '}
                      </span>
                      {info.info.cast}
                    </p>
                  )}
                </div>

                {/* favorite button */}
                <div className="mt-4 sm:mt-5">
                  <button
                    aria-label="أضف للمفضلة"
                    onClick={() => toggleFavorite({
                      id: parseInt(seriesId),
                      name: info.info.name,
                      cover: cover,
                      type: 'series',
                      category_id: '',
                    })}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 text-xs sm:text-sm font-medium transition
                      ${isFavorite(parseInt(seriesId), 'series')
                        ? 'border-red-500 bg-red-500/15 text-red-400'
                        : 'border-gray-600 bg-white/5 text-gray-400 hover:border-red-400 hover:text-red-400 hover:bg-red-500/10'}`}
                  >
                    <Heart
                      size={16}
                      fill={isFavorite(parseInt(seriesId), 'series') ? 'currentColor' : 'none'}
                    />
                    {isFavorite(parseInt(seriesId), 'series') ? 'في المفضلة' : 'أضف للمفضلة'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── seasons + episodes ── */}
      {!loading && !error && info && (
        <div className="px-4 sm:px-6 pb-12 sm:pb-16">

          {/* season tabs */}
          {(availableSeasons.length > 1 || (syntheticSeasons && syntheticSeasons.length > 1)) && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
              {(availableSeasons.length > 0 ? availableSeasons : []).map((season) => (
                <button
                  key={season.season_number}
                  onClick={() => setSelectedSeason(season.season_number)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shrink-0 transition border
                    ${selectedSeason === season.season_number
                      ? 'text-white border-purple-500/50'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/25 hover:text-white'}`}
                  style={selectedSeason === season.season_number
                    ? { background: `${accent}20`, borderColor: `${accent}50` }
                    : {}}
                >
                  {season.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={season.cover} alt="" className="w-5 h-5 rounded object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  {season.name || `Season ${season.season_number}`}
                  <span className="text-[10px] text-gray-500">
                    {season.episode_count} ep
                  </span>
                </button>
              ))}

              {/* synthetic season tabs when seasons array is empty */}
              {syntheticSeasons?.map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedSeason(num)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shrink-0 transition border
                    ${selectedSeason === num
                      ? 'text-white border-purple-500/50'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/25 hover:text-white'}`}
                  style={selectedSeason === num
                    ? { background: `${accent}20`, borderColor: `${accent}50` }
                    : {}}
                >
                  Season {num}
                  <span className="text-[10px] text-gray-500">
                    {info.episodes?.[String(num)]?.length ?? 0} ep
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* single season label (when only one season) */}
          {(availableSeasons.length <= 1 && !syntheticSeasons) && (
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-base font-semibold">
                {availableSeasons[0]?.name || 'Season 1'}
              </h2>
              <ChevronRight size={14} className="text-gray-600" />
              <span className="text-sm text-gray-500">
                {currentEpisodes.length} episodes
              </span>
            </div>
          )}

          {(availableSeasons.length > 1 || syntheticSeasons) && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">
                {currentEpisodes.length} episodes
              </span>
            </div>
          )}

          {/* episode list */}
          {currentEpisodes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {currentEpisodes.map((ep) => (
                <EpisodeRow
                  key={ep.id}
                  episode={ep}
                  onPlay={handlePlay}
                  accent={accent}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
              <Clapperboard size={36} />
              <p className="text-sm">No episodes available for this season</p>
            </div>
          )}
        </div>
      )}

      {/* player modal */}
      {playing && (
        <Player src={playing.url} onBack={() => setPlaying(null)} />
      )}
    </main>
  );
}
