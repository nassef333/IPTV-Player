'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import 'media-chrome';
import Hls from 'hls.js'; // Import Hls

interface PlayerProps {
  src: string;
  onBack: () => void;
}

export default function Player({ src, onBack }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null); // Ref for Hls instance

  // Handle escape key to exit the player
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      if (Hls.isSupported() && src.includes('.m3u8')) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('fatal network error encountered, try to recover', data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('fatal media error encountered, try to recover', data);
                hls.recoverMediaError();
                break;
              default:
                console.error('fatal error encountered, cannot recover', data);
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('video/mp4')) {
        // Native HLS support (Safari) or MP4
        video.src = src;
      } else {
        console.error('This browser does not support HLS or the video format.');
      }

      // Play video automatically if not already playing
      video.play().catch(error => {
        console.warn("Autoplay was prevented:", error);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.src = ''; // Clear source on unmount
        videoRef.current.load();
      }
    };
  }, [src]); // Re-run effect if src changes

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-300">
      {/* Navigation Overlay */}
      <div className="absolute top-0 left-0 right-0 p-8 z-[60] bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <button
          onClick={onBack}
          className="pointer-events-auto flex items-center gap-2 text-white hover:text-gray-300 transition-colors group"
        >
          <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-all">
            <X size={28} /> Back to Browse
          </div>
        </button>
      </div>

      {/* Media Chrome Player */}
      <media-controller className="w-full h-full">
        <video
          ref={videoRef}
          slot="media"
          autoPlay
          crossOrigin="anonymous"
          playsInline
          className="w-full h-full object-contain"
        />

        <media-loading-indicator slot="centered-chrome" className="text-white" />

        {/* Controls Overlay */}
        <media-control-bar className="w-full px-6 py-4 flex gap-4 items-center bg-gradient-to-t from-black/90 to-transparent">
          <media-play-button />
          <media-seek-backward-button seekoffset="10" />
          <media-seek-forward-button seekoffset="10" />
          <media-mute-button />
          <media-volume-range />
          <media-time-range className="flex-1" />
          <media-time-display showduration />
          <media-fullscreen-button />
        </media-control-bar>
      </media-controller>
    </div>
  );
}