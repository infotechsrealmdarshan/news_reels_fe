"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchReels, fetchReelCategories } from "@/lib/api";
import { ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Reel } from "@/types";

// Shuffle array randomly
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 3-dot loading component
function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [allReels, setAllReels] = useState<Reel[]>([]);
  const [displayedReels, setDisplayedReels] = useState<Reel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // Default to 'all'
  const [apiPage, setApiPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalReels, setTotalReels] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const API_PAGE_SIZE = 24; // Load 24 reels initially for faster loading
  const LOAD_MORE_THRESHOLD = 20; // Load more when reaching 20
  const reelsRef = useRef<HTMLDivElement>(null);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetchReelCategories();
      if (!res.error) {
        setCategories(res.categories);
      }
    } catch {}
    setLoadingCategories(false);
  }, []);


  // Initial load - fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch reels when selectedCategory changes
  useEffect(() => {
    if (!selectedCategory || loadingCategories) return;
    
    setLoading(true);
    const params: any = { page: 1, limit: API_PAGE_SIZE };
    if (selectedCategory !== 'all') {
      params.category = selectedCategory;
    }
    
    fetchReels(params).then(res => {
      if (!res.error && res.data?.length > 0) {
        const validReels = res.data.filter(r => r.videoUrl);
        const shuffledReels = shuffleArray(validReels);
        
        setAllReels(shuffledReels);
        setDisplayedReels(shuffledReels);
        setTotalReels(shuffledReels.length);
        setApiPage(1);
        setHasMore(res.data.length === API_PAGE_SIZE);
      } else {
        setAllReels([]);
        setDisplayedReels([]);
        setTotalReels(0);
        setHasMore(false);
      }
      setLoading(false);
    });
  }, [selectedCategory, loadingCategories]);

  // Load more from API when scrolling
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextApiPage = apiPage + 1;
    
    try {
      const params: any = { page: nextApiPage, limit: API_PAGE_SIZE };
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      const res = await fetchReels(params);
      
      if (!res.error && res.data.length > 0) {
        // Filter out invalid reels and add only unique ones
        const validNewReels = res.data.filter(r => r.videoUrl);
        const existingIds = new Set(displayedReels.map(r => r.id));
        const uniqueNew = validNewReels.filter(r => !existingIds.has(r.id));
        
        if (uniqueNew.length > 0) {
          // Combine without re-sorting to maintain API order
          const combined = [...displayedReels, ...uniqueNew];
          
          setAllReels(combined);
          setDisplayedReels(combined);
          setTotalReels(prev => prev + uniqueNew.length);
        }
        
        setApiPage(nextApiPage);
        // Check if there might be more data
        setHasMore(res.data.length === API_PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch {}
    
    setLoadingMore(false);
  };

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!reelsRef.current) return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const reelsBottom = reelsRef.current.offsetTop + reelsRef.current.offsetHeight;
      const threshold = 500; // pixels before bottom
      
      if (scrollPosition >= reelsBottom - threshold && hasMore && !loadingMore) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore, loadingMore]);

  const navigateToReel = (reelId: string) => {
    router.push(`/reels?id=${reelId}`);
    setTimeout(() => {
      if (window.location.pathname === '/reels' && window.location.search) {
        window.history.replaceState({}, '', '/reels');
      }
    }, 10);
  };

  const navigateToCategory = (category: string) => {
    setSelectedCategory(category);
    setApiPage(1);
    setAllReels([]);
    setDisplayedReels([]);
    setHasMore(true);
    setLoadingMore(false);
    setLoading(true); // Start loading reels for new category
  };


  return (
    <div className="min-h-screen bg-black">

      {/* Category Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loadingCategories ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* All Reels Option */}
            <button
              onClick={() => navigateToCategory('all')}
              className={`p-4 rounded-xl transition-all border ${
                selectedCategory === 'all' 
                  ? 'bg-primary/20 border-primary/50' 
                  : 'bg-white/5 border-white/10 hover:bg-primary/20 hover:border-primary/50'
              }`}
            >
              <span className="font-medium text-white">All Reels</span>
            </button>
            {/* All Categories */}
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => navigateToCategory(cat)}
                className={`p-4 rounded-xl transition-all border ${
                  selectedCategory === cat 
                    ? 'bg-primary/20 border-primary/50' 
                    : 'bg-white/5 border-white/10 hover:bg-primary/20 hover:border-primary/50'
                }`}
              >
                <span className="font-medium capitalize text-white">{cat}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reels Grid */}
      <div ref={reelsRef} className="max-w-6xl mx-auto px-4 py-6 border-t border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">
          {selectedCategory === 'all' ? 'All Reels' : `${selectedCategory} Reels`}
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[9/16] bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {displayedReels.map((reel) => (
                <button
                  key={reel.id}
                  onClick={() => navigateToReel(reel.id)}
                  className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black group/thumb block"
                >
                  <Image
                    src={reel.thumbnailUrl}
                    alt={reel.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                    unoptimized
                  />
                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                    <Play size={20} className="text-white fill-white" />
                  </div>
                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-xs font-medium line-clamp-2">{reel.title}</p>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Loading indicator */}
            {loadingMore && <LoadingDots />}
            
            {!hasMore && displayedReels.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No more reels</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
