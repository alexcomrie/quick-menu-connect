
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
    console.log('Raw CSV data:', csvText.substring(0, 500)); // Log first 500 chars for debugging
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as string[][];
            console.log('Parsed CSV data:', data);
            
            // Skip header row
            const menuItems = data.slice(1).map((row, index) => {
              console.log(`Processing row ${index}:`, row);
              
              const priceAndSize = row[2] || '';
              const prices: { [size: string]: number } = {};
              
              // Parse prices more carefully
              if (priceAndSize) {
                if (priceAndSize.includes(':')) {
                  // Handle size:price format (e.g., "Small:10,Large:15")
                  const priceSegments = priceAndSize.split(',');
                  priceSegments.forEach(segment => {
                    const parts = segment.trim().split(':');
                    if (parts.length === 2) {
                      const size = parts[0].trim();
                      const priceStr = parts[1].trim().replace('$', '');
                      const price = parseFloat(priceStr);
                      if (!isNaN(price)) {
                        prices[size] = price;
                      }
                    }
                  });
                } else {
                  // Handle single price format (e.g., "$10" or "10")
                  const priceStr = priceAndSize.replace('$', '').trim();
                  const price = parseFloat(priceStr);
                  if (!isNaN(price)) {
                    prices['Regular'] = price;
                  }
                }
              }
              
              // Map category to type more accurately
              const category = (row[0] || '').toLowerCase().trim();
              let type: MenuItem['type'];
              switch(category) {
                case 'main':
                case 'mains': 
                  type = 'meat'; 
                  break;
                case 'side':
                case 'sides': 
                  type = 'side'; 
                  break;
                case 'veg':
                case 'vegetable':
                case 'vegetables': 
                  type = 'veg'; 
                  break;
                case 'drink':
                case 'drinks':
                case 'beverage':
                case 'beverages': 
                  type = 'drink'; 
                  break;
                case 'soup':
                case 'soups':
                case 'gravey':
                case 'gravy': 
                  type = 'soup'; 
                  break;
                default: 
                  type = 'more';
              }
              
              // Handle period more robustly
              const periodRaw = (row[3] || '').toLowerCase().trim();
              const period: 'breakfast' | 'lunch' = periodRaw === 'lunch' ? 'lunch' : 'breakfast';

              const menuItem = {
                name: (row[1] || '').trim(),
                priceAndSize,
                period,
                type,
                gravey: '', // Keep as empty string for now
                prices,
              };
              
              console.log(`Created menu item:`, menuItem);
              return menuItem;
            }).filter(item => item.name); // Filter out empty rows

            console.log('Final menu items:', menuItems);

            // Save to cache
            saveToCache(cacheKey, menuItems);
            
            resolve(menuItems);
          } catch (error) {
            console.error('Error processing CSV data:', error);
            reject(error);
          }
        },
        error: (error) => {
          console.error('Papa Parse error:', error);
          reject(error);
        },
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
