
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Restaurant } from '../types/restaurant';

interface RestaurantProfileProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RestaurantProfile: React.FC<RestaurantProfileProps> = ({
  restaurant,
  isOpen,
  onClose,
}) => {
  if (!restaurant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {restaurant.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {restaurant.profilePictureUrl && (
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={restaurant.profilePictureUrl}
                alt={`${restaurant.name} profile`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <div>
              <h4 className="font-semibold text-gray-900">Address</h4>
              <p className="text-gray-600">{restaurant.address}</p>
            </div>

            {restaurant.phoneNumber && (
              <div>
                <h4 className="font-semibold text-gray-900">Phone</h4>
                <p className="text-gray-600">{restaurant.phoneNumber}</p>
              </div>
            )}

            {restaurant.whatsappNumber && (
              <div>
                <h4 className="font-semibold text-gray-900">WhatsApp</h4>
                <p className="text-gray-600">{restaurant.whatsappNumber}</p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900">Opening Hours</h4>
              <p className="text-gray-600">{restaurant.openingHours}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900">Meal Times</h4>
              <p className="text-gray-600">
                Break: {restaurant.breakStartTime} - {restaurant.breakEndTime}
              </p>
              <p className="text-gray-600">
                Lunch: {restaurant.lunchStartTime} - {restaurant.lunchEndTime}
              </p>
            </div>

            {restaurant.hasDelivery && (
              <div>
                <h4 className="font-semibold text-gray-900">Delivery</h4>
                <p className="text-gray-600">
                  Available - ${restaurant.deliveryPrice}
                </p>
              </div>
            )}
          </div>

          {restaurant.businessRegistrationUrl && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Business Registration</h4>
              <img
                src={restaurant.businessRegistrationUrl}
                alt="Business Registration"
                className="w-full rounded-lg border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
