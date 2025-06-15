
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Phone, User } from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { getRandomVibrantColor, getCurrentPeriod } from '../utils/timeUtils';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onViewMenu: () => void;
  onViewProfile: () => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onViewMenu,
  onViewProfile,
}) => {
  const currentPeriod = getCurrentPeriod(
    restaurant.breakfastStartTime,
    restaurant.breakfastEndTime,
    restaurant.lunchStartTime,
    restaurant.lunchEndTime
  );

  const isOpen = currentPeriod !== 'closed';
  const gradientClass = getRandomVibrantColor();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className={`h-3 bg-gradient-to-r ${gradientClass}`} />
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
            {restaurant.name}
          </h3>
          <Button
            onClick={onViewProfile}
            size="sm"
            variant="ghost"
            className="p-2"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>

        <div className="aspect-video mb-4 rounded-lg overflow-hidden bg-gray-100">
          {restaurant.profilePictureUrl ? (
            <img
              src={restaurant.profilePictureUrl}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🍽️</div>
                <p className="text-sm">No image available</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
            {restaurant.address}
          </div>
          
          {restaurant.phoneNumber && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-3 w-3 mr-2" />
              {restaurant.phoneNumber}
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-3 w-3 mr-2" />
            {restaurant.openingHours}
          </div>

          {restaurant.hasDelivery && (
            <div className="flex items-center text-sm text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              Delivery available (${restaurant.deliveryPrice})
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              isOpen ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={`text-sm font-medium ${
              isOpen ? 'text-green-600' : 'text-red-600'
            }`}>
              {isOpen ? `${currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1)} Menu` : 'Closed'}
            </span>
          </div>

          <Button
            onClick={onViewMenu}
            disabled={!isOpen}
            className={`${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            View Menu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
