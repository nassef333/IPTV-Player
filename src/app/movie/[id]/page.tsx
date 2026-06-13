'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Play, Heart, ThumbsUp, ChevronDown,
  Star, Clock, Globe, Film, Mic, Tv2,
  Zap, ExternalLink, Volume2, VolumeX, Users, Clapperboard, X,
} from 'lucide-react';
import Player from '@/app/Player';
import type { XtreamVodInfo } from '@/lib/xtream';
import { useFavorites } from '@/lib/useFavorites';
import { usePlaylistUrl } from '@/lib/usePlaylistUrl';

// ─── constants ────────────────────────────────────────────────────────────────
function buildStreamUrl(id: number, playlistUrl: string, ext = 'mkv') {
  try {
    const url = new URL(playlistUrl);
    const baseUrl = url.origin;
    const username = url.username || url.searchParams.get('username') || '';
    const password = url.password || url.searchParams.get('password') || '';

    if (!username || !password) return '';
    return `${baseUrl}/movie/${username}/${password}/${id}.${ext}`;
  } catch {
    return '';
  }
}

function formatBitrate(bps: number) {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  if (bps >= 1_000)     return `${(bps / 1_000).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

function formatFrameRate(raw: string) {
  // e.g. "25/1" → "25 fps"
  const [num, den] = raw.split('/').map(Number);
  if (!den || den === 0) return raw;
  const fps = num / den;
  return Number.isInteger(fps) ? `${fps} fps` : `${fps.toFixed(2)} fps`;
}

function resolveResolution(w?: number, h?: number) {
  if (!w || !h) return null;
  let label = `${w}×${h}`;
  if (h >= 2160) label += ' (4K)';
  else if (h >= 1080) label += ' (1080p)';
  else if (h >= 720) label += ' (720p)';
  else if (h >= 480) label += ' (480p)';
  return label;
}

// ─── small UI atoms ───────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium
                     bg-white/8 border border-white/10 text-gray-300 whitespace-nowrap">
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500 mb-3">
      {children}
    </h3>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5
                    border-b border-white/5 last:border-0 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-200 text-right">{value}</span>
    </div>
  );
}

function Badge({ children, color = 'gray' }: {
  children: React.ReactNode;
  color?: 'gray' | 'green' | 'yellow' | 'blue' | 'red';
}) {
  const colors = {
    gray:   'bg-white/8 text-gray-300',
    green:  'bg-green-500/15 text-green-400',
    yellow: 'bg-yellow-400/15 text-yellow-300',
    blue:   'bg-blue-500/15 text-blue-300',
    red:    'bg-red-500/15 text-red-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-[#141414] animate-pulse">
      <div className="h-screen bg-gradient-to-b from-[#1a1a1a] to-[#141414]" />
    </div>
  );
}

// ─── Actor chip ───────────────────────────────────────────────────────────────
function ActorChip({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5
                    border border-white/8 text-sm text-gray-300 whitespace-nowrap">
      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        <Users size={14} className="text-gray-400" />
      </div>
      {name.trim()}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MoviePage() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params.id as string;

  const [info,      setInfo]      = useState<XtreamVodInfo | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [playing,   setPlaying]   = useState(false);
  const [trailer,   setTrailer]   = useState(false);
  const [bgLoaded,  setBgLoaded]  = useState(false);
  const [showPlot,  setShowPlot]  = useState(false);
  const [muted,     setMuted]     = useState(true);
  const detailRef = useRef<HTMLDivElement>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { playlistUrl, isLoaded } = usePlaylistUrl();

  useEffect(() => {
    if (!id || !isLoaded) return;
    if (!playlistUrl) {
      setError('Playlist URL is required. Please set it in settings.');
      setLoading(false);
      return;
    }
    fetch(`/api/movies/info?vod_id=${id}&playlistUrl=${encodeURIComponent(playlistUrl)}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: XtreamVodInfo) => setInfo(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, playlistUrl, isLoaded]);

  const play = useCallback(() => setPlaying(true), []);

  if (loading) return <Skeleton />;

  if (error || !info) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center gap-4 text-white">
        <Film size={40} className="text-gray-700" />
        <p className="text-gray-400">{error ?? 'الفيلم غير موجود'}</p>
        <button onClick={() => router.back()}
          className="px-6 py-2.5 bg-white text-black font-bold rounded hover:bg-white/85 transition">
          رجوع
        </button>
      </div>
    );
  }

  const { info: m, movie_data: md } = info;

  // ── derived values ──────────────────────────────────────────────────────────
  const title      = m.name || md.name;
  const plot       = m.plot || m.description || '';
  const backdrop   = m.backdrop_path?.[0] ?? null;
  const poster     = m.cover_big || m.movie_image || null;
  const heroImg    = backdrop || poster;
  const year       = m.releasedate?.slice(0, 4) ?? '';
  const duration   = m.duration ?? (m.episode_run_time ? `${m.episode_run_time} دقيقة` : '');
  const rating     = parseFloat(m.rating ?? '0');
  const genres     = m.genre ? m.genre.split(',').map(g => g.trim()).filter(Boolean) : [];
  const actors     = (m.cast || m.actors || '').split(',').map(a => a.trim()).filter(Boolean);
  const streamUrl  = buildStreamUrl(md.stream_id, playlistUrl || '', md.container_extension || 'mkv');
  const resolution = resolveResolution(m.video?.width, m.video?.height);
  const fps        = m.video?.r_frame_rate ? formatFrameRate(m.video.r_frame_rate) : null;
  const audioLang  = m.audio?.tags?.title || m.audio?.tags?.language || null;
  const addedDate  = md.added
    ? new Date(parseInt(md.added) * 1000).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  const matchScore = rating > 0 ? Math.round((rating / 10) * 100) : null;

  return (
    <div className="bg-[#141414] min-h-screen text-white overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-[70vh] sm:h-[80vh] md:h-screen min-h-[500px] md:min-h-[600px]">

        {/* Backdrop */}
        {heroImg && (
          <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt="" aria-hidden
              className={`w-full h-full object-cover object-center
                         transition-opacity duration-1000 select-none
                         ${bgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setBgLoaded(true)}
            />
            {/* gradients — same as Netflix */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-[#141414]/20" />
            <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-56
                            bg-gradient-to-t from-[#141414] to-transparent" />
          </div>
        )}

        {/* Back */}
        <button onClick={() => router.back()} aria-label="رجوع"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 p-2 sm:p-2.5 rounded-full
                     bg-black/40 hover:bg-white/10 backdrop-blur-sm transition">
          <ArrowLeft size={20} />
        </button>

        {/* Mute toggle */}
        <button onClick={() => setMuted(v => !v)} aria-label="كتم"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full
                     border border-gray-500 hover:border-white
                     bg-black/30 hover:bg-white/10 flex items-center justify-center transition">
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Hero content */}
        <div className="absolute bottom-[12vh] sm:bottom-[14vh] md:bottom-[16vh] left-0 px-4 sm:px-8 md:px-16 max-w-full md:max-w-[680px]">

          {/* Match badge */}
          {matchScore !== null && (
            <p className={`text-sm sm:text-base font-bold mb-2 ${
              matchScore >= 70 ? 'text-green-400' : matchScore >= 50 ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {matchScore}% تطابق
            </p>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-2 sm:mb-3
                         drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {title}
          </h1>
          {m.o_name && m.o_name !== title && (
            <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 -mt-1">{m.o_name}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">
            {year && <span>{year}</span>}
            {duration && (
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-gray-500" />{duration}
              </span>
            )}
            {m.country && (
              <span className="flex items-center gap-1">
                <Globe size={12} className="text-gray-500" />{m.country}
              </span>
            )}
            {rating > 0 && (
              <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                <Star size={12} className="fill-yellow-400" />{rating.toFixed(1)}
              </span>
            )}
            {genres.slice(0, 3).map(g => (
              <span key={g} className="text-gray-500">• {g}</span>
            ))}
          </div>

          {/* Plot preview */}
          {plot && (
            <p className="text-gray-200 text-xs sm:text-sm md:text-[15px] leading-relaxed line-clamp-3 mb-4 sm:mb-5
                          drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
              {plot}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button onClick={play}
              className="flex items-center gap-2 sm:gap-2.5 px-5 sm:px-7 py-2.5 sm:py-3 rounded
                         bg-white text-black font-bold text-sm sm:text-[15px]
                         hover:bg-white/85 active:scale-95 transition-all shadow-lg shrink-0">
              <Play size={20} fill="black" />
              تشغيل
            </button>

            {/* Trailer button — only if we have a YouTube ID */}
            {m.youtube_trailer && (
              <button onClick={() => setTrailer(true)}
                className="flex items-center gap-2 sm:gap-2.5 px-5 sm:px-7 py-2.5 sm:py-3 rounded
                           bg-white/15 hover:bg-white/25 backdrop-blur-sm
                           border border-white/20 hover:border-white/40
                           font-bold text-sm sm:text-[15px] active:scale-95 transition-all shrink-0">
                <Play size={20} className="text-white" />
                الترايلر
              </button>
            )}

            <button aria-label="أضف للمفضلة"
              onClick={() => info && toggleFavorite({
                id: md.stream_id,
                name: title,
                cover: poster || backdrop || '',
                type: 'movie',
                category_id: md.category_id,
                container_extension: md.container_extension,
              })}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full
                         border-2 transition shrink-0
                         ${isFavorite(parseInt(id), 'movie')
                           ? 'border-red-500 bg-red-500/20 text-red-500'
                           : 'border-gray-500 hover:border-red-400 bg-black/40 hover:bg-red-500/10 text-gray-400 hover:text-red-400'}`}>
              <Heart size={20} fill={isFavorite(parseInt(id), 'movie') ? 'currentColor' : 'none'} />
            </button>

            <button aria-label="أعجبني"
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full
                         border-2 border-gray-500 hover:border-white
                         bg-black/40 hover:bg-white/10 transition shrink-0">
              <ThumbsUp size={18} />
            </button>

            {/* TMDB link */}
            {m.tmdb_url && (
              <a href={m.tmdb_url} target="_blank" rel="noopener noreferrer"
                className="ml-1 flex items-center gap-1.5 text-xs text-gray-400
                           hover:text-white transition">
                <ExternalLink size={13} />
                TMDB
              </a>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <button onClick={() => detailRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2
                     flex flex-col items-center gap-1 text-gray-500 hover:text-white
                     transition animate-bounce">
          <span className="text-[10px] uppercase tracking-widest">تفاصيل</span>
          <ChevronDown size={16} />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DETAILS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div ref={detailRef} className="px-4 sm:px-6 md:px-16 py-8 sm:py-14 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 sm:gap-8 lg:gap-10">

          {/* ── Left column: poster + tech specs ── */}
          <div className="space-y-6">

            {/* Poster */}
            {poster && (
              <div className="rounded-lg overflow-hidden shadow-2xl shadow-black/70
                              border border-white/5 aspect-[2/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={poster} alt={title}
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            {/* Quick facts card */}
            <div className="bg-[#1c1c1c] rounded-xl p-4 border border-white/5">
              <SectionTitle>معلومات سريعة</SectionTitle>
              <div className="divide-y divide-white/5 text-sm">
                {year && <Spec label="سنة الإصدار" value={year} />}
                {m.releasedate && m.releasedate.length > 4 && (
                  <Spec label="تاريخ الإصدار" value={
                    new Date(m.releasedate).toLocaleDateString('ar-EG', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })
                  } />
                )}
                {duration && <Spec label="المدة" value={duration} />}
                {m.country && <Spec label="البلد" value={m.country} />}
                {m.genre && <Spec label="التصنيف" value={m.genre} />}
                {rating > 0 && <Spec label="التقييم" value={`${rating.toFixed(1)} / 10`} />}
                {m.mpaa_rating && m.mpaa_rating !== '0' && (
                  <Spec label="تقييم MPAA" value={m.mpaa_rating} />
                )}
                {m.age && m.age !== '0' && m.age !== '' && (
                  <Spec label="الفئة العمرية" value={`+${m.age}`} />
                )}
                {addedDate && <Spec label="أُضيف في" value={addedDate} />}
                {m.tmdb_id && <Spec label="TMDB ID" value={m.tmdb_id} />}
              </div>
            </div>

            {/* Video specs card */}
            {(m.video || m.audio || m.bitrate) && (
              <div className="bg-[#1c1c1c] rounded-xl p-4 border border-white/5">
                <SectionTitle>المواصفات التقنية</SectionTitle>

                {/* Video */}
                {m.video && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Tv2 size={13} className="text-gray-500" />
                      <span className="text-xs text-gray-500 uppercase tracking-wider">فيديو</span>
                    </div>
                    <div className="divide-y divide-white/5 text-sm">
                      {m.video.codec_name && (
                        <Spec label="الكودك" value={m.video.codec_name.toUpperCase()} />
                      )}
                      {resolution && <Spec label="الدقة" value={resolution} />}
                      {fps && <Spec label="معدل الإطارات" value={fps} />}
                      {m.video.pix_fmt && (
                        <Spec label="صيغة البكسل" value={m.video.pix_fmt} />
                      )}
                      {m.video.tags?.BPS && (
                        <Spec label="بيترات الفيديو"
                          value={formatBitrate(parseInt(m.video.tags.BPS))} />
                      )}
                    </div>
                  </div>
                )}

                {/* Audio */}
                {m.audio && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mic size={13} className="text-gray-500" />
                      <span className="text-xs text-gray-500 uppercase tracking-wider">صوت</span>
                    </div>
                    <div className="divide-y divide-white/5 text-sm">
                      {m.audio.codec_name && (
                        <Spec label="الكودك" value={m.audio.codec_name.toUpperCase()} />
                      )}
                      {m.audio.sample_rate && (
                        <Spec label="معدل الأخذ" value={`${parseInt(m.audio.sample_rate) / 1000} kHz`} />
                      )}
                      {m.audio.channel_layout && (
                        <Spec label="القنوات" value={m.audio.channel_layout} />
                      )}
                      {audioLang && <Spec label="اللغة" value={audioLang} />}
                      {m.audio.tags?.BPS && (
                        <Spec label="بيترات الصوت"
                          value={formatBitrate(parseInt(m.audio.tags.BPS))} />
                      )}
                    </div>
                  </div>
                )}

                {/* Overall bitrate */}
                {m.bitrate && m.bitrate > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <Zap size={13} className="text-gray-500" />
                    <span className="text-xs text-gray-500">البيترات الكلي:</span>
                    <span className="text-xs text-gray-300 font-medium">
                      {formatBitrate(m.bitrate)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Play CTA on mobile */}
            <button onClick={play}
              className="flex lg:hidden items-center justify-center gap-2 w-full py-3.5 rounded
                         bg-white text-black font-bold text-base
                         hover:bg-white/85 active:scale-95 transition-all">
              <Play size={20} fill="black" />
              تشغيل الفيلم
            </button>
          </div>

          {/* ── Right column: full story + cast ── */}
          <div className="space-y-10">

            {/* Title + genres */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-3xl font-bold">{title}</h2>
                  {m.o_name && m.o_name !== title && (
                    <p className="text-gray-500 text-sm mt-1">{m.o_name}</p>
                  )}
                </div>

                {/* Play button desktop */}
                <button onClick={play}
                  className="hidden lg:flex items-center gap-2 px-7 py-3 rounded shrink-0
                             bg-white text-black font-bold text-base
                             hover:bg-white/85 active:scale-95 transition-all">
                  <Play size={20} fill="black" />
                  تشغيل
                </button>
              </div>

              {/* Genre tags */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {genres.map(g => <Tag key={g}>{g}</Tag>)}
                </div>
              )}

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mt-3">
                {matchScore !== null && (
                  <Badge color={matchScore >= 70 ? 'green' : matchScore >= 50 ? 'yellow' : 'gray'}>
                    <Star size={11} className="fill-current" />
                    {matchScore}% تطابق
                  </Badge>
                )}
                {resolution && (
                  <Badge color="blue">
                    <Tv2 size={11} />
                    {resolution}
                  </Badge>
                )}
                {audioLang && (
                  <Badge color="gray">
                    <Mic size={11} />
                    {audioLang}
                  </Badge>
                )}
                {md.container_extension && (
                  <Badge color="gray">
                    <Film size={11} />
                    .{md.container_extension.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>

            {/* Plot */}
            {plot && (
              <div>
                <SectionTitle>القصة</SectionTitle>
                <p className={`text-gray-300 leading-relaxed text-[15px] ${
                  showPlot ? '' : 'line-clamp-5'
                }`}>
                  {plot}
                </p>
                {plot.length > 350 && (
                  <button onClick={() => setShowPlot(v => !v)}
                    className="mt-2.5 flex items-center gap-1 text-xs text-gray-500
                               hover:text-white transition">
                    {showPlot ? 'أقل' : 'اقرأ أكثر'}
                    <ChevronDown size={13}
                      className={`transition-transform ${showPlot ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            )}

            {/* Director */}
            {m.director && (
              <div>
                <SectionTitle>المخرج</SectionTitle>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/8 border border-white/10
                                  flex items-center justify-center shrink-0">
                    <Clapperboard size={16} className="text-gray-400" />
                  </div>
                  <p className="text-gray-200 font-medium">{m.director}</p>
                </div>
              </div>
            )}

            {/* Cast */}
            {actors.length > 0 && (
              <div>
                <SectionTitle>طاقم التمثيل ({actors.length})</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {actors.map(a => <ActorChip key={a} name={a} />)}
                </div>
              </div>
            )}

            {/* Backdrop images strip */}
            {(m.backdrop_path?.length ?? 0) > 1 && (
              <div>
                <SectionTitle>صور من الفيلم</SectionTitle>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {m.backdrop_path!.map((src) => (
                    <div key={src}
                      className="shrink-0 w-64 aspect-video rounded-lg overflow-hidden
                                 border border-white/8 bg-[#1c1c1c]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="صورة من الفيلم"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TMDB link */}
            {m.tmdb_url && (
              <div>
                <SectionTitle>روابط خارجية</SectionTitle>
                <a href={m.tmdb_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
                             bg-[#1c1c1c] border border-white/8 text-sm text-gray-300
                             hover:bg-white/10 hover:border-white/20 transition">
                  <ExternalLink size={14} />
                  عرض على TMDB
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          PLAYER overlay
      ═══════════════════════════════════════════════════════════════════════ */}
      {playing && <Player src={streamUrl} onBack={() => setPlaying(false)} />}

      {/* ═══════════════════════════════════════════════════════════════════════
          TRAILER modal
      ═══════════════════════════════════════════════════════════════════════ */}
      {trailer && m.youtube_trailer && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-label="ترايلر الفيلم"
        >
          {/* backdrop — click to close */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setTrailer(false)}
          />

          {/* modal box */}
          <div className="relative w-full max-w-4xl z-10">
            {/* close button */}
            <button
              onClick={() => setTrailer(false)}
              aria-label="إغلاق الترايلر"
              className="absolute -top-12 right-0 p-2 text-gray-400
                         hover:text-white transition"
            >
              <X size={28} />
            </button>

            {/* title bar */}
            <div className="flex items-center gap-3 mb-3">
              <Play size={16} className="text-red-500" fill="currentColor" />
              <p className="text-sm font-semibold text-gray-200">
                ترايلر — {title}
              </p>
            </div>

            {/* 16:9 iframe */}
            <div className="w-full aspect-video rounded-xl overflow-hidden
                            shadow-2xl shadow-black border border-white/10 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${m.youtube_trailer}?autoplay=1&rel=0&modestbranding=1`}
                title={`ترايلر ${title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
