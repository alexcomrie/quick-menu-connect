
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { MenuItem } from '../../types/restaurant';

interface AddItemsSectionProps {
  groupedItems: Record<string, MenuItem[]>;
  availableCategories: string[];
  fixedCategories: string[];
  onAddItem: (item: MenuItem, category: string) => void;
}

export const AddItemsSection: React.FC<AddItemsSectionProps> = ({
  groupedItems,
  availableCategories,
  fixedCategories,
  onAddItem,
}) => {
  const renderCategorySection = (category: string) => {
    const items = groupedItems[category] || [];
    // Only show items with prices and exclude "Continuous" items
    const itemsWithPrices = items.filter(item => 
      Object.keys(item.prices).length > 0 && 
      item.name.toLowerCase() !== 'continuous'
    );
    
    if (itemsWithPrices.length === 0) return null;

    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);

    return (
      <div key={category}>
        <h3 className="font-semibold mb-2">Select {categoryTitle}</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {itemsWithPrices.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onAddItem(item, category)}
              className="justify-between h-auto p-3"
            >
              <div className="text-left">
                <div className="font-medium">{item.name}</div>
                {Object.keys(item.prices).length > 1 && (
                  <div className="text-xs text-gray-500">
                    {Object.entries(item.prices).map(([size, price]) => `${size}:$${Math.round(price)}`).join(', ')}
                  </div>
                )}
                {Object.keys(item.prices).length === 1 && (
                  <div className="text-xs text-gray-500">
                    ${Math.round(Object.values(item.prices)[0])}
                  </div>
                )}
              </div>
              <Plus className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Add Items</h2>
        <div className="space-y-4">
          {availableCategories.map(category => renderCategorySection(category))}
        </div>
      </CardContent>
    </Card>
  );
};
