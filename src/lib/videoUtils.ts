// Video platform detection and URL processing utilities

export interface VideoInfo {
  type: 'direct' | 'server' | 'youtube' | 'unknown';
  embedUrl?: string;
  thumbnailUrl?: string;
  canEmbed: boolean;
}

export function getVideoInfo(url: string): VideoInfo {
  if (!url) return { type: 'unknown', canEmbed: false };
  
  // YouTube URLs are now handled via videoId field, not URL processing
  
  // Check if it's from our server (API base URL)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://news-reels.onrender.com";
  if (url.includes(API_BASE_URL) || url.startsWith('/reels/') || url.startsWith('/uploads/')) {
    return {
      type: 'server',
      embedUrl: url.startsWith('http') ? url : `${API_BASE_URL}${url}`,
      canEmbed: true
    };
  }
  
  // Direct video files (mp4, webm, etc.) - prioritize this
  const directVideoRegex = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v)(\?.*)?$/i;
  if (directVideoRegex.test(url)) {
    return {
      type: 'direct',
      embedUrl: url,
      canEmbed: true
    };
  }
  
  // Cloudinary and other CDNs that support direct playback
  const cdnRegex = /(cloudinary\.com|stream\.mux\.com|video\.wixstatic\.com|cdn\.cloudinary\.com)/i;
  if (cdnRegex.test(url)) {
    return {
      type: 'direct',
      embedUrl: url,
      canEmbed: true
    };
  }
  
  // News media websites and feeds
  const newsMediaRegex = /(abplive\.com|timesofindia\.com|ndtv\.com|indiatimes\.com|hindustantimes\.com|thehindu\.com|indianexpress\.com|news18\.com|aajtak\.com|zee5\.com|sonyliv\.com|hotstar\.com|voot\.com)/i;
  if (newsMediaRegex.test(url)) {
    return {
      type: 'direct',
      embedUrl: url,
      canEmbed: true
    };
  }
  
  // Check for common video hosting patterns that might work with direct URLs
  const videoHostRegex = /(\.mp4|\.webm|\.mov|\.avi|video|stream|media|assets|upload|feed)/i;
  if (videoHostRegex.test(url)) {
    return {
      type: 'direct',
      embedUrl: url,
      canEmbed: true
    };
  }
  
  // Try to be more permissive for any URL that looks like it might be video content
  if (url.includes('video') || url.includes('media') || url.includes('content') || url.includes('upload')) {
    return {
      type: 'direct',
      embedUrl: url,
      canEmbed: true
    };
  }
  
  // As a last resort, try to treat any URL as potentially playable
  // This will help identify URLs that might actually work but weren't caught by regex
  if (url.startsWith('http')) {
    return {
      type: 'direct',
      embedUrl: url,
      canEmbed: true
    };
  }
  
  return {
    type: 'unknown',
    canEmbed: false
  };
}

export function isValidVideoUrl(url: string): boolean {
  const info = getVideoInfo(url);
  return info.canEmbed && info.type !== 'unknown';
}

export function getVideoThumbnailUrl(videoUrl: string, fallbackThumbnail?: string): string {
  // For server-hosted videos, we might have thumbnail endpoints
  const info = getVideoInfo(videoUrl);
  
  if (info.type === 'server' && videoUrl.includes('/reels/')) {
    // Try to generate thumbnail URL from video URL
    const videoId = videoUrl.split('/').pop()?.split('.')[0];
    if (videoId) {
      return `${process.env.NEXT_PUBLIC_API_URL || "https://news-reels.onrender.com"}/reels/${videoId}/thumbnail`;
    }
  }
  
  // Return fallback thumbnail if available
  return fallbackThumbnail || '';
}
