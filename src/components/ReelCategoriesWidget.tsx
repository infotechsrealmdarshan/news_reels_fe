"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { fetchReels } from "@/lib/api";
import { Reel } from "@/types";

export function ReelCategoriesWidget() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Navigate to reels with URL masking (keeps /reels only)
  const navigateToReel = (reelId: string) => {
    const urlWithParams = `/reels?id=${reelId}`;
    router.push(urlWithParams);
    
    // Mask URL after navigation
    setTimeout(() => {
      if (window.location.pathname === '/reels' && window.location.search) {
        window.history.replaceState({}, '', '/reels');
      }
    }, 10);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchReels({ limit: 12 });
        if (!res.error && res.data.length > 0) {
          setReels(res.data);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-3 bg-white/10 rounded w-32 mb-2" />
        <div className="grid grid-cols-3 gap-1">
          {[...Array(9)].map((_, j) => (
            <div key={j} className="aspect-[9/16] bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (reels.length === 0) return null;

  return (
    <div className="space-y-5">
      {/* 3-column thumbnail grid */}
      <div className="grid grid-cols-3 gap-1">
        {reels.map((reel) => (
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
              sizes="70px"
              unoptimized
            />
            {/* Play overlay on hover */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
              <Play size={16} className="text-white fill-white" />
            </div>
          </button>
        ))}
      </div>

      <Link
        href="/reels"
        className="block text-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors py-1"
      >
        View All Reels →
      </Link>
    </div>
  );
}
