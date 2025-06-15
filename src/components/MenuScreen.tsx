import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, User, Plus, RefreshCw } from 'lucide-react';
import { Restaurant, MenuItem } from '../types/restaurant';
import { getCurrentPeriod, getRandomVibrantColor } from '../utils/timeUtils';
import { fetchMenuItems } from '../services/menuService';
import { RestaurantProfile } from './RestaurantProfile';
import { OrderScreen } from './OrderScreen';
import { useToast } from '@/hooks/use-toast';

interface MenuScreenProps {
  restaurant: Restaurant;
  onBack: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  restaurant,
  onBack,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [orderMode, setOrderMode] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<'breakfast' | 'lunch' | 'closed'>('closed');
  const { toast } = useToast();
  
  const periodCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  const gradientClass = getRandomVibrantColor();

  // Determine current period
  const determineCurrentPeriod = () => {
    const period = getCurrentPeriod(
      restaurant.breakfastStartTime,
      restaurant.breakfastEndTime,
      restaurant.lunchStartTime,
      restaurant.lunchEndTime
    );
    
    console.log('Determined period:', period);
    return period;
  };

  // Check and update period if changed
  const checkAndUpdatePeriod = () => {
    const newPeriod = determineCurrentPeriod();
    if (newPeriod !== currentPeriod) {
      console.log('Period changed from', currentPeriod, 'to', newPeriod);
      setCurrentPeriod(newPeriod);
      // Refresh menu when period changes
      if (menuItems.length > 0) {
        console.log('Period changed, refreshing display');
      }
    }
  };

  // Start periodic checking every minute
  const startPeriodCheck = () => {
    periodCheckInterval.current = setInterval(() => {
      checkAndUpdatePeriod();
    }, 60000); // Check every minute
  };

  // Start periodic refresh every 30 minutes
  const startPeriodicRefresh = () => {
    refreshInterval.current = setInterval(() => {
      loadMenuItems();
    }, 30 * 60 * 1000); // Refresh every 30 minutes
  };

  useEffect(() => {
    // Initial period determination
    setCurrentPeriod(determineCurrentPeriod());
    
    // Load menu items
    loadMenuItems();
    
    // Start periodic checks
    startPeriodCheck();
    startPeriodicRefresh();
    
    // Cleanup intervals on unmount
    return () => {
      if (periodCheckInterval.current) {
        clearInterval(periodCheckInterval.current);
      }
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [restaurant.menuSheetUrl]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      console.log('Loading menu items for restaurant:', restaurant.name);
      console.log('Menu sheet URL:', restaurant.menuSheetUrl);
      
      const items = await fetchMenuItems(restaurant.menuSheetUrl);
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
      console.log('Refreshing menu items for restaurant:', restaurant.name);
      
      // Clear menu cache for this restaurant
      const cacheKey = `menu_cache_${btoa(restaurant.menuSheetUrl)}`;
      localStorage.removeItem(cacheKey);
      
      // Fetch fresh menu data
      const items = await fetchMenuItems(restaurant.menuSheetUrl);
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

  // Filter menu items for current period
  const getMenuForPeriod = (allItems: MenuItem[], period: 'breakfast' | 'lunch' | 'closed') => {
    if (period === 'closed') {
      // When closed, show all items but mark as unavailable
      return allItems;
    }
    
    return allItems.filter(item => 
      item.period.toLowerCase() === period.toLowerCase() || 
      item.period.toLowerCase() === 'both'
    );
  };

  const currentMenuItems = getMenuForPeriod(menuItems, currentPeriod);
  console.log('Current period:', currentPeriod);
  console.log('Filtered menu items for current period:', currentMenuItems);
  
  // Group items by their actual categories from the CSV
  const groupedItems = currentMenuItems.reduce((acc, item) => {
    const category = item.type.trim();
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Get actual categories from the menu data, sorted alphabetically
  const availableCategories = Object.keys(groupedItems).sort();
  console.log('Available categories:', availableCategories);

  const handleOrderClick = () => {
    if (!restaurant.whatsappNumber) {
      toast({
        title: "Ordering not available",
        description: "This restaurant doesn't accept orders online",
        variant: "destructive",
      });
      return;
    }
    
    if (currentPeriod === 'closed') {
      toast({
        title: "Restaurant is closed",
        description: "Orders can only be placed during operating hours",
        variant: "destructive",
      });
      return;
    }
    
    setShowOrder(true);
  };

  if (showOrder) {
    return (
      <OrderScreen
        restaurant={restaurant}
        menuItems={currentMenuItems}
        onBack={() => setShowOrder(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientClass}`}>
      <div className="bg-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Updating...' : 'Refresh'}
              </Button>
              
              <Button
                onClick={() => setShowProfile(true)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-center text-white mb-8">
            <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
            <p className="text-xl opacity-90">
              {currentPeriod === 'closed' 
                ? 'Restaurant Closed' 
                : `${currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1)} Menu`
              }
            </p>
            <div className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-sm ${
              currentPeriod === 'closed' 
                ? 'bg-red-500/20 text-red-100' 
                : 'bg-green-500/20 text-green-100'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                currentPeriod === 'closed' ? 'bg-red-400' : 'bg-green-400'
              }`} />
              {currentPeriod === 'closed' ? 'Currently Closed' : 'Currently Open'}
            </div>
            {restaurant.whatsappNumber && currentPeriod !== 'closed' && (
              <Button
                onClick={handleOrderClick}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white"
              >
                Place Order
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {currentMenuItems.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 text-lg">
                {currentPeriod === 'closed' 
                  ? `Restaurant is currently closed. Operating hours: ${restaurant.openingHours}`
                  : `No menu items available for ${currentPeriod} period`
                }
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Menu items found: {menuItems.length} | Current period: {currentPeriod}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {availableCategories.map(category => {
              const items = groupedItems[category];
              if (!items || items.length === 0) return null;

              return (
                <Card key={category} className="bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 uppercase">
                      {category}
                    </h2>
                    <div className="grid gap-4">
                      {items.map((item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className={`flex justify-between items-center p-4 rounded-lg transition-colors ${
                            currentPeriod === 'closed' 
                              ? 'bg-gray-100 opacity-60' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {item.name}
                              {currentPeriod === 'closed' && (
                                <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                  Unavailable
                                </span>
                              )}
                            </h3>
                            {Object.keys(item.prices).length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {Object.entries(item.prices).map(([size, price]) => (
                                  <span
                                    key={size}
                                    className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded"
                                  >
                                    {size} ${price}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {orderMode && currentPeriod !== 'closed' && (
                            <Button size="sm" variant="outline">
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <RestaurantProfile
        restaurant={restaurant}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
};
