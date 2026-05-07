import { NewsArticle, NewsListResponse, Reel, Pagination } from "@/types";
import { makeSlug, deriveCloudinaryThumbnail, truncate, coerceInt } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://news-reels.onrender.com";

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const pendingRequests = new Map<string, Promise<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Debounce function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Get cache key
const getCacheKey = (endpoint: string, params: Record<string, any> = {}) => {
  return `${endpoint}?${new URLSearchParams(params).toString()}`;
};

// Check cache validity
const getCachedData = (key: string) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  if (cached) {
    apiCache.delete(key); // Remove expired cache
  }
  return null;
};

// Set cache data
const setCachedData = (key: string, data: any) => {
  apiCache.set(key, { data, timestamp: Date.now() });
  // Limit cache size
  if (apiCache.size > 50) {
    const oldestKey = apiCache.keys().next().value;
    if (oldestKey) apiCache.delete(oldestKey);
  }
};

export async function fetchNews(params: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}): Promise<NewsListResponse> {
  const { page = 1, limit = 10, category, search } = params;
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (category && category !== "all") query.append("category", category);
  if (search) query.append("search", search);

  try {
    const response = await fetch(`${BASE_URL}/news?${query.toString()}`, {
      next: { revalidate: 60 },
    });
    const body = await response.json();

    if (body.error) {
      return { articles: [], pagination: null, error: true, msg: body.msg };
    }

    const articles: NewsArticle[] = body.data.map((item: any) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      slug: makeSlug(item.title, item.createdAt),
      title: item.title,
      imageUrl: item.imageLink || (item.imageLinks && item.imageLinks[0]) || "",
      imageLinks: item.imageLinks || [],
      description: item.description,
      summary: truncate(item.description, 200),
      category: item.category || "all",
      createdAt: item.createdAt,
      publishedAt: new Date(item.createdAt),
      views: item.views || 0,
      likes: item.likes || 0,
    }));

    const pagination: Pagination = {
      total: coerceInt(body.pagination.total),
      page: coerceInt(body.pagination.page),
      limit: coerceInt(body.pagination.limit),
      totalPages: coerceInt(body.pagination.totalPages),
      hasNextPage: body.pagination.hasNextPage,
      hasPrevPage: body.pagination.hasPrevPage,
    };

    return { articles, pagination, error: false, msg: body.msg };
  } catch (error: any) {
    return { 
      articles: [], 
      pagination: null, 
      error: true, 
      msg: error.message || "Failed to fetch news" 
    };
  }
}

export async function fetchReels(params?: { search?: string; page?: number; limit?: number; category?: string }): Promise<{ data: Reel[]; error: boolean; msg: string; pagination?: any }> {
  const { page = 1, limit = 10, category, search } = params || {};
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (category && category !== "all") query.append("category", category);
  if (search) query.append("search", search);

  const cacheKey = getCacheKey('reels', Object.fromEntries(query));
  
  // Check cache first
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return {
      data: cachedData.data,
      error: false,
      msg: "Showing cached data",
      pagination: cachedData.pagination
    };
  }

  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    try {
      const result = await pendingRequests.get(cacheKey);
      return result;
    } catch {
      // If pending request fails, continue with new request
      pendingRequests.delete(cacheKey);
    }
  }

  // Create new request
  const requestPromise = (async () => {
    const fetchWithRetry = async (retries = 3): Promise<Response> => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(`${BASE_URL}/reels?${query.toString()}`, {
            next: { revalidate: 60 },
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });
          
          if (response.status === 429) {
            const waitTime = Math.min(1000 * Math.pow(2, i), 5000);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          return response;
        } catch (error) {
          if (i === retries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
      throw new Error("Max retries exceeded");
    };

    try {
      const response = await fetchWithRetry();
      const body = await response.json();

      if (body.error) {
        throw new Error(body.msg || "API error");
      }

      const reels: Reel[] = body.data.map((item: any) => ({
        id: item.id,
        videoUrl: item.reelUrl,
        thumbnailUrl: item.thumbnailUrl,
        title: item.title,
        description: item.description,
        category: item.category,
        viewCount: item.viewCount ?? item.views ?? 0,
        likes: item.likes || 0,
        publishedAt: new Date(item.publishedAt || item.createdAt),
        videoId: item.videoId,
        isAd: item.isAd,
        cta: item.cta,
        originalUrl: item.originalUrl || item.sourceUrl,
      }));

      const result = {
        data: reels,
        error: false,
        msg: body.msg,
        pagination: body.pagination || undefined
      };

      // Cache the successful response
      setCachedData(cacheKey, {
        data: reels,
        pagination: body.pagination || undefined
      });

      return result;
    } catch (error: any) {
      return {
        data: [],
        error: true,
        msg: error.message || "Failed to fetch reels. Please try again later."
      };
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

export async function fetchNewsById(id: string): Promise<{ article: NewsArticle | null; error: boolean }> {
  try {
    const response = await fetch(`${BASE_URL}/news/${id}`, { cache: "no-store" });
    const body = await response.json();
    if (body.error || !body.data) return { article: null, error: true };
    const item = body.data;
    return {
      article: {
        id: item.id,
        slug: makeSlug(item.title, item.createdAt),
        title: item.title,
        imageUrl: item.imageLink || (item.imageLinks && item.imageLinks[0]) || "",
        imageLinks: item.imageLinks || [],
        description: item.description,
        summary: truncate(item.description, 200),
        category: item.category || "all",
        createdAt: item.createdAt,
        publishedAt: new Date(item.createdAt),
        views: item.views || 0,
        likes: item.likes || 0,
      },
      error: false,
    };
  } catch {
    return { article: null, error: true };
  }
}

export async function likeNews(id: string): Promise<{ likes: number; error: boolean }> {
  try {
    const response = await fetch(`${BASE_URL}/news/${id}/like`, { method: "POST" });
    const body = await response.json();
    return { likes: body.data?.likes ?? 0, error: body.error };
  } catch {
    return { likes: 0, error: true };
  }
}

export async function viewNews(id: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/news/${id}/view`, { method: "POST" });
  } catch {
    // silently ignore
  }
}

export const fetchReelsDebounced = debounce(fetchReels, 300);

export async function likeReel(id: string): Promise<{ likes: number; error: boolean; msg: string }> {
  try {
    const response = await fetch(`${BASE_URL}/reels/${id}/like`, { method: "POST" });
    const body = await response.json();
    return { likes: body.data?.likes ?? 0, error: body.error, msg: body.msg };
  } catch (error: any) {
    return { likes: 0, error: true, msg: error.message || "Failed to like reel" };
  }
}

export async function viewReel(id: string): Promise<{ error: boolean; msg: string }> {
  try {
    const response = await fetch(`${BASE_URL}/reels/${id}/view`, { method: "POST" });
    const body = await response.json();
    return { error: body.error, msg: body.msg };
  } catch (error: any) {
    return { error: true, msg: error.message || "Failed to record view" };
  }
}

export async function fetchReelCategories(): Promise<{ categories: string[]; error: boolean; msg: string }> {
  try {
    const response = await fetch(`${BASE_URL}/reels/categories`, {
      next: { revalidate: 300 },
    });
    const body = await response.json();
    if (body.error) {
      return { categories: [], error: true, msg: body.msg };
    }
    return { categories: body.data, error: false, msg: body.msg };
  } catch (error: any) {
    return { 
      categories: [], 
      error: true, 
      msg: error.message || "Failed to fetch categories" 
    };
  }
}
