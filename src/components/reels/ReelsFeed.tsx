"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Reel, Pagination } from "@/types";
import { Volume2, VolumeX, Heart, Share2, Bookmark, X, Grid3X3, Play, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { shareContent } from "@/lib/utils";
import { viewReel, likeReel, fetchReels } from "@/lib/api";
import dynamic from "next/dynamic";
import { VideoPlayer, VideoPlayerRef } from "@/components/VideoPlayer";
import { getVideoInfo } from "@/lib/videoUtils";
import { NotificationBanner } from "@/components/NotificationBanner";


function ReelsFeedContent({ initialReels }: { initialReels: Reel[] & { pagination?: Pagination } }) {
  const [reels, setReels] = useState<(Reel & { isAd?: boolean })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [allReels, setAllReels] = useState<Reel[]>([]);
  const [displayedReels, setDisplayedReels] = useState<Reel[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [savedReels, setSavedReels] = useState<Reel[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' | 'error' } | null>(null);
  const PAGE_SIZE = 1000; // Reduced for better performance
  const containerRef = useRef<HTMLDivElement>(null);
  const inFlightPages = useRef<Set<number>>(new Set());
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [targetId, setTargetId] = useState<string | null>(null);

  useEffect(() => {
    const idFromQuery = searchParams.get('id');
    if (idFromQuery) {
      setTargetId(idFromQuery);
      try {
        sessionStorage.setItem('target-reel-id', idFromQuery);
      } catch {
        // ignore
      }
      return;
    }

    try {
      const idFromSession = sessionStorage.getItem('target-reel-id');
      if (idFromSession) setTargetId(idFromSession);
    } catch {
      // ignore
    }
  }, [searchParams]);

  // Load saved reels from localStorage only (no API calls)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('saved-reels');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedReels(parsed);
      }
    } catch (error) {
      console.error('Failed to load saved reels:', error);
    }
  }, []);

  // Memoize displayed reels calculation
  const processedReels = useMemo(() => {
    let list: Reel[];

    if (savedReels.length > 0) {
      const uniqueSavedReels = savedReels.filter(saved =>
        !initialReels.some(reel => reel.id === saved.id)
      );
      list = [...uniqueSavedReels, ...initialReels];
    } else {
      list = initialReels;
    }

    list = list.filter(r => r.videoUrl);

    list = list.map(reel => ({
      ...reel,
      thumbnailUrl: reel.thumbnailUrl || '/static/placeholder-reel.jpg'
    }));

    if (targetId) {
      const targetReel = list.find(r => r.id === targetId);
      const remaining = list.filter(r => r.id !== targetId);
      if (targetReel) list = [targetReel, ...remaining];
      else list = remaining;
    }

    return list;
  }, [initialReels, targetId, savedReels]);

  // Update displayed reels with pagination and ads
  const reelsWithAds = useMemo(() => {
    const endIndex = page * PAGE_SIZE;
    const currentBatch = processedReels.slice(0, endIndex);

    const listWithAds: any[] = [];
    currentBatch.forEach((item, index) => {
      listWithAds.push(item);
      if ((index + 1) % 5 === 0) {
        listWithAds.push({ id: `ad-${index}`, isAd: true, title: "Promoted" });
      }
    });

    return listWithAds;
  }, [processedReels, page]);

  // Update state when reels change
  useEffect(() => {
    setDisplayedReels(processedReels);
    setPage(1);
    setHasMore(initialReels.pagination?.hasNextPage ?? false);
  }, [processedReels, initialReels.pagination]);

  useEffect(() => {
    setReels(reelsWithAds);
  }, [reelsWithAds]);

  const contentIndex = React.useMemo(() => {
    let count = 0;
    for (let i = 0; i < Math.min(currentIndex + 1, reels.length); i++) {
      if (!reels[i]?.isAd) count++;
    }
    return Math.max(0, count - 1);
  }, [currentIndex, reels]);

  // Auto-load next page when reaching end
  // Infinite auto pagination
  useEffect(() => {

    if (loading || !hasMore) return;

    // Current visible REAL reel index (ignore ads)
    const currentRealIndex = reels
      .slice(0, currentIndex + 1)
      .filter((item) => !item.isAd).length;

    // Load next page when user reaches near end
    const shouldLoadMore =
      displayedReels.length - currentRealIndex <= 2;

    if (!shouldLoadMore) return;

    const nextPage = page + 1;

    // Prevent duplicate API calls
    if (inFlightPages.current.has(nextPage)) return;

    inFlightPages.current.add(nextPage);

    setLoading(true);

    fetchReels({
      page: nextPage,
      limit: PAGE_SIZE,
    })
      .then((result) => {

        if (!result.error && result.data?.length > 0) {

          setDisplayedReels((prev) => {

            // Remove duplicates
            const existingIds = new Set(
              prev.map((r) => r.id)
            );

            const uniqueNewReels = result.data.filter(
              (r) => !existingIds.has(r.id)
            );

            return [...prev, ...uniqueNewReels];
          });

          setPage(nextPage);

          // Continue pagination
          setHasMore(
            result.pagination?.hasNextPage ?? true
          );

        } else {

          // Stop only if API returns empty
          setHasMore(false);

        }

      })
      .catch((error) => {
        console.error(
          "Pagination fetch failed:",
          error
        );
      })
      .finally(() => {

        inFlightPages.current.delete(nextPage);

        setLoading(false);

      });

  }, [
    currentIndex,
    reels,
    displayedReels.length,
    hasMore,
    loading,
    page,
  ]);

  // Mask URL to keep only /reels
  useEffect(() => {
    if (window.location.pathname === '/reels' && window.location.search) {
      window.history.replaceState({}, '', '/reels');
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    // Debounce scroll events
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const scrollY = containerRef.current?.scrollTop || 0;
      const height = containerRef.current?.clientHeight || 0;
      const index = Math.round(scrollY / height);
      if (index !== currentIndex && index >= 0) {
        setCurrentIndex(index);
      }
    }, 16); // ~60fps
  }, [currentIndex]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleClearFilter = () => {
    const allValidReels = allReels.filter(r => r.videoUrl);
    setDisplayedReels(allValidReels);
    setPage(1);
    setHasMore(allValidReels.length > PAGE_SIZE);
  };

  // Check if we're using cached data and show notification
  useEffect(() => {
    if (initialReels.length > 0) {
      // This is a client-side check - we'll need to pass this info from the server
      const urlParams = new URLSearchParams(window.location.search);
      const cached = urlParams.get('cached');
      if (cached === 'true') {
        setNotification({
          message: "Showing cached data - API temporarily unavailable",
          type: 'warning'
        });
      }
    }
  }, [initialReels]);

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden">
      {/* Notification Banner */}
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          duration={8000}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Left Ad Sidebar - Desktop Only */}
      <div className="hidden xl:flex w-[250px] h-full items-center justify-center border-r border-white/5 bg-black/20">
        <div className="w-full px-2 flex flex-col items-center gap-4">
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180">Advertisement</span>
          <GoogleAd slotId="6973280684" format="vertical" style={{ minHeight: '600px' }} />
        </div>
      </div>

      {/* Main Feed */}
      <div className="flex-1 h-screen relative overflow-hidden">
        {/* Category Transition Notification */}

        {/* Category Filter Header */}

        {/* Mute Button */}
        <button
          onClick={() => setIsMuted(m => !m)}
          className="absolute top-6 right-6 z-50 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-lg"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <div
          ref={containerRef}
          className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        >
          {reels.length === 0 ? (
            <div className="h-screen flex items-center justify-center">
              <p className="text-white/50 text-lg">No reels found in this category</p>
            </div>
          ) : (
            reels.map((reel, index) => {
              // Only render current reel and 1 adjacent reel on each side for performance
              const shouldRender = Math.abs(index - currentIndex) <= 1;

              if (!shouldRender) {
                // Render lightweight placeholder for non-visible reels
                return reel.isAd ? (
                  <div key={reel.id} className="h-screen w-full flex-shrink-0 bg-black" />
                ) : (
                  <div key={reel.id} className="h-screen w-full flex-shrink-0 relative bg-black">
                    {/* Minimal placeholder - no heavy components */}
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  </div>
                );
              }

              return reel.isAd ? (
                <AdSection key={reel.id} isActive={index === currentIndex} />
              ) : (
                <ReelSection
                  key={reel.id}
                  reel={reel}
                  isActive={index === currentIndex}
                  isMuted={isMuted}
                  savedReels={savedReels}
                  setSavedReels={setSavedReels}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Right Ad Sidebar - Desktop Only */}
      <div className="hidden xl:flex w-[250px] h-full items-center justify-center border-l border-white/5 bg-black/20">
        <div className="w-full px-2 flex flex-col items-center gap-4">
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] [writing-mode:vertical-lr]">Advertisement</span>
          <GoogleAd slotId="6973280684" format="vertical" style={{ minHeight: '600px' }} />
        </div>
      </div>
    </div>
  );
}

export function ReelsFeed({ initialReels }: { initialReels: Reel[] }) {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-white/50 text-sm animate-pulse">Loading Reels...</p>
      </div>
    }>
      <ReelsFeedContent initialReels={initialReels} />
    </Suspense>
  );
}

function AdSection({ isActive }: { isActive: boolean }) {
  return (
    <section className="h-screen w-full snap-start relative bg-black flex items-center justify-center">
      <div className="relative w-full h-full md:max-w-[450px] md:h-[90%] md:rounded-[32px] overflow-hidden bg-bg-card shadow-2xl border border-white/10 flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute top-6 left-6 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 z-10">
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Sponsored</span>
        </div>
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-full bg-black/40 rounded-2xl mb-6 overflow-hidden flex items-center justify-center min-h-[300px]">
            <GoogleAd slotId="7372735935" format="fluid" className="w-full" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Featured Discovery</h2>
            <p className="text-sm text-text-secondary px-4">Check out this promoted content curated for you. Swipe to continue.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const GoogleAd = dynamic(() => import("@/components/GoogleAd").then(mod => mod.GoogleAd), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-white/5 rounded-xl h-[300px] w-full" />
});

interface ReelSectionProps {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  savedReels: Reel[];
  setSavedReels: React.Dispatch<React.SetStateAction<Reel[]>>;
}

const ReelSection = React.memo(function ReelSection({ reel, isActive, isMuted, savedReels, setSavedReels }: ReelSectionProps) {
  const videoRef = useRef<VideoPlayerRef>(null);
  const [showHeart, setShowHeart] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.likes || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  // Memoize video info
  const videoInfo = useMemo(() => getVideoInfo(reel.videoUrl), [reel.videoUrl]);
  const videoUrl = useMemo(() => reel.videoUrl, [reel.videoUrl]);

  // Check if reel is saved
  useEffect(() => {
    const saved = savedReels.some(savedReel => savedReel.id === reel.id);
    setIsSaved(saved);
  }, [reel.id, savedReels]);

  // Handle player ready state
  const handleVideoReady = useCallback(() => {
    setIsPlayerReady(true);
    setIsLoading(false);
  }, []);

  // Handle video loading start
  const handleVideoLoadingStart = useCallback(() => {
    if (isActive && !isPlayerReady && !hasVideoError) {
      setIsLoading(true);
    }
  }, [isActive, isPlayerReady, hasVideoError]);

  // Handle video error
  const handleVideoError = useCallback(() => {
    setHasVideoError(true);
    setIsPlayerReady(false);
    setIsLoading(false);
  }, []);

  // Play/pause when active/inactive
  useEffect(() => {
    if (!videoRef.current || !isPlayerReady || hasVideoError) return;
    
    if (isActive) {
      setIsPaused(false);
      setIsFastForwarding(false);
      if (videoRef.current.setPlaybackRate) {
        videoRef.current.setPlaybackRate(1);
      }
      
      setIsLoading(true);
      videoRef.current.play();
      const timeoutId = setTimeout(() => {
        viewReel(reel.id);
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timeoutId);
    } else {
      videoRef.current.pause();
      if (videoRef.current.setPlaybackRate) {
        videoRef.current.setPlaybackRate(1);
      }
      setIsPaused(false);
      setIsFastForwarding(false);
      setIsLoading(false);
    }
  }, [isActive, reel.id, isPlayerReady, hasVideoError]);

  // Start loading when reel becomes active
  useEffect(() => {
    if (isActive && !isPlayerReady && !hasVideoError) {
      handleVideoLoadingStart();
    }
  }, [isActive, isPlayerReady, hasVideoError, handleVideoLoadingStart]);

  const handleLike = useCallback(async () => {
    if (liked) return;
    setLiked(true);
    setLikeCount(c => c + 1);
    const result = await likeReel(reel.id);
    if (!result.error) setLikeCount(result.likes);
  }, [liked, reel.id]);

  const handleDoubleTap = useCallback(() => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    handleLike();
  }, [handleLike]);

  const handleSave = useCallback(() => {
    if (isSaved) {
      const updated = savedReels.filter(savedReel => savedReel.id !== reel.id);
      setSavedReels(updated);
      localStorage.setItem('saved-reels', JSON.stringify(updated));
      setIsSaved(false);
    } else {
      const updated = [...savedReels, reel];
      setSavedReels(updated);
      localStorage.setItem('saved-reels', JSON.stringify(updated));
      setIsSaved(true);
    }
  }, [isSaved, savedReels, reel, setSavedReels]);

  // Toggle pause/play on single click
  const togglePause = useCallback(() => {
    if (!videoRef.current || !isPlayerReady || hasVideoError) return;
    if (isPaused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
    setIsPaused(!isPaused);
  }, [isPaused, isPlayerReady, hasVideoError]);

  const handlePressStart = useCallback(() => {
    isLongPressRef.current = false;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    pressTimerRef.current = setTimeout(() => {
      if (isActive && !isPaused && videoRef.current) {
        isLongPressRef.current = true;
        if (videoRef.current.setPlaybackRate) {
          videoRef.current.setPlaybackRate(2);
        }
        setIsFastForwarding(true);
      }
    }, 500); // 500ms for long press
  }, [isActive, isPaused]);

  const handlePressEnd = useCallback((isCancel = false) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (isLongPressRef.current) {
      if (videoRef.current && videoRef.current.setPlaybackRate) {
        videoRef.current.setPlaybackRate(1);
      }
      setIsFastForwarding(false);
      isLongPressRef.current = false;
    } else if (!isCancel) {
      togglePause();
    }
  }, [togglePause]);

  return (
    <section className="h-screen w-full snap-start relative bg-black flex items-center justify-center">
      <div className="relative w-full h-full md:max-w-[450px] md:h-[90%] md:rounded-[32px] overflow-hidden bg-black shadow-2xl border border-white/5">

        {/* Video player — supports any video source */}
        {videoUrl && !hasVideoError ? (
          <div className="absolute inset-0 overflow-hidden">
            {/* Instagram-style loader overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 border-3 border-transparent border-t-primary/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  </div>
                  <p className="text-white/60 text-xs font-medium animate-pulse">Loading...</p>
                </div>
              </div>
            )}
            <VideoPlayer
              ref={videoRef}
              url={reel.videoUrl || videoUrl}
              poster={reel.thumbnailUrl}
              isActive={isActive}
              isMuted={isMuted}
              onReady={handleVideoReady}
              onError={handleVideoError}
              onLoadingStart={handleVideoLoadingStart}
              className="w-full h-full"
              videoId={reel.videoId}
            />
          </div>
        ) : (
          // Fallback thumbnail or error state
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            {hasVideoError ? (
              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-white/70 text-sm">Video unavailable</p>
                <p className="text-white/50 text-xs mt-1">This content cannot be played</p>
              </div>
            ) : (
              <Image
                src={reel.thumbnailUrl}
                alt={reel.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              />
            )}
          </div>
        )}

        {/* Heart animation */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              <Heart size={100} className="text-primary fill-primary drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play Button Overlay (shows when paused) */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              <div className="w-20 h-20 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                <Play size={40} className="text-white fill-white translate-x-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2x Speed Indicator */}
        <AnimatePresence>
          {isFastForwarding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2"
            >
              <div className="flex gap-0.5">
                <Play size={14} className="text-primary fill-primary" />
                <Play size={14} className="text-primary fill-primary" />
              </div>
              <span className="text-white text-sm font-bold tracking-widest">2.0x SPEED</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simple tap to pause/play overlay - only for non-YouTube videos */}
        {(!reel.videoId && !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) && (
          <div 
            className="absolute inset-0 z-20 cursor-pointer"
            onDoubleClick={handleDoubleTap}
            onPointerDown={handlePressStart}
            onPointerUp={() => handlePressEnd(false)}
            onPointerLeave={() => handlePressEnd(true)}
            onPointerCancel={() => handlePressEnd(true)}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />

        {/* Title / description */}
        <div className="absolute bottom-24 md:bottom-10 left-6 right-20 pointer-events-none z-10">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base md:text-lg font-bold text-white line-clamp-2">{reel.title}</h2>
            {savedReels.some(saved => saved.id === reel.id) && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 backdrop-blur-sm rounded-full border border-red-500/30">
                <Bookmark size={12} className="text-red-500 fill-red-500" />
                <span className="text-[8px] font-bold text-red-500">SAVED</span>
              </div>
            )}
          </div>
          {reel.category && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/90">#{reel.category}</span>
          )}
        </div>

        {/* Right Action Bar */}
        <div className="absolute right-4 bottom-32 md:bottom-24 flex flex-col items-center gap-5 md:gap-6 z-20">
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
            <div className={`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center border transition-all group-active:scale-90 shadow-lg ${liked ? "bg-primary border-primary" : "bg-black/30 border-white/20 group-hover:bg-primary"
              }`}>
              <Heart size={24} className={liked ? "fill-white text-white" : "text-white"} />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">
              {likeCount > 0 ? likeCount : "Like"}
            </span>
          </button>

          <button
            onClick={() => shareContent({ title: reel.title, text: reel.description, url: `${window.location.origin}/reels` })}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-hover:bg-primary transition-all group-active:scale-90 shadow-lg">
              <Share2 size={24} />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">Share</span>
          </button>

          <button
            onClick={handleSave}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all group-hover:scale-90 shadow-lg ${isSaved
              ? 'bg-red-500 group-hover:bg-red-600 border-red-500'
              : 'bg-black/30 group-hover:bg-primary'
              }`}>
              <Bookmark size={24} className={isSaved ? 'fill-white' : ''} />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">
              {isSaved ? 'Saved' : 'Save'}
            </span>
          </button>

          {reel.originalUrl && (
            <button
              onClick={() => window.open(reel.originalUrl, '_blank')}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all group-hover:scale-90 group-hover:bg-primary shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </div>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">
                Original
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
});
