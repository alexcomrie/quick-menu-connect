
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MenuItem } from '../types/restaurant';
import { Restaurant } from '../types/restaurant';

interface MenuEmptyStateProps {
  currentPeriod: 'breakfast' | 'lunch' | 'closed';
  menuItems: MenuItem[];
  restaurant: Restaurant;
}

export const MenuEmptyState: React.FC<MenuEmptyStateProps> = ({
  currentPeriod,
  menuItems,
  restaurant,
}) => {
  return (
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
  );
};
