import React from "react";
import { fetchReels } from "@/lib/api";
import { ReelsFeed } from "@/components/reels/ReelsFeed";
import { ErrorFallback } from "@/components/ErrorFallback";

interface PageProps {
  searchParams: { category?: string; id?: string };
}

// Shuffle array randomly
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  let category = params.category;
  const targetId = params.id;

  // If category is specified, fetch from that single category
  // Otherwise, we'll let the client handle fetching from multiple categories
  const reelsRes = await fetchReels({ limit: 50, category });

  if (reelsRes.error) {
    return <ErrorFallback message={reelsRes.msg} />;
  }

  // If there's a target ID, prioritize it; otherwise shuffle randomly
  let orderedReels = reelsRes.data;
  if (targetId) {
    // Find the target reel and move it to the first position
    const targetReel = orderedReels.find(r => r.id === targetId);
    const remainingReels = orderedReels.filter(r => r.id !== targetId);
    if (targetReel) {
      orderedReels = [targetReel, ...remainingReels];
    }
  } else {
    // Shuffle reels randomly only when no target ID
    orderedReels = shuffleArray(orderedReels);
  }

  return <ReelsFeed initialReels={orderedReels} />;
}
