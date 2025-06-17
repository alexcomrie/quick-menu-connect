
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Restaurant, MenuItem, OrderItem } from '../types/restaurant';
import { useToast } from '@/hooks/use-toast';
import { AddItemsSection } from './order/AddItemsSection';
import { OrderSummary } from './order/OrderSummary';
import { CustomerDetailsForm } from './order/CustomerDetailsForm';
import { SizeSelectionDialog } from './order/SizeSelectionDialog';
import { OrderBuilderDialog } from './order/OrderBuilderDialog';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showOrderBuilder, setShowOrderBuilder] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Partial<OrderItem>>({});
  const [selectedSpecials, setSelectedSpecials] = useState<string[]>([]);
  const [selectedSecondSpecials, setSelectedSecondSpecials] = useState<string[]>([]);
  const [sideSpecials, setSideSpecials] = useState<{[itemName: string]: string[]}>({});
  const [vegSpecials, setVegSpecials] = useState<{[itemName: string]: string[]}>({});
  const [graveySpecials, setGraveySpecials] = useState<{[itemName: string]: string[]}>({});
  const { toast } = useToast();

  // Fixed categories order - matching the specified requirements
  const fixedCategories = ['main', 'sides', 'veg', 'gravey', 'drink'];

  // Filter out "Continuous" items and group menu items by their type
  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase() !== 'continuous' && 
    item.type.toLowerCase() !== 'continuous'
  );

  const groupedItems = filteredMenuItems.reduce((acc, item) => {
    // Use the actual category from the CSV (normalize to lowercase for consistency)
    const type = item.type.toLowerCase();
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Get ordered categories - fixed categories first, then any additional ones
  const getOrderedCategories = (): string[] => {
    const allCategories = Object.keys(groupedItems);
    const orderedCategories: string[] = [];
    
    // First, add fixed categories in their specified order (if they exist and have items)
    fixedCategories.forEach(category => {
      if (groupedItems[category] && groupedItems[category].length > 0) {
        orderedCategories.push(category);
      }
    });
    
    // Then add any additional categories not in the fixed list
    allCategories.forEach(category => {
      if (!fixedCategories.includes(category) && groupedItems[category].length > 0) {
        orderedCategories.push(category);
      }
    });
    
    return orderedCategories;
  };

  const availableCategories = getOrderedCategories();

  console.log('Grouped items:', groupedItems);
  console.log('Available categories in order:', availableCategories);

  const handleAddItem = (item: MenuItem, category: string) => {
    console.log('Adding item:', item, 'from category:', category);
    setSelectedMenuItem(item);
    setSelectedCategory(category);
    setSelectedSpecials([]);
    setSelectedSecondSpecials([]);
    
    if (Object.keys(item.prices).length === 0) {
      toast({ 
        title: "No pricing available", 
        description: "This item doesn't have pricing information.",
        variant: "destructive" 
      });
      return;
    }
    
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
        specials: [],
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
        specials: [],
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

      // Validate specials selection
      const menuItem = currentOrder.menuItem;
      if (menuItem.specialOption === 'select' && menuItem.specials && menuItem.specials.length > 0 && !menuItem.specials.includes('Continuous')) {
        if (selectedSpecials.length === 0) {
          toast({ title: "Please select required options for this item.", variant: "destructive" });
          return;
        }
        if (typeof menuItem.specialCap === 'number' && selectedSpecials.length > menuItem.specialCap) {
          toast({ title: `You can only select up to ${menuItem.specialCap} options.`, variant: "destructive" });
          return;
        }
      }

      if (currentOrder.isMix && currentOrder.secondMenuItem) {
        const secondMenuItem = currentOrder.secondMenuItem;
        if (secondMenuItem.specialOption === 'select' && secondMenuItem.specials && secondMenuItem.specials.length > 0 && !secondMenuItem.specials.includes('Continuous')) {
          if (selectedSecondSpecials.length === 0) {
            toast({ title: "Please select required options for the second item.", variant: "destructive" });
            return;
          }
          if (typeof secondMenuItem.specialCap === 'number' && selectedSecondSpecials.length > secondMenuItem.specialCap) {
            toast({ title: `You can only select up to ${secondMenuItem.specialCap} options for the second item.`, variant: "destructive" });
            return;
          }
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
        specials: [...selectedSpecials.filter(s => s !== 'Continuous')],
        secondMenuItemSpecials: currentOrder.isMix ? [...selectedSecondSpecials.filter(s => s !== 'Continuous')] : undefined,
      };

      setOrderItems(prev => [...prev, newOrderItem]);
      setCurrentOrder({});
      setSelectedSpecials([]);
      setSelectedSecondSpecials([]);
      setSideSpecials({});
      setVegSpecials({});
      setGraveySpecials({});
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

  const clearOrderSummary = () => {
    setOrderItems([]);
    setCustomerName('');
    setDeliveryAddress('');
    setPickupTime('');
    setDeliveryOption('pickup');
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
      
      // Format specials for main item
      let specialsText = '';
      if (order.specials && order.specials.length > 0) {
        if (order.menuItem.specialOption === 'select') {
          specialsText = ` with ${order.specials.join(' & ')}`;
        } else if (order.menuItem.specialOption === 'exclude') {
          specialsText = `\n    - ${order.specials.map(s => `No ${s}`).join('\n    - ')}`;
        }
      }
      
      if (order.isMix && order.secondMenuItem) {
        message += `- ${order.menuItem.name}${order.menuItem.specialOption === 'select' ? specialsText : ''}\n`;
        if (order.menuItem.specialOption === 'exclude' && specialsText) {
          message += `${specialsText}\n`;
        }
        
        // Format specials for second item
        let secondSpecialsText = '';
        if (order.secondMenuItemSpecials && order.secondMenuItemSpecials.length > 0) {
          if (order.secondMenuItem.specialOption === 'select') {
            secondSpecialsText = ` with ${order.secondMenuItemSpecials.join(' & ')}`;
          } else if (order.secondMenuItem.specialOption === 'exclude') {
            secondSpecialsText = `\n    - ${order.secondMenuItemSpecials.map(s => `No ${s}`).join('\n    - ')}`;
          }
        }
        
        message += `- ${order.secondMenuItem.name}${order.secondMenuItem.specialOption === 'select' ? secondSpecialsText : ''}\n`;
        if (order.secondMenuItem.specialOption === 'exclude' && secondSpecialsText) {
          message += `${secondSpecialsText}\n`;
        }
        
        message += `Mix ${order.selectedSize} [$${Math.round(order.selectedPrice)}] x ${order.quantity}\n`;
      } else {
        message += `- ${order.menuItem.name}${order.menuItem.specialOption === 'select' ? specialsText : ''} ${order.selectedSize} [$${Math.round(order.selectedPrice)}] x ${order.quantity}\n`;
        if (order.menuItem.specialOption === 'exclude' && specialsText) {
          message += `${specialsText}\n`;
        }
      }
      
      if (order.sides.length > 0) {
        message += 'Sides:\n';
        order.sides.forEach(side => {
          message += `- ${side.name}`;
          // Add side specials if any
          const sideSpecialsList = sideSpecials[side.name];
          if (sideSpecialsList && sideSpecialsList.length > 0) {
            if (side.specialOption === 'select') {
              message += ` with ${sideSpecialsList.join(' & ')}`;
            } else if (side.specialOption === 'exclude') {
              message += `\n    - ${sideSpecialsList.map(s => `No ${s}`).join('\n    - ')}`;
            }
          }
          message += '\n';
        });
      }
      
      if (order.vegetables.length > 0) {
        message += 'Vegetables:\n';
        order.vegetables.forEach(veg => {
          message += `- ${veg.name}`;
          // Add veg specials if any
          const vegSpecialsList = vegSpecials[veg.name];
          if (vegSpecialsList && vegSpecialsList.length > 0) {
            if (veg.specialOption === 'select') {
              message += ` with ${vegSpecialsList.join(' & ')}`;
            } else if (veg.specialOption === 'exclude') {
              message += `\n    - ${vegSpecialsList.map(s => `No ${s}`).join('\n    - ')}`;
            }
          }
          message += '\n';
        });
      }

      if (order.gravey.length > 0) {
        message += 'Gravey:\n';
        order.gravey.forEach(gravey => {
          message += `- ${gravey.name}`;
          // Add gravey specials if any
          const graveySpecialsList = graveySpecials[gravey.name];
          if (graveySpecialsList && graveySpecialsList.length > 0) {
            if (gravey.specialOption === 'select') {
              message += ` with ${graveySpecialsList.join(' & ')}`;
            } else if (gravey.specialOption === 'exclude') {
              message += `\n    - ${graveySpecialsList.map(s => `No ${s}`).join('\n    - ')}`;
            }
          }
          message += '\n';
        });
      }
      
      if (order.drink) {
        const drinkPrice = Object.values(order.drink.prices)[0] || 0;
        message += `Drink: ${order.drink.name} [$${Math.round(drinkPrice)}] x ${order.quantity}\n`;
      }
    });

    const total = calculateTotal();
    message += `\nTotal: $${Math.round(total)}`;
    
    if (deliveryOption === 'delivery' && restaurant.hasDelivery) {
      message += ` (includes $${Math.round(restaurant.deliveryPrice)} delivery fee)`;
    }

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${restaurant.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Clear order summary after sending
    clearOrderSummary();
    
    toast({
      title: "Order sent",
      description: "Your order has been sent via WhatsApp and the order summary has been cleared.",
    });
  };

  // Helper function to handle special selection for sides/veg/gravey
  const handleItemSpecialSelection = (
    item: MenuItem, 
    category: 'sides' | 'veg' | 'gravey',
    specialsState: {[itemName: string]: string[]},
    setSpecialsState: React.Dispatch<React.SetStateAction<{[itemName: string]: string[]}>>
  ) => {
    const currentSpecials = specialsState[item.name] || [];
    const toggleSpecial = (special: string) => {
      const isSelected = currentSpecials.includes(special);
      let newSpecials;
      
      if (isSelected) {
        newSpecials = currentSpecials.filter(s => s !== special);
      } else {
        // Check special cap
        if (typeof item.specialCap === 'number' && currentSpecials.length >= item.specialCap) {
          toast({
            title: "Selection limit reached",
            description: `You can only select up to ${item.specialCap} options.`,
            variant: "destructive",
          });
          return;
        }
        newSpecials = [...currentSpecials, special];
      }
      
      setSpecialsState(prev => ({
        ...prev,
        [item.name]: newSpecials
      }));
    };

    return toggleSpecial;
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
        <AddItemsSection
          groupedItems={groupedItems}
          availableCategories={availableCategories}
          fixedCategories={fixedCategories}
          onAddItem={handleAddItem}
        />

        <OrderSummary
          orderItems={orderItems}
          onClearAll={() => setOrderItems([])}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeOrderItem}
          total={calculateTotal()}
        />

        <CustomerDetailsForm
          customerName={customerName}
          setCustomerName={setCustomerName}
          deliveryOption={deliveryOption}
          setDeliveryOption={setDeliveryOption}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          pickupTime={pickupTime}
          setPickupTime={setPickupTime}
          restaurant={restaurant}
          orderItems={orderItems}
          onSendOrder={handleSendOrder}
        />
      </div>

      <SizeSelectionDialog
        open={showSizeDialog}
        onOpenChange={setShowSizeDialog}
        selectedMenuItem={selectedMenuItem}
        onSizeSelection={handleSizeSelection}
      />

      <OrderBuilderDialog
        open={showOrderBuilder}
        onOpenChange={setShowOrderBuilder}
        currentOrder={currentOrder}
        setCurrentOrder={setCurrentOrder}
        selectedCategory={selectedCategory}
        groupedItems={groupedItems}
        fixedCategories={fixedCategories}
        availableCategories={availableCategories}
        selectedSpecials={selectedSpecials}
        setSelectedSpecials={setSelectedSpecials}
        selectedSecondSpecials={selectedSecondSpecials}
        setSelectedSecondSpecials={setSelectedSecondSpecials}
        sideSpecials={sideSpecials}
        setSideSpecials={setSideSpecials}
        vegSpecials={vegSpecials}
        setVegSpecials={setVegSpecials}
        graveySpecials={graveySpecials}
        setGraveySpecials={setGraveySpecials}
        onCompleteOrder={handleCompleteOrder}
        handleItemSpecialSelection={handleItemSpecialSelection}
      />
    </div>
  );
};
