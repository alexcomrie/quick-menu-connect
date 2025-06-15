
import Papa from 'papaparse';
import { MenuItem } from '../types/restaurant';
import { saveToCache, loadFromCache, CachedData } from './cache';

export const MENU_CACHE_KEY_PREFIX = 'menu_cache_';

export const fetchMenuItems = async (menuSheetUrl: string): Promise<MenuItem[]> => {
  const cacheKey = `${MENU_CACHE_KEY_PREFIX}${btoa(menuSheetUrl)}`;
  
  // Try to load from cache first
  const cachedMenu = loadFromCache<MenuItem[]>(cacheKey);
  if (cachedMenu) {
    console.log('Loading menu from cache');
    return cachedMenu;
  }

  try {
    console.log('Fetching menu from network:', menuSheetUrl);
    
    if (!menuSheetUrl) {
      throw new Error("Menu sheet URL is missing.");
    }
    
    const response = await fetch(menuSheetUrl);
    
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
              const priceAndSize = row[2] || '';
              const prices: { [size: string]: number } = {};
              
              if (priceAndSize) {
                if (priceAndSize.includes(':')) {
                  const priceSegments = priceAndSize.split(',');
                  priceSegments.forEach(segment => {
                    const parts = segment.split(':');
                    if (parts.length === 2) {
                      const size = parts[0].trim();
                      const price = parseFloat(parts[1].trim());
                      if (!isNaN(price)) {
                        prices[size] = price;
                      }
                    }
                  });
                } else {
                  const price = parseFloat(priceAndSize.replace('$', '').trim());
                  if (!isNaN(price)) {
                    prices[''] = price;
                  }
                }
              }
              
              const category = (row[0] || '').toLowerCase();
              let type: MenuItem['type'];
              switch(category) {
                case 'main': type = 'meat'; break;
                case 'sides': type = 'side'; break;
                case 'veg': type = 'veg'; break;
                case 'drink': type = 'drink'; break;
                case 'gravey': type = 'soup'; break;
                default: type = 'more';
              }
              
              const periodRaw = (row[3] || '').toLowerCase();
              const period: 'breakfast' | 'lunch' = periodRaw === 'lunch' ? 'lunch' : 'breakfast';

              return {
                name: row[1] || '',
                priceAndSize,
                period,
                type,
                gravey: '', // Mapping for gravey is unclear
                prices,
              };
            }).filter(item => item.name); // Filter out empty rows

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
