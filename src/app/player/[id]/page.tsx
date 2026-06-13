'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Channel } from '@/types';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Heart } from 'lucide-react';
import Hls from 'hls.js';
import { useFavorites } from '@/lib/useFavorites';

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = decodeURIComponent(params.id as string);

  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  // channel.id is a string — derive a stable numeric key for the favorites store
  const channelNumId = useCallback((cid: string) => {
    const n = parseInt(cid, 10);
    if (!isNaN(n)) return n;
    // simple djb2 hash for non-numeric ids
    let h = 5381;
    for (let i = 0; i < cid.length; i++) h = ((h << 5) + h) ^ cid.charCodeAt(i);
    return h >>> 0; // unsigned 32-bit
  }, []);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const response = await fetch('/api/channels');
        if (!response.ok) throw new Error('Failed to fetch channels');
        const data = await response.json();
        const found = (data.channels as Channel[]).find((c) => c.id === channelId);
        setChannel(found ?? null);
      } catch (err) {
        console.error('Error fetching channel:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannel();
  }, [channelId]);

  // Set up HLS or native video once we have the channel
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    const src = channel.url;
    const isHls =
      src.includes('.m3u8') ||
      src.includes('type=m3u') ||
      src.includes('mpegts');

    if (isHls && Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy();
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setPlaying(true)).catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.src = src;
      video.play().then(() => setPlaying(true)).catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, [channel]);

  // Sync volume/mute state to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted;
  }, [volume, muted]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch((err) =>
        console.error('Fullscreen request failed:', err)
      );
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-xl">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl mb-4">القناة غير موجودة</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white hover:text-red-500 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-semibold">عودة</span>
          </button>
          <h1 className="text-xl font-bold text-red-600">IPTV</h1>
        </div>
      </header>

      {/* Player Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black cursor-pointer"
        onMouseMove={resetControlsTimer}
        onMouseLeave={() => setShowControls(false)}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          crossOrigin="anonymous"
        />

        {/* Custom Controls Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Channel Info */}
          <div className="absolute top-20 left-6 right-6">
            <div className="flex items-center gap-4">
              {channel.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-16 h-16 object-contain rounded-lg"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div>
                <h2 className="text-2xl font-bold text-white">{channel.name}</h2>
                <p className="text-gray-400">{channel.group}</p>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  aria-label={playing ? 'Pause' : 'Play'}
                  className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                >
                  {playing ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-1" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMuted((m) => !m)}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                    className="text-white hover:text-red-400 transition-colors"
                  >
                    {muted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (v > 0) setMuted(false);
                    }}
                    className="w-24 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleFullscreen}
                  aria-label="Fullscreen"
                  className="w-10 h-10 flex items-center justify-center text-white hover:text-red-500 transition-colors"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Info Panel */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">معلومات القناة</h3>
            <button
              aria-label="أضف للمفضلة"
              onClick={() => channel && toggleFavorite({
                id: channelNumId(channel.id),
                name: channel.name,
                cover: channel.logo || '',
                type: 'live',
                category_id: channel.group || '',
              })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition
                ${channel && isFavorite(channelNumId(channel.id), 'live')
                  ? 'border-red-500 bg-red-500/15 text-red-400'
                  : 'border-gray-600 bg-white/5 text-gray-400 hover:border-red-400 hover:text-red-400 hover:bg-red-500/10'}`}
            >
              <Heart
                size={16}
                fill={channel && isFavorite(channelNumId(channel.id), 'live') ? 'currentColor' : 'none'}
              />
              {channel && isFavorite(channelNumId(channel.id), 'live') ? 'في المفضلة' : 'أضف للمفضلة'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 mb-1">اسم القناة</p>
              <p className="text-white font-semibold">{channel.name}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">المجموعة</p>
              <p className="text-white font-semibold">{channel.group}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">النوع</p>
              <p className="text-white font-semibold capitalize">{channel.type}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">الحالة</p>
              <p className="text-green-500 font-semibold">متاح</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
