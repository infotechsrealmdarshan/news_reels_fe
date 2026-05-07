"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Reel } from '@/types';
import { SavedReelFeed } from '@/components/reels/SavedReelFeed';

export default function SavedReelDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [savedReels, setSavedReels] = useState<Reel[]>([]);
  const [targetReel, setTargetReel] = useState<Reel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved reels from localStorage
    try {
      const saved = localStorage.getItem('saved-reels');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedReels(parsed);
        
        // Get reel ID from URL params
        const reelId = searchParams.get('id');
        if (reelId) {
          const target = parsed.find((reel: Reel) => reel.id === reelId);
          if (target) {
            setTargetReel(target);
            // Clean URL to remove parameters
            window.history.replaceState({}, '', '/saved-reels');
          } else {
            // If reel not found, redirect to saved reels
            router.push('/saved-reels');
          }
        } else {
          // If no reel ID, redirect to saved reels
          router.push('/saved-reels');
        }
      } else {
        // No saved reels, redirect to saved reels
        router.push('/saved-reels');
      }
    } catch (error) {
      console.error('Failed to load saved reels:', error);
      router.push('/saved-reels');
    } finally {
      setLoading(false);
    }
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white/60 rounded-full animate-spin"></div>
          <p className="mt-4 text-white/70">Loading saved reel...</p>
        </div>
      </div>
    );
  }

  if (!targetReel) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Reel not found</h2>
          <button
            onClick={() => router.push('/saved-reels')}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            Back to Saved Reels
          </button>
        </div>
      </div>
    );
  }

  // Show only the target reel in the feed
  return <SavedReelFeed reels={[targetReel]} />;
}
