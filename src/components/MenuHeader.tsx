
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, RefreshCw } from 'lucide-react';
import { Restaurant } from '../types/restaurant';

interface MenuHeaderProps {
  restaurant: Restaurant;
  currentPeriod: 'breakfast' | 'lunch' | 'closed';
  refreshing: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onShowProfile: () => void;
  onOrderClick: () => void;
  gradientClass: string;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({
  restaurant,
  currentPeriod,
  refreshing,
  onBack,
  onRefresh,
  onShowProfile,
  onOrderClick,
  gradientClass,
}) => {
  return (
    <div className={`bg-gradient-to-br ${gradientClass}`}>
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
                onClick={onRefresh}
                disabled={refreshing}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Updating...' : 'Refresh'}
              </Button>
              
              <Button
                onClick={onShowProfile}
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
                onClick={onOrderClick}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white"
              >
                Place Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
