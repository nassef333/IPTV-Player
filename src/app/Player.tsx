'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Hls from 'hls.js';

interface PlayerProps {
  src: string;
  onBack: () => void;
  /** When true the player fills its parent container instead of covering the whole screen */
  inline?: boolean;
}

export default function Player({ src, onBack, inline = false }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Register media-chrome web components on the client side
  useEffect(() => {
    import('media-chrome');
  }, []);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // HLS / native video setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    console.log('Player src:', src);

    const isHls =
      src.includes('.m3u8') ||
      src.includes('type=m3u') ||
      src.includes('mpegts');

    console.log('Is HLS:', isHls, 'HLS supported:', Hls.isSupported());

    if (isHls && Hls.isSupported()) {
      // Clean up any previous hls instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        enableWorker: true,
        debug: true,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed');
        video.play().then(() => {
          // Unmute after successful autoplay
          video.muted = false;
        }).catch((err) => {
          console.log('Autoplay blocked:', err);
          /* autoplay blocked — user can press play */
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, retrying...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, recovering...');
              hls.recoverMediaError();
              break;
            default:
              console.log('Fatal error, destroying HLS');
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      console.log('Using native HLS');
      video.src = src;
      video.play().then(() => {
        video.muted = false;
      }).catch(() => {});
    } else {
      // Plain MP4 or other formats
      console.log('Using plain video src');
      video.src = src;
      video.play().then(() => {
        video.muted = false;
      }).catch(() => {});
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
  }, [src]);

  return (
    <div className={
      inline
        ? 'relative w-full h-full bg-black flex flex-col items-center justify-center'
        : 'fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center'
    }>
      {/* Back button — only in overlay mode */}
      {!inline && (
        <button
          onClick={onBack}
          aria-label="Close player"
          className="absolute top-6 left-6 z-[110] flex items-center gap-2 text-white bg-black/50 hover:bg-white/20 rounded-full p-2 transition-all"
        >
          <X size={28} />
        </button>
      )}

      {/* media-controller wraps the video */}
      <media-controller class="w-full h-full">
        <video
          ref={videoRef}
          slot="media"
          playsInline
          crossOrigin="anonymous"
          autoPlay
          muted
          className="w-full h-full object-contain"
        />
        <media-loading-indicator slot="centered-chrome" />
        <media-control-bar>
          <media-play-button />
          <media-seek-backward-button seekoffset="10" />
          <media-seek-forward-button seekoffset="10" />
          <media-mute-button />
          <media-volume-range />
          <media-time-range />
          <media-time-display showduration />
          <media-fullscreen-button />
        </media-control-bar>
      </media-controller>
    </div>
  );
}
