
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MenuItem } from '../types/restaurant';

interface MenuCategoryProps {
  category: string;
  items: MenuItem[];
  currentPeriod: 'breakfast' | 'lunch' | 'closed';
  orderMode: boolean;
}

export const MenuCategory: React.FC<MenuCategoryProps> = ({
  category,
  items,
  currentPeriod,
  orderMode,
}) => {
  // Capitalize the category name for display
  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 uppercase">
          {displayCategory}
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
};
