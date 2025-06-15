import React, { useState, useEffect } from 'react';
import { RestaurantCard } from '../components/RestaurantCard';
import { MenuScreen } from '../components/MenuScreen';
import { RestaurantProfile } from '../components/RestaurantProfile';
import { Restaurant } from '../types/restaurant';
import { fetchRestaurantProfiles } from '../services/googleSheetsService';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileRestaurant, setProfileRestaurant] = useState<Restaurant | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRestaurants();
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const data = await fetchRestaurantProfiles();
      setRestaurants(data);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurants. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewMenu = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowMenu(true);
  };

  const handleViewProfile = (restaurant: Restaurant) => {
    setProfileRestaurant(restaurant);
    setShowProfile(true);
  };

  if (showMenu && selectedRestaurant) {
    return (
      <MenuScreen
        restaurant={selectedRestaurant}
        onBack={() => {
          setShowMenu(false);
          setSelectedRestaurant(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Restaurants</h2>
          <p className="text-gray-500">Please wait while we fetch the latest menus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🍽️ Restaurant Link
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover daily menus from your favorite local restaurants. 
            Fresh ingredients, made with love, delivered to your door.
          </p>
        </div>

        {restaurants.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Restaurants Available</h2>
            <p className="text-gray-500 mb-6">
              We're working on adding restaurants to your area. Please check back later!
            </p>
            <button
              onClick={loadRestaurants}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant, index) => (
              <RestaurantCard
                key={`${restaurant.name}-${index}`}
                restaurant={restaurant}
                onViewMenu={() => handleViewMenu(restaurant)}
                onViewProfile={() => handleViewProfile(restaurant)}
              />
            ))}
          </div>
        )}
      </div>

      <RestaurantProfile
        restaurant={profileRestaurant}
        isOpen={showProfile}
        onClose={() => {
          setShowProfile(false);
          setProfileRestaurant(null);
        }}
      />
    </div>
  );
};

export default Index;
