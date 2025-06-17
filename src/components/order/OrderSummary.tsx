
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, X } from 'lucide-react';
import { OrderItem } from '../../types/restaurant';

interface OrderSummaryProps {
  orderItems: OrderItem[];
  onClearAll: () => void;
  onUpdateQuantity: (id: string, change: number) => void;
  onRemoveItem: (id: string) => void;
  total: number;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  orderItems,
  onClearAll,
  onUpdateQuantity,
  onRemoveItem,
  total,
}) => {
  if (orderItems.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Your Order</h2>
          <Button variant="outline" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
        <div className="space-y-4">
          {orderItems.map((item) => (
            <div key={item.id} className="flex justify-between items-start p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">
                  {item.isMix ? `Mix (${item.selectedSize})` : `${item.menuItem.name} ${item.selectedSize}`}
                  <span className="text-green-600 ml-2">${Math.round(item.selectedPrice)}</span>
                </h3>
                {item.isMix && item.secondMenuItem && (
                  <p className="text-sm text-gray-600">
                    {item.menuItem.name} & {item.secondMenuItem.name}
                  </p>
                )}

                {item.specials && item.specials.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {item.menuItem.specialOption === 'select' 
                      ? `With: ${item.specials.join(', ')}`
                      : `No: ${item.specials.join(', ')}`
                    }
                  </p>
                )}

                {item.secondMenuItemSpecials && item.secondMenuItemSpecials.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Second item - {item.secondMenuItem?.specialOption === 'select' 
                      ? `With: ${item.secondMenuItemSpecials.join(', ')}`
                      : `No: ${item.secondMenuItemSpecials.join(', ')}`
                    }
                  </p>
                )}
                
                {item.sides.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Sides: {item.sides.map(s => s.name).join(', ')}
                  </p>
                )}
                
                {item.vegetables.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Vegetables: {item.vegetables.map(v => v.name).join(', ')}
                  </p>
                )}

                {item.gravey.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Gravey: {item.gravey.map(g => g.name).join(', ')}
                  </p>
                )}
                
                {item.drink && (
                  <p className="text-sm text-gray-600">
                    Drink: {item.drink.name} ${Math.round(Object.values(item.drink.prices)[0])}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(item.id, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(item.id, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Total:</span>
            <span>${Math.round(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
