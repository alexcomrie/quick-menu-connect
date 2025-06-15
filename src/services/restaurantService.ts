
import Papa from 'papaparse';
import { Restaurant } from '../types/restaurant';
import { saveToCache, loadFromCache, CachedData } from './cache';

// Hardcoded Google Sheets URL for restaurant profiles
const PROFILE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR9TxJ461YJY5UIpP9Tfv8O1R8Lac6lyCGRRBPIHzBiscc9wSlk68Ja6_ffQUMMCWkeEr6ts_jDrrDI/pub?output=csv';

// Cache key for localStorage
export const RESTAURANT_CACHE_KEY = 'restaurant_profiles_cache';

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
