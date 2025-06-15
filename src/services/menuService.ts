
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
    console.log('Raw CSV data:', csvText.substring(0, 500));
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as string[][];
            console.log('Parsed CSV data:', data);
            
            // Skip header row and process menu items
            const menuItems = data.slice(1)
              .map((row, index) => {
                console.log(`Processing row ${index}:`, row);
                
                // Extract and clean data from CSV columns
                const category = (row[0] || '').trim();
                const name = (row[1] || '').trim();
                const priceAndSize = (row[2] || '').trim();
                const periodRaw = (row[3] || '').toLowerCase().trim();
                const special = (row[4] || '').trim();
                const specialOption = (row[5] || '').toLowerCase().trim();
                const specialCap = (row[6] || '').trim();
                
                // Skip rows with missing essential data
                if (!category || !name) {
                  console.log(`Skipping row ${index} - missing category or name`);
                  return null;
                }
                
                const prices: { [size: string]: number } = {};
                
                // Parse prices from the priceAndSize field
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
                        if (!isNaN(price) && price > 0) {
                          prices[size] = price;
                        }
                      }
                    });
                  } else {
                    // Handle single price format (e.g., "$10" or "10")
                    const priceStr = priceAndSize.replace('$', '').trim();
                    const price = parseFloat(priceStr);
                    if (!isNaN(price) && price > 0) {
                      prices['Regular'] = price;
                    }
                  }
                }
                
                // Determine period - default to breakfast if not lunch
                const period: 'breakfast' | 'lunch' = periodRaw === 'lunch' ? 'lunch' : 'breakfast';

                // Parse special cap
                let parsedSpecialCap: number | 'max' | '' = '';
                if (specialCap) {
                  if (specialCap.toLowerCase() === 'max') {
                    parsedSpecialCap = 'max';
                  } else {
                    const capNumber = parseInt(specialCap);
                    if (!isNaN(capNumber)) {
                      parsedSpecialCap = capNumber;
                    }
                  }
                }

                // Parse specials (comma-separated list)
                const specials = special ? special.split(',').map(s => s.trim()).filter(s => s) : [];

                const menuItem: MenuItem = {
                  name,
                  priceAndSize,
                  period,
                  type: category, // Use the actual category from CSV as-is
                  gravey: '',
                  prices,
                  special,
                  specialOption: (specialOption === 'select' || specialOption === 'exclude') ? specialOption : '',
                  specialCap: parsedSpecialCap,
                  specials,
                };
                
                console.log(`Created menu item:`, menuItem);
                return menuItem;
              })
              .filter((item): item is MenuItem => item !== null); // Filter out null items

            console.log('Final processed menu items:', menuItems);
            console.log('Categories found:', [...new Set(menuItems.map(item => item.type))]);

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
