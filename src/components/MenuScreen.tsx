
import React, { useState, useRef, useEffect } from 'react';
import { Restaurant, MenuItem } from '../types/restaurant';
import { getRandomVibrantColor } from '../utils/timeUtils';
import { RestaurantProfile } from './RestaurantProfile';
import { OrderScreen } from './OrderScreen';
import { MenuHeader } from './MenuHeader';
import { MenuCategory } from './MenuCategory';
import { MenuLoadingState } from './MenuLoadingState';
import { MenuEmptyState } from './MenuEmptyState';
import { useMenuData } from '../hooks/useMenuData';
import { usePeriodCheck } from '../hooks/usePeriodCheck';
import { useToast } from '@/hooks/use-toast';

interface MenuScreenProps {
  restaurant: Restaurant;
  onBack: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  restaurant,
  onBack,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [orderMode, setOrderMode] = useState(false);
  const { toast } = useToast();
  
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const gradientClass = getRandomVibrantColor();

  // Fixed categories order - matching Flutter app specification
  const fixedCategories = ['Main', 'Sides', 'Veg', 'Gravey', 'Drink'];

  // Use custom hooks
  const { menuItems, loading, refreshing, handleRefresh } = useMenuData(restaurant.menuSheetUrl);
  const currentPeriod = usePeriodCheck(
    restaurant.breakfastStartTime,
    restaurant.breakfastEndTime,
    restaurant.lunchStartTime,
    restaurant.lunchEndTime
  );

  // Start periodic refresh every 30 minutes
  const startPeriodicRefresh = () => {
    refreshInterval.current = setInterval(() => {
      handleRefresh();
    }, 30 * 60 * 1000); // Refresh every 30 minutes
  };

  useEffect(() => {
    startPeriodicRefresh();
    
    // Cleanup interval on unmount
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

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

  // Get ordered categories - fixed categories first, then any additional ones
  const getOrderedCategories = (): string[] => {
    const allCategories = Object.keys(groupedItems);
    const orderedCategories: string[] = [];
    
    // First, add fixed categories in their specified order (if they exist and have items)
    fixedCategories.forEach(category => {
      if (groupedItems[category] && groupedItems[category].length > 0) {
        orderedCategories.push(category);
      }
    });
    
    // Then add any additional categories not in the fixed list
    allCategories.forEach(category => {
      if (!fixedCategories.includes(category) && groupedItems[category].length > 0) {
        orderedCategories.push(category);
      }
    });
    
    return orderedCategories;
  };

  const availableCategories = getOrderedCategories();
  console.log('Available categories in order:', availableCategories);

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
    return <MenuLoadingState />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientClass}`}>
      <MenuHeader
        restaurant={restaurant}
        currentPeriod={currentPeriod}
        refreshing={refreshing}
        onBack={onBack}
        onRefresh={handleRefresh}
        onShowProfile={() => setShowProfile(true)}
        onOrderClick={handleOrderClick}
        gradientClass={gradientClass}
      />

      <div className="container mx-auto px-4 pb-8">
        {currentMenuItems.length === 0 ? (
          <MenuEmptyState
            currentPeriod={currentPeriod}
            menuItems={menuItems}
            restaurant={restaurant}
          />
        ) : (
          <div className="space-y-6">
            {availableCategories.map(category => {
              const items = groupedItems[category];
              if (!items || items.length === 0) return null;

              return (
                <MenuCategory
                  key={category}
                  category={category}
                  items={items}
                  currentPeriod={currentPeriod}
                  orderMode={orderMode}
                />
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
