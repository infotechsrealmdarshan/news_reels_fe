"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Reel } from "@/types";
import { Volume2, VolumeX, Heart, Share2, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { shareContent } from "@/lib/utils";
import { VideoPlayer, VideoPlayerRef } from "@/components/VideoPlayer";

interface SavedReelFeedProps {
  reels: Reel[];
  initialIndex?: number;
  onAllReels?: () => void;
  onCancel?: () => void;
}

export function SavedReelFeed({ reels, initialIndex = 0, onAllReels, onCancel }: SavedReelFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollY = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const index = Math.round(scrollY / height);
    const totalSections = reels.length + 1; // +1 for end section
    if (index !== currentIndex && index >= 0 && index < totalSections) {
      setCurrentIndex(index);
    }
  }, [currentIndex, reels.length]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  if (reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <p className="text-white/50 text-lg">No saved reels found</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden">
      {/* Main Feed */}
      <div className="flex-1 h-screen relative overflow-hidden">
        {/* Mute Button */}
        <button
          onClick={() => setIsMuted(m => !m)}
          className="absolute top-6 right-6 z-50 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-lg"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <div
          ref={containerRef}
          className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide scroll-smooth"
        >
          {reels.map((reel, index) => {
            // Only render current reel and 1 adjacent reel on each side for performance
            const shouldRender = Math.abs(index - currentIndex) <= 1;
            
            if (!shouldRender) {
              return (
                <div key={reel.id} className="h-screen w-full flex-shrink-0 relative">
                  <Image
                    src={reel.thumbnailUrl}
                    alt={reel.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <SavedReelSection
                key={reel.id}
                reel={reel}
                isActive={index === currentIndex}
                isMuted={isMuted}
              />
            );
          })}
          
          {/* End of Reels Section */}
          <div className={`h-screen w-full flex-shrink-0 relative bg-black flex items-center justify-center snap-start`}>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                <Bookmark size={40} className="text-white/60" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">You've seen all saved reels</h2>
              <p className="text-white/70 mb-8">Want to explore more content?</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onAllReels}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  All Reels
                </button>
                <button
                  onClick={onCancel}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SavedReelSectionProps {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
}

const SavedReelSection = React.memo(function SavedReelSection({ reel, isActive, isMuted }: SavedReelSectionProps) {
  const videoRef = useRef<VideoPlayerRef>(null);
  const [showHeart, setShowHeart] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.likes || 0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
  }, []);

  // Play/pause when active/inactive
  React.useEffect(() => {
    if (!videoRef.current || !isPlayerReady || hasVideoError) return;
    
    if (isActive) {
      setIsLoading(true);
      videoRef.current.play();
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    } else {
      videoRef.current.pause();
      setIsLoading(false);
    }
  }, [isActive, isPlayerReady, hasVideoError]);

  // Start loading when reel becomes active
  React.useEffect(() => {
    if (isActive && !isPlayerReady && !hasVideoError) {
      handleVideoLoadingStart();
    }
  }, [isActive, isPlayerReady, hasVideoError, handleVideoLoadingStart]);

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    setLikeCount(c => c + 1);
  };

  const handleDoubleTap = () => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    handleLike();
  };

  // Toggle pause/play on single click
  const togglePause = () => {
    if (!videoRef.current || !isPlayerReady || hasVideoError) return;
    if (isPaused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
    setIsPaused(!isPaused);
  };

  return (
    <section className="h-screen w-full snap-start relative bg-black flex items-center justify-center">
      <div className="relative w-full h-full md:max-w-[450px] md:h-[90%] md:rounded-[32px] overflow-hidden bg-black shadow-2xl border border-white/5">
        
        {/* Video player */}
        {reel.videoUrl && !hasVideoError ? (
          <div 
            className="absolute inset-0 overflow-hidden"
            onClick={() => window.open(reel.videoUrl, '_blank')}
          >
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
              url={reel.videoUrl}
              poster={reel.thumbnailUrl}
              isActive={isActive}
              isMuted={isMuted}
              onReady={handleVideoReady}
              onError={handleVideoError}
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
                unoptimized
                sizes="(max-width: 768px) 100vw, 450px"
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

        {/* Simple tap to pause/play overlay */}
        <div 
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={togglePause}
          onDoubleClick={handleDoubleTap}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />

        {/* Title / description */}
        <div className="absolute bottom-24 md:bottom-10 left-6 right-20 pointer-events-none z-10">
          <h2 className="text-base md:text-lg font-bold text-white mb-1 line-clamp-2">{reel.title}</h2>
          {reel.category && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/90">#{reel.category}</span>
          )}
        </div>

        {/* Right Action Bar */}
        <div className="absolute right-4 bottom-32 md:bottom-24 flex flex-col items-center gap-5 md:gap-6 z-20">
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
            <div className={`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center border transition-all group-active:scale-90 shadow-lg ${
              liked ? "bg-primary border-primary" : "bg-black/30 border-white/20 group-hover:bg-primary"
            }`}>
              <Heart size={24} className={liked ? "fill-white text-white" : "text-white"} />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">
              {likeCount > 0 ? likeCount : "Like"}
            </span>
          </button>

          <button
            onClick={() => shareContent({ title: reel.title, text: reel.description, url: `${window.location.origin}/saved-reels` })}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-hover:bg-primary transition-all group-active:scale-90 shadow-lg">
              <Share2 size={24} />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">Share</span>
          </button>

          <div className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 bg-red-500 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-red-500/20">
              <Bookmark size={24} className="fill-white" />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">Saved</span>
          </div>

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
