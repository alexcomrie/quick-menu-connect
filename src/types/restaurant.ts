
export interface Restaurant {
  name: string;
  address: string;
  phoneNumber: string;
  whatsappNumber: string;
  hasDelivery: boolean;
  deliveryPrice: number;
  openingHours: string;
  breakStartTime: string;
  breakEndTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  profilePictureUrl: string;
  businessRegistrationUrl: string;
  menuSheetUrl: string;
}

export interface MenuItem {
  name: string;
  priceAndSize: string;
  period: 'break' | 'lunch';
  type: 'meat' | 'side' | 'veg' | 'drink' | 'soup' | 'more';
  gravey?: string;
  prices: { [size: string]: number };
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
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
