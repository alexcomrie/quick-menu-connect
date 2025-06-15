
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, User, Plus } from 'lucide-react';
import { Restaurant, MenuItem } from '../types/restaurant';
import { getCurrentPeriod, getRandomVibrantColor } from '../utils/timeUtils';
import { fetchMenuItems } from '../services/googleSheetsService';
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
  const [showProfile, setShowProfile] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [orderMode, setOrderMode] = useState(false);
  const { toast } = useToast();

  const currentPeriod = getCurrentPeriod(
    restaurant.breakfastStartTime,
    restaurant.breakfastEndTime,
    restaurant.lunchStartTime,
    restaurant.lunchEndTime
  );

  const gradientClass = getRandomVibrantColor();

  useEffect(() => {
    loadMenuItems();
  }, [restaurant.menuSheetUrl]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await fetchMenuItems(restaurant.menuSheetUrl);
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

  const currentMenuItems = menuItems.filter(item => item.period === currentPeriod);
  
  // Group items by their actual type/category from the CSV
  const groupedItems = currentMenuItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Get unique categories from the data
  const availableCategories = Object.keys(groupedItems).sort();

  const handleOrderClick = () => {
    if (!restaurant.whatsappNumber) {
      toast({
        title: "Ordering not available",
        description: "This restaurant doesn't accept orders online",
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
            
            <Button
              onClick={() => setShowProfile(true)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <User className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center text-white mb-8">
            <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
            <p className="text-xl opacity-90">
              {currentPeriod === 'breakfast' ? 'Breakfast Menu' : 'Lunch Menu'}
            </p>
            {restaurant.whatsappNumber && (
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
                No menu items available for {currentPeriod} period
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
                          className="flex justify-between items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {item.name}
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
                          
                          {orderMode && (
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
