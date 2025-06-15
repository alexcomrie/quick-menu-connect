
import { fetchRestaurantProfiles } from './restaurantService';
import { fetchMenuItems } from './menuService';
import { RESTAURANT_CACHE_KEY } from './restaurantService';
import { MENU_CACHE_KEY_PREFIX } from './menuService';

export { fetchRestaurantProfiles, fetchMenuItems };

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
