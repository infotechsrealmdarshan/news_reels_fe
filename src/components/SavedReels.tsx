"use client";

import React, { useState, useEffect } from 'react';
import { Reel } from '@/types';
import { Heart, Grid3X3, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const SavedReelsComponent = function SavedReels() {
  const [savedReels, setSavedReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load saved reels from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('saved-reels');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedReels(parsed);
      }
    } catch (error) {
      console.error('Failed to load saved reels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRemoveSaved = (reelId: string) => {
    const updated = savedReels.filter(reel => reel.id !== reelId);
    setSavedReels(updated);
    localStorage.setItem('saved-reels', JSON.stringify(updated));
  };

  const handleContinueToAll = () => {
    router.push('/reels');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white/60 rounded-full animate-spin"></div>
          <p className="mt-4 text-white/70">Loading saved reels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart size={24} className="text-red-500 fill-red-500" />
              <h1 className="text-xl font-bold">Saved Reels</h1>
              <span className="text-white/60 text-sm">({savedReels.length})</span>
            </div>
            <button
              onClick={handleContinueToAll}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Play size={16} />
              Continue to All Reels
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {savedReels.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} className="mx-auto mb-4 text-white/20" />
            <h2 className="text-xl font-semibold mb-2">No saved reels yet</h2>
            <p className="text-white/60">
              Click the save icon on reels you love to build your collection
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {savedReels.map((reel) => (
              <div key={reel.id} className="relative group cursor-pointer" onClick={() => router.push(`/saved-reels`)}>
                <div className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden">
                  <Image
                    src={reel.thumbnailUrl}
                    alt={reel.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSaved(reel.id);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Heart size={14} className="text-white fill-white" />
                  </button>
                </div>
                
                {/* Reel Info */}
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-white line-clamp-2">{reel.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-white/60 capitalize">{reel.category}</span>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>{(reel.viewCount || (reel as any).views || 0).toLocaleString()} views</span>
                      <span>•</span>
                      <span>{(reel.likes || 0).toLocaleString()} likes</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const SavedReels = React.memo(SavedReelsComponent);
