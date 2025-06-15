
// Cache expiry time (1 hour)
export const CACHE_EXPIRY_TIME = 60 * 60 * 1000;

export interface CachedData<T> {
  data: T;
  timestamp: number;
}

// Cache utilities
export const saveToCache = <T>(key: string, data: T): void => {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    console.warn('Failed to save to cache:', error);
  }
};

export const loadFromCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const cachedData: CachedData<T> = JSON.parse(cached);
    const isExpired = Date.now() - cachedData.timestamp > CACHE_EXPIRY_TIME;
    
    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }

    return cachedData.data;
  } catch (error) {
    console.warn('Failed to load from cache:', error);
    return null;
  }
};
