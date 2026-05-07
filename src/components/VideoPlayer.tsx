"use client";

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import Hls from 'hls.js';
import { getVideoInfo, VideoInfo } from '@/lib/videoUtils';

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  isReady: () => boolean;
}

interface VideoPlayerProps {
  url: string;
  poster?: string;
  isActive: boolean;
  isMuted: boolean;
  onReady?: () => void;
  onError?: () => void;
  onLoadingStart?: () => void;
  className?: string;
  videoId?: string;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  url,
  poster,
  isActive,
  isMuted,
  onReady,
  onError,
  onLoadingStart,
  className = "",
  videoId
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize HLS config to prevent recreation
  const hlsConfig = useMemo(() => ({
    enableWorker: true,
    lowLatencyMode: false, // Disable for better performance
    maxBufferLength: 6,
    maxMaxBufferLength: 12,
    maxBufferSize: 60 * 1000 * 1000, // 60MB
    maxBufferHole: 0.5,
    highBufferWatchdogPeriod: 2,
    nudgeOffset: 0.1,
    nudgeMaxRetry: 3,
    maxFragLookUpTolerance: 0.25,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: Infinity,
    liveDurationInfinity: true,
    preferManagedMediaSource: true,
    backBufferLength: Infinity,
  }), []);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !url || !isActive) return;

    const isHls = /\.m3u8(\?.*)?$/i.test(url);
    if (!isHls) return;

    setHasError(false);
    setIsLoading(true);
    onLoadingStart?.();

    // Clean up previous HLS instance
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // ignore
      }
      hlsRef.current = null;
    }

    // Check native HLS support first
    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = url;
      return;
    }

    if (!Hls.isSupported()) {
      setHasError(true);
      setIsLoading(false);
      onError?.();
      return;
    }

    const hls = new Hls(hlsConfig);
    hlsRef.current = hls;

    hls.loadSource(url);
    hls.attachMedia(videoEl);

    const handleHlsError = (_event: unknown, data: any) => {
      if (data?.fatal) {
        setHasError(true);
        setIsLoading(false);
        onError?.();
        try {
          hls.destroy();
          hlsRef.current = null;
        } catch {
          // ignore
        }
      }
    };

    hls.on(Hls.Events.ERROR, handleHlsError);

    return () => {
      try {
        hls.off(Hls.Events.ERROR, handleHlsError);
        hls.destroy();
        hlsRef.current = null;
      } catch {
        // ignore
      }
    };
  }, [url, isActive, onError, hlsConfig]);

  // Get video info on mount
  useEffect(() => {
    const info = getVideoInfo(url);
    setVideoInfo(info);
  }, [url]);

  // Handle muting and volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Expose controls to parent
  useImperativeHandle(ref, () => ({
    play: () => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {
          // Autoplay may be blocked by the browser; ignore and let the UI handle user interaction.
        });
      }
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    },
    setMuted: (muted: boolean) => {
      if (videoRef.current) {
        videoRef.current.muted = muted;
      }
    },
    setPlaybackRate: (rate: number) => {
      if (videoRef.current) {
        videoRef.current.playbackRate = rate;
      }
    },
    isReady: () => videoRef.current ? videoRef.current.readyState >= 2 : false,
  }));

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          // ignore
        }
        hlsRef.current = null;
      }
    };
  }, []);

  // For direct video URLs, use them directly without YouTube iframe
  if (url && url.includes('http') && !url.includes('youtube.com/embed/')) {
    const isHls = /\.m3u8(\?.*)?$/i.test(url);
    return (
      <video
        ref={videoRef}
        className={className}
        poster={poster}
        playsInline
        loop
        controls={false}
        preload={isActive ? "metadata" : "none"}
        onLoadStart={() => {
          setIsLoading(true);
          onLoadingStart?.();
        }}
        onLoadedMetadata={() => {
          setIsLoading(false);
          onReady?.();
        }}
        onCanPlay={() => {
          setIsLoading(false);
          onReady?.();
        }}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
          onError?.();
        }}
        muted={isMuted}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      >
        {!isHls && <source src={url} />}
        Your browser does not support the video tag.
      </video>
    );
  }

  // For YouTube videos, use iframe
  if (videoInfo?.canEmbed) {
    return (
      <iframe
        src={videoInfo.embedUrl}
        className={`w-full h-full ${className}`}
        style={{ 
          border: 'none',
          pointerEvents: 'auto'
        }}
        allowFullScreen
        onLoad={() => {
          onReady?.();
        }}
        onError={onError}
      />
    );
  }

  // Fallback for error state
  if (hasError) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center p-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5z" />
            </svg>
          </div>
          <p className="text-white/70 text-sm">Video cannot be played</p>
          <p className="text-white/50 text-xs mt-1">Unsupported format or blocked content</p>
        </div>
      </div>
    );
  }

  return null; // Return null for non-video URLs or error states
});

VideoPlayer.displayName = 'VideoPlayer';
