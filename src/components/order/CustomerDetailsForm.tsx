
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Restaurant } from '../../types/restaurant';

interface CustomerDetailsFormProps {
  customerName: string;
  setCustomerName: (name: string) => void;
  deliveryOption: 'pickup' | 'delivery';
  setDeliveryOption: (option: 'pickup' | 'delivery') => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  pickupTime: string;
  setPickupTime: (time: string) => void;
  restaurant: Restaurant;
  orderItems: any[];
  onSendOrder: () => void;
}

export const CustomerDetailsForm: React.FC<CustomerDetailsFormProps> = ({
  customerName,
  setCustomerName,
  deliveryOption,
  setDeliveryOption,
  deliveryAddress,
  setDeliveryAddress,
  pickupTime,
  setPickupTime,
  restaurant,
  orderItems,
  onSendOrder,
}) => {
  return (
    <>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <Label htmlFor="deliveryOption">Delivery Option</Label>
              <Select value={deliveryOption} onValueChange={(value: 'pickup' | 'delivery') => setDeliveryOption(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  {restaurant.hasDelivery && (
                    <SelectItem value="delivery">Delivery (+${Math.round(restaurant.deliveryPrice)})</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {deliveryOption === 'delivery' && (
              <div>
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <Input
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address"
                />
              </div>
            )}

            {deliveryOption === 'pickup' && (
              <div>
                <Label htmlFor="pickupTime">Pickup Time *</Label>
                <Input
                  id="pickupTime"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  placeholder="Enter pickup time"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onSendOrder}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
        disabled={orderItems.length === 0}
      >
        Send Order via WhatsApp
      </Button>
    </>
  );
};
