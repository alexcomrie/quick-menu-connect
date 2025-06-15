
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Restaurant } from '../types/restaurant';

interface RestaurantProfileProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
}

const getDirectImageUrl = (url: string): string => {
  if (url.includes('drive.google.com')) {
    // Extract file ID from Google Drive URL
    const regExp = /\/d\/([a-zA-Z0-9_-]+)|\/file\/d\/([a-zA-Z0-9_-]+)\//;
    const match = url.match(regExp);
    if (match) {
      const fileId = match[1] || match[2];
      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
  }
  return url;
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-gray-100 last:border-b-0">
    <div className="w-full sm:w-24 flex-shrink-0">
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
    <div className="flex-1">
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  </div>
);

export const RestaurantProfile: React.FC<RestaurantProfileProps> = ({
  restaurant,
  isOpen,
  onClose,
}) => {
  if (!restaurant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {restaurant.name} Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {restaurant.profilePictureUrl && (
            <div className="w-full">
              <img
                src={getDirectImageUrl(restaurant.profilePictureUrl)}
                alt={`${restaurant.name} profile`}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  console.log('Error loading profile image:', e);
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                  target.onerror = null; // Prevent infinite loop
                }}
              />
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Restaurant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Name" value={restaurant.name} />
              <InfoRow label="Address" value={restaurant.address} />
              {restaurant.phoneNumber && (
                <InfoRow label="Phone" value={restaurant.phoneNumber} />
              )}
              {restaurant.whatsappNumber && (
                <InfoRow label="WhatsApp" value={restaurant.whatsappNumber} />
              )}
              <InfoRow 
                label="Delivery" 
                value={restaurant.hasDelivery 
                  ? `Yes, $${restaurant.deliveryPrice}` 
                  : 'No'
                } 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operating Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Hours" value={restaurant.openingHours} />
              {restaurant.breakfastStartTime && restaurant.breakfastEndTime && (
                <InfoRow 
                  label="Breakfast Time" 
                  value={`${restaurant.breakfastStartTime} - ${restaurant.breakfastEndTime}`} 
                />
              )}
              {restaurant.lunchStartTime && restaurant.lunchEndTime && (
                <InfoRow 
                  label="Lunch Time" 
                  value={`${restaurant.lunchStartTime} - ${restaurant.lunchEndTime}`} 
                />
              )}
            </CardContent>
          </Card>

          {restaurant.businessRegistrationUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full">
                  <img
                    src={getDirectImageUrl(restaurant.businessRegistrationUrl)}
                    alt="Business Registration"
                    className="w-full h-48 object-contain rounded-lg border"
                    onError={(e) => {
                      console.log('Error loading registration image:', e);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      // Create error message element
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center';
                      errorDiv.innerHTML = '<span class="text-gray-500 text-sm">Failed to load registration image</span>';
                      target.parentNode?.replaceChild(errorDiv, target);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
