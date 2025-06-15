
import Papa from 'papaparse';
import { Restaurant, MenuItem } from '../types/restaurant';

const GOOGLE_SHEETS_BASE_URL = 'https://docs.google.com/spreadsheets/d/';

// Hardcoded Google Sheets URL for restaurant profiles
const PROFILE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR9TxJ461YJY5UIpP9Tfv8O1R8Lac6lyCGRRBPIHzBiscc9wSlk68Ja6_ffQUMMCWkeEr6ts_jDrrDI/pub?output=csv';

// Cache keys for localStorage
const RESTAURANT_CACHE_KEY = 'restaurant_profiles_cache';
const MENU_CACHE_KEY_PREFIX = 'menu_cache_';

// Cache expiry time (1 hour)
const CACHE_EXPIRY_TIME = 60 * 60 * 1000;

interface CachedData<T> {
  data: T;
  timestamp: number;
}

// Cache utilities
const saveToCache = <T>(key: string, data: T): void => {
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

const loadFromCache = <T>(key: string): T | null => {
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

export const fetchRestaurantProfiles = async (): Promise<Restaurant[]> => {
  // Try to load from cache first
  const cachedRestaurants = loadFromCache<Restaurant[]>(RESTAURANT_CACHE_KEY);
  if (cachedRestaurants) {
    console.log('Loading restaurants from cache');
    return cachedRestaurants.filter(restaurant => 
      !('status' in restaurant) || restaurant.status?.toLowerCase() === 'active'
    );
  }

  try {
    console.log('Fetching restaurants from network');
    const response = await fetch(PROFILE_SHEET_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as string[][];
            // Skip header row
            const restaurants = data.slice(1).map((row) => ({
              name: row[0] || '',
              address: row[1] || '',
              phoneNumber: row[2] || '',
              whatsappNumber: row[3] || '',
              hasDelivery: row[4]?.toLowerCase() === 'yes',
              deliveryPrice: parseFloat(row[5]) || 0,
              openingHours: row[6] || '',
              breakStartTime: row[7] || '',
              breakEndTime: row[8] || '',
              lunchStartTime: row[9] || '',
              lunchEndTime: row[10] || '',
              profilePictureUrl: row[11] || '',
              businessRegistrationUrl: row[12] || '',
              menuSheetUrl: row[13] || '',
              status: row[14] || 'active', // Default to active if not specified
            }));

            // Filter only active restaurants
            const activeRestaurants = restaurants.filter(restaurant => 
              restaurant.status.toLowerCase() === 'active'
            );

            // Save to cache
            saveToCache(RESTAURANT_CACHE_KEY, activeRestaurants);
            
            resolve(activeRestaurants);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error),
      });
    });
  } catch (error) {
    console.error('Error fetching restaurant profiles:', error);
    
    // Try to return cached data even if expired as fallback
    const fallbackCache = localStorage.getItem(RESTAURANT_CACHE_KEY);
    if (fallbackCache) {
      try {
        const cachedData: CachedData<Restaurant[]> = JSON.parse(fallbackCache);
        console.log('Using expired cache as fallback');
        return cachedData.data.filter(restaurant => 
          !('status' in restaurant) || restaurant.status?.toLowerCase() === 'active'
        );
      } catch (cacheError) {
        console.warn('Failed to use cache fallback:', cacheError);
      }
    }
    
    throw error;
  }
};

export const fetchMenuItems = async (menuSheetUrl: string): Promise<MenuItem[]> => {
  const cacheKey = `${MENU_CACHE_KEY_PREFIX}${btoa(menuSheetUrl)}`;
  
  // Try to load from cache first
  const cachedMenu = loadFromCache<MenuItem[]>(cacheKey);
  if (cachedMenu) {
    console.log('Loading menu from cache');
    return cachedMenu;
  }

  try {
    console.log('Fetching menu from network');
    // Extract sheet ID from the URL and convert to CSV
    const sheetIdMatch = menuSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheets URL');
    }
    
    const sheetId = sheetIdMatch[1];
    const csvUrl = `${GOOGLE_SHEETS_BASE_URL}${sheetId}/export?format=csv&gid=0`;
    
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as string[][];
            // Skip header row
            const menuItems = data.slice(1).map((row) => {
              const priceAndSize = row[1] || '';
              const prices: { [size: string]: number } = {};
              
              // Parse price and size format: "SML[$200],MED[$300],LRG[$400]"
              if (priceAndSize) {
                const priceSegments = priceAndSize.split(',');
                priceSegments.forEach(segment => {
                  const match = segment.trim().match(/^(.+?)\[\$?(\d+(?:\.\d{2})?)\]$/);
                  if (match) {
                    const size = match[1].trim();
                    const price = parseFloat(match[2]);
                    prices[size] = price;
                  }
                });
              }
              
              return {
                name: row[0] || '',
                priceAndSize,
                period: (row[2]?.toLowerCase() === 'lunch' ? 'lunch' : 'break') as 'break' | 'lunch',
                type: (row[3]?.toLowerCase() || 'more') as 'meat' | 'side' | 'veg' | 'drink' | 'soup' | 'more',
                gravey: row[4] || '',
                prices,
              };
            });

            // Save to cache
            saveToCache(cacheKey, menuItems);
            
            resolve(menuItems);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error),
      });
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    
    // Try to return cached data even if expired as fallback
    const fallbackCache = localStorage.getItem(cacheKey);
    if (fallbackCache) {
      try {
        const cachedData: CachedData<MenuItem[]> = JSON.parse(fallbackCache);
        console.log('Using expired menu cache as fallback');
        return cachedData.data;
      } catch (cacheError) {
        console.warn('Failed to use menu cache fallback:', cacheError);
      }
    }
    
    throw error;
  }
};

// Utility function to clear all cache
export const clearCache = (): void => {
  try {
    // Clear restaurant cache
    localStorage.removeItem(RESTAURANT_CACHE_KEY);
    
    // Clear all menu caches
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(MENU_CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Cache cleared successfully');
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};
