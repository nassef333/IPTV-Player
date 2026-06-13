// Xtream Codes API client

const DEFAULT_BASE_URL = process.env.XTREAM_BASE_URL || '';
const DEFAULT_USERNAME = process.env.XTREAM_USERNAME || '';
const DEFAULT_PASSWORD = process.env.XTREAM_PASSWORD || '';

export const API_BASE = DEFAULT_BASE_URL && DEFAULT_USERNAME && DEFAULT_PASSWORD 
  ? `${DEFAULT_BASE_URL}/player_api.php?username=${DEFAULT_USERNAME}&password=${DEFAULT_PASSWORD}`
  : '';
export const STREAM_BASE = DEFAULT_BASE_URL || '';

// Dynamic credentials support
let currentBaseUrl = DEFAULT_BASE_URL;
let currentUsername = DEFAULT_USERNAME;
let currentPassword = DEFAULT_PASSWORD;

export function setXtreamCredentials(baseUrl: string, username: string, password: string) {
  currentBaseUrl = baseUrl;
  currentUsername = username;
  currentPassword = password;
}

export function getApiBase(customBaseUrl?: string, customUsername?: string, customPassword?: string) {
  const baseUrl = customBaseUrl || currentBaseUrl;
  const username = customUsername || currentUsername;
  const password = customPassword || currentPassword;
  return `${baseUrl}/player_api.php?username=${username}&password=${password}`;
}

export function getStreamBase(customBaseUrl?: string) {
  return customBaseUrl || currentBaseUrl;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  icon: string | null;
  parent_id: number;
  is_adult: number;
  stream_count?: number;
}

export interface XtreamLiveStream {
  num: number;
  name: string;
  stream_type: 'live';
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string | null;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface XtreamVodStream {
  num: number;
  name: string;
  stream_type: 'movie';
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface XtreamSeriesStream {
  series_id: number;
  name: string;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export interface XtreamVodInfo {
  info: {
    tmdb_id?: string;
    tmdb_url?: string;
    name: string;
    o_name?: string;
    cover_big?: string;
    movie_image?: string;
    releasedate?: string;
    episode_run_time?: string;
    director?: string;
    actors?: string;
    cast?: string;
    description?: string;
    plot?: string;
    genre?: string;
    country?: string;
    duration?: string;
    duration_secs?: number;
    rating?: string;
    age?: string;
    mpaa_rating?: string;
    backdrop_path?: string[];
    youtube_trailer?: string;
    bitrate?: number;
    rating_count_kinopoisk?: number;
    video?: {
      codec_name?: string;
      width?: number;
      height?: number;
      r_frame_rate?: string;
      pix_fmt?: string;
      profile?: string;
      tags?: { BPS?: string; DURATION?: string };
    };
    audio?: {
      codec_name?: string;
      sample_rate?: string;
      channels?: number;
      channel_layout?: string;
      tags?: { language?: string; title?: string; BPS?: string };
    };
  };
  movie_data: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
    custom_sid?: string;
    direct_source?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(action: string, extra = '', customBaseUrl?: string, customUsername?: string, customPassword?: string): Promise<T> {
  const apiBase = getApiBase(customBaseUrl, customUsername, customPassword);
  const url = `${apiBase}&action=${action}${extra}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Xtream API error: ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Live TV ──────────────────────────────────────────────────────────────────

export function getLiveCategories(customBaseUrl?: string, customUsername?: string, customPassword?: string): Promise<XtreamCategory[]> {
  return apiFetch<XtreamCategory[]>('get_live_categories', '', customBaseUrl, customUsername, customPassword);
}

export function getLiveStreams(categoryId?: string, customBaseUrl?: string, customUsername?: string, customPassword?: string): Promise<XtreamLiveStream[]> {
  const extra = categoryId ? `&category_id=${categoryId}` : '';
  return apiFetch<XtreamLiveStream[]>('get_live_streams', extra, customBaseUrl, customUsername, customPassword);
}

/** Build HLS stream URL for a live channel */
export function getLiveStreamUrl(streamId: number, customBaseUrl?: string, customUsername?: string, customPassword?: string): string {
  const baseUrl = customBaseUrl || currentBaseUrl;
  const username = customUsername || currentUsername;
  const password = customPassword || currentPassword;
  return `${baseUrl}/live/${username}/${password}/${streamId}.m3u8`;
}

// ─── Movies (VOD) ─────────────────────────────────────────────────────────────

export function getVodCategories(customBaseUrl?: string, customUsername?: string, customPassword?: string): Promise<XtreamCategory[]> {
  return apiFetch<XtreamCategory[]>('get_vod_categories', '', customBaseUrl, customUsername, customPassword);
}

export function getVodStreams(categoryId?: string, customBaseUrl?: string, customUsername?: string, customPassword?: string): Promise<XtreamVodStream[]> {
  const extra = categoryId ? `&category_id=${categoryId}` : '';
  return apiFetch<XtreamVodStream[]>('get_vod_streams', extra, customBaseUrl, customUsername, customPassword);
}

export function getVodInfo(vodId: number, customBaseUrl?: string, customUsername?: string, customPassword?: string): Promise<XtreamVodInfo> {
  return apiFetch<XtreamVodInfo>('get_vod_info', `&vod_id=${vodId}`, customBaseUrl, customUsername, customPassword);
}

/** Build direct stream URL for a VOD */
export function getVodStreamUrl(streamId: number, ext = 'mkv', customBaseUrl?: string, customUsername?: string, customPassword?: string): string {
  const baseUrl = customBaseUrl || currentBaseUrl;
  const username = customUsername || currentUsername;
  const password = customPassword || currentPassword;
  return `${baseUrl}/movie/${username}/${password}/${streamId}.${ext}`;
}

// ─── Series ───────────────────────────────────────────────────────────────────

export function getSeriesCategories(customBaseUrl?: string, customUsername?: string, customPassword?: string): Promise<XtreamCategory[]> {
  return apiFetch<XtreamCategory[]>('get_series_categories', '', customBaseUrl, customUsername, customPassword);
}

export function getSeries(categoryId?: string, customBaseUrl?: string, customUsername?: string, customPassword?: string): Promise<XtreamSeriesStream[]> {
  const extra = categoryId ? `&category_id=${categoryId}` : '';
  return apiFetch<XtreamSeriesStream[]>('get_series', extra, customBaseUrl, customUsername, customPassword);
}

export interface XtreamSeriesEpisodeInfo {
  tmdb_id?: number;
  releasedate?: string;
  plot?: string;
  duration_secs?: number;
  duration?: string;
  movie_image?: string;
  rating?: number;
  season?: string;
}

export interface XtreamSeriesEpisode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: XtreamSeriesEpisodeInfo;
  custom_sid: string;
  added: string;
  season: number;
  direct_source: string;
}

export interface XtreamSeriesSeason {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  season_number: number;
  vote_average: number;
  cover: string;
  cover_big: string;
}

export interface XtreamSeriesInfo {
  seasons: XtreamSeriesSeason[];
  info: {
    name: string;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    last_modified: string;
    rating: string;
    rating_5based: number;
    backdrop_path: string[];
    youtube_trailer: string;
    episode_run_time: string;
    category_id: string;
  };
  // episodes keyed by season number (as string)
  episodes: Record<string, XtreamSeriesEpisode[]>;
}

export function getSeriesInfo(seriesId: number, customBaseUrl?: string, customUsername?: string, customPassword?: string): Promise<XtreamSeriesInfo> {
  return apiFetch<XtreamSeriesInfo>('get_series_info', `&series_id=${seriesId}`, customBaseUrl, customUsername, customPassword);
}

/** Build direct stream URL for a series episode */
export function getSeriesStreamUrl(episodeId: string, ext = 'mp4', customBaseUrl?: string, customUsername?: string, customPassword?: string): string {
  const baseUrl = customBaseUrl || currentBaseUrl;
  const username = customUsername || currentUsername;
  const password = customPassword || currentPassword;
  return `${baseUrl}/series/${username}/${password}/${episodeId}.${ext}`;
}
