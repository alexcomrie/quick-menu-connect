import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Minus, X } from 'lucide-react';
import { Restaurant, MenuItem, OrderItem, Order } from '../types/restaurant';
import { useToast } from '@/hooks/use-toast';

interface OrderScreenProps {
  restaurant: Restaurant;
  menuItems: MenuItem[];
  onBack: () => void;
}

export const OrderScreen: React.FC<OrderScreenProps> = ({
  restaurant,
  menuItems,
  onBack,
}) => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [showSizeDialog, setShowSizeDialog] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [showOrderBuilder, setShowOrderBuilder] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Partial<OrderItem>>({});
  const { toast } = useToast();

  const groupedItems = menuItems.reduce((acc, item) => {
    const type = item.type === 'soup' ? 'gravey' : item.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const handleAddMainDish = (item: MenuItem) => {
    setSelectedMenuItem(item);
    if (Object.keys(item.prices).length === 1) {
      // Single price item, proceed directly to order builder
      const size = Object.keys(item.prices)[0];
      const price = item.prices[size];
      setCurrentOrder({
        id: Date.now().toString(),
        menuItem: item,
        selectedSize: size,
        selectedPrice: price,
        sides: [],
        vegetables: [],
        gravey: [],
        quantity: 1,
        isMix: false,
      });
      setShowOrderBuilder(true);
    } else {
      // Multiple sizes, show size selection dialog
      setShowSizeDialog(true);
    }
  };

  const handleSizeSelection = (size: string) => {
    if (selectedMenuItem) {
      const price = selectedMenuItem.prices[size];
      setCurrentOrder({
        id: Date.now().toString(),
        menuItem: selectedMenuItem,
        selectedSize: size,
        selectedPrice: price,
        sides: [],
        vegetables: [],
        gravey: [],
        quantity: 1,
        isMix: false,
      });
      setShowSizeDialog(false);
      setShowOrderBuilder(true);
    }
  };

  const handleCompleteOrder = () => {
    if (currentOrder.menuItem) {
      if (currentOrder.isMix) {
        if (!currentOrder.secondMenuItem) {
          toast({ title: "Second main dish required for a mix order.", variant: "destructive" });
          return;
        }
        if (currentOrder.selectedSize !== 'Med' && currentOrder.selectedSize !== 'Lrg') {
          toast({ title: "Mix meals only available in Medium or Large size.", variant: "destructive" });
          return;
        }
      }

      let price = currentOrder.selectedPrice || 0;
      if (currentOrder.isMix) {
        price = restaurant.mixPrices[currentOrder.selectedSize || ''] ?? 0;
      }

      const newOrderItem: OrderItem = {
        id: currentOrder.id || Date.now().toString(),
        menuItem: currentOrder.menuItem,
        secondMenuItem: currentOrder.secondMenuItem,
        isMix: currentOrder.isMix || false,
        selectedSize: currentOrder.selectedSize || '',
        selectedPrice: price,
        sides: currentOrder.sides || [],
        vegetables: currentOrder.vegetables || [],
        gravey: currentOrder.gravey || [],
        drink: currentOrder.drink,
        quantity: currentOrder.quantity || 1,
      };

      setOrderItems(prev => [...prev, newOrderItem]);
      setCurrentOrder({});
      setShowOrderBuilder(false);
      toast({
        title: "Item added",
        description: "Item has been added to your order",
      });
    }
  };

  const removeOrderItem = (id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, change: number) => {
    setOrderItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    ));
  };

  const calculateTotal = () => {
    const itemsTotal = orderItems.reduce((total, item) => {
      let itemTotal = item.selectedPrice * item.quantity;
      if (item.drink) {
        itemTotal += (Object.values(item.drink.prices)[0] || 0) * item.quantity;
      }
      return total + itemTotal;
    }, 0);

    const deliveryFee = deliveryOption === 'delivery' && restaurant.hasDelivery 
      ? restaurant.deliveryPrice 
      : 0;

    return itemsTotal + deliveryFee;
  };

  const handleSendOrder = () => {
    if (!customerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (deliveryOption === 'delivery' && !deliveryAddress.trim()) {
      toast({
        title: "Address required", 
        description: "Please enter delivery address",
        variant: "destructive",
      });
      return;
    }

    if (deliveryOption === 'pickup' && !pickupTime.trim()) {
      toast({
        title: "Pickup time required",
        description: "Please enter pickup time",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "Empty order",
        description: "Please add items to your order",
        variant: "destructive",
      });
      return;
    }

    // Generate WhatsApp message
    let message = `Hello ${restaurant.name}, I would like to place an order:\n\n`;
    message += `Customer Name: ${customerName}\n`;
    message += `${deliveryOption.toUpperCase()}\n`;
    
    if (deliveryOption === 'delivery') {
      message += `Delivery Address: ${deliveryAddress}\n`;
    } else {
      message += `Pickup Time: ${pickupTime}\n`;
    }
    
    message += '\nORDER DETAILS:\n';

    orderItems.forEach((order, index) => {
      message += `\nOrder #${index + 1}:\n`;
      
      if (order.isMix && order.secondMenuItem) {
        message += `- ${order.menuItem.name}\n`;
        message += `- ${order.secondMenuItem.name}\n`;
        message += `Mix ${order.selectedSize} [$${order.selectedPrice}] x ${order.quantity}\n`;
      } else {
        message += `- ${order.menuItem.name} ${order.selectedSize} [$${order.selectedPrice}] x ${order.quantity}\n`;
      }
      
      if (order.sides.length > 0) {
        message += 'Sides:\n';
        order.sides.forEach(side => message += `- ${side.name}\n`);
      }
      
      if (order.vegetables.length > 0) {
        message += 'Vegetables:\n';
        order.vegetables.forEach(veg => message += `- ${veg.name}\n`);
      }

      if (order.gravey.length > 0) {
        message += 'Gravey:\n';
        order.gravey.forEach(gravey => message += `- ${gravey.name}\n`);
      }
      
      if (order.drink) {
        const drinkPrice = Object.values(order.drink.prices)[0] || 0;
        message += `Drink: ${order.drink.name} [$${drinkPrice}] x ${order.quantity}\n`;
      }
    });

    const total = calculateTotal();
    message += `\nTotal: $${total.toFixed(2)}`;
    
    if (deliveryOption === 'delivery' && restaurant.hasDelivery) {
      message += ` (includes $${restaurant.deliveryPrice} delivery fee)`;
    }

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${restaurant.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Place Order - {restaurant.name}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Menu Items */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Select Main Dishes</h2>
            <div className="grid gap-4">
              {(groupedItems.meat || []).map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {Object.entries(item.prices).map(([size, price]) => (
                        <span key={size} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {size} ${price}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddMainDish(item)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Order */}
        {orderItems.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Your Order</h2>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {item.isMix ? `Mix (${item.selectedSize})` : `${item.menuItem.name} ${item.selectedSize}`}
                        <span className="text-green-600 ml-2">${item.selectedPrice}</span>
                      </h3>
                      {item.isMix && item.secondMenuItem && (
                        <p className="text-sm text-gray-600">
                          {item.menuItem.name} & {item.secondMenuItem.name}
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
                          Drink: {item.drink.name} ${Object.values(item.drink.prices)[0]}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeOrderItem(item.id)}
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
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Details */}
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
                      <SelectItem value="delivery">Delivery (+${restaurant.deliveryPrice})</SelectItem>
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

        {/* Send Order Button */}
        <Button
          onClick={handleSendOrder}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
          disabled={orderItems.length === 0}
        >
          Send Order via WhatsApp
        </Button>
      </div>

      {/* Size Selection Dialog */}
      <Dialog open={showSizeDialog} onOpenChange={setShowSizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Size</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedMenuItem && Object.entries(selectedMenuItem.prices).map(([size, price]) => (
              <Button
                key={size}
                onClick={() => handleSizeSelection(size)}
                variant="outline"
                className="w-full justify-between"
              >
                <span>{size}</span>
                <span>${price}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Builder Dialog */}
      <Dialog open={showOrderBuilder} onOpenChange={setShowOrderBuilder}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {currentOrder.menuItem && (
              <div>
                <h3 className="font-semibold">Main Dish</h3>
                <p>{currentOrder.menuItem.name} {currentOrder.selectedSize} - ${currentOrder.selectedPrice}</p>
              </div>
            )}

            {/* Mix Food Selection */}
            <div className="flex items-center space-x-2">
              <Switch
                id="mix-food"
                checked={currentOrder.isMix}
                onCheckedChange={(checked) => setCurrentOrder(prev => ({ ...prev, isMix: checked, secondMenuItem: undefined }))}
              />
              <Label htmlFor="mix-food">Mix Food</Label>
            </div>

            {currentOrder.isMix && (
              <div>
                <h3 className="font-semibold mb-2">Select Second Main Dish</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(groupedItems.meat || []).filter(item => item.name !== currentOrder.menuItem?.name).map((item, index) => (
                    <Button
                      key={index}
                      variant={currentOrder.secondMenuItem?.name === item.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentOrder(prev => ({
                          ...prev,
                          secondMenuItem: prev.secondMenuItem?.name === item.name ? undefined : item
                        }));
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Sides Selection */}
            {(groupedItems.side || []).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Select Sides</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(groupedItems.side || []).map((item, index) => (
                    <Button
                      key={index}
                      variant={currentOrder.sides?.some(s => s.name === item.name) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const sides = currentOrder.sides || [];
                        const exists = sides.some(s => s.name === item.name);
                        setCurrentOrder(prev => ({
                          ...prev,
                          sides: exists 
                            ? sides.filter(s => s.name !== item.name)
                            : [...sides, item]
                        }));
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Vegetables Selection */}
            {(groupedItems.veg || []).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Select Vegetables</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(groupedItems.veg || []).map((item, index) => (
                    <Button
                      key={index}
                      variant={currentOrder.vegetables?.some(v => v.name === item.name) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const vegetables = currentOrder.vegetables || [];
                        const exists = vegetables.some(v => v.name === item.name);
                        setCurrentOrder(prev => ({
                          ...prev,
                          vegetables: exists 
                            ? vegetables.filter(v => v.name !== item.name)
                            : [...vegetables, item]
                        }));
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Gravey Selection */}
            {(groupedItems.gravey || []).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Select Gravey</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(groupedItems.gravey || []).map((item, index) => (
                    <Button
                      key={index}
                      variant={currentOrder.gravey?.some(g => g.name === item.name) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const gravey = currentOrder.gravey || [];
                        const exists = gravey.some(g => g.name === item.name);
                        setCurrentOrder(prev => ({
                          ...prev,
                          gravey: exists
                            ? gravey.filter(g => g.name !== item.name)
                            : [...gravey, item]
                        }));
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Drinks Selection */}
            {(groupedItems.drink || []).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Select Drink (Optional)</h3>
                <div className="grid grid-cols-1 gap-2">
                  {(groupedItems.drink || []).map((item, index) => (
                    <Button
                      key={index}
                      variant={currentOrder.drink?.name === item.name ? "default" : "outline"}
                      className="justify-between"
                      onClick={() => {
                        setCurrentOrder(prev => ({
                          ...prev,
                          drink: prev.drink?.name === item.name ? undefined : item
                        }));
                      }}
                    >
                      <span>{item.name}</span>
                      <span>${Object.values(item.prices)[0] || 0}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleCompleteOrder} className="w-full">
              Add to Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
