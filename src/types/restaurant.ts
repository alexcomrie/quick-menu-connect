
export interface Restaurant {
  name: string;
  address: string;
  phoneNumber: string;
  whatsappNumber: string;
  hasDelivery: boolean;
  deliveryPrice: number;
  openingHours: string;
  breakfastStartTime: string;
  breakfastEndTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  profilePictureUrl: string;
  businessRegistrationUrl: string;
  menuSheetUrl: string;
  status?: string;
  mixPrices: { [size: string]: number };
}

export interface MenuItem {
  name: string;
  priceAndSize: string;
  period: 'breakfast' | 'lunch';
  type: string; // Changed to string to allow dynamic categories
  gravey?: string;
  prices: { [size: string]: number };
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  secondMenuItem?: MenuItem;
  isMix: boolean;
  selectedSize: string;
  selectedPrice: number;
  sides: MenuItem[];
  vegetables: MenuItem[];
  gravey: MenuItem[];
  drink?: MenuItem;
  quantity: number;
}

export interface Order {
  items: OrderItem[];
  customerName: string;
  deliveryOption: 'pickup' | 'delivery';
  deliveryAddress?: string;
  pickupTime?: string;
  total: number;
}
