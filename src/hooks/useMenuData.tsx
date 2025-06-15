
import { useState, useEffect } from 'react';
import { MenuItem } from '../types/restaurant';
import { fetchMenuItems } from '../services/menuService';
import { useToast } from '@/hooks/use-toast';

export const useMenuData = (menuSheetUrl: string) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      console.log('Loading menu items for menu sheet URL:', menuSheetUrl);
      
      const items = await fetchMenuItems(menuSheetUrl);
      console.log('Loaded menu items:', items);
      setMenuItems(items);
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('Refreshing menu items for menu sheet URL:', menuSheetUrl);
      
      // Clear menu cache for this restaurant
      const cacheKey = `menu_cache_${btoa(menuSheetUrl)}`;
      localStorage.removeItem(cacheKey);
      
      // Fetch fresh menu data
      const items = await fetchMenuItems(menuSheetUrl);
      console.log('Refreshed menu items:', items);
      setMenuItems(items);
      
      toast({
        title: "Success",
        description: "Menu has been updated with the latest information.",
      });
    } catch (error) {
      console.error('Error refreshing menu items:', error);
      toast({
        title: "Error",
        description: "Failed to refresh menu. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, [menuSheetUrl]);

  return {
    menuItems,
    loading,
    refreshing,
    handleRefresh,
  };
};
