
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { MenuItem, OrderItem } from '../../types/restaurant';
import { useToast } from '@/hooks/use-toast';

interface OrderBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentOrder: Partial<OrderItem>;
  setCurrentOrder: React.Dispatch<React.SetStateAction<Partial<OrderItem>>>;
  selectedCategory: string;
  groupedItems: Record<string, MenuItem[]>;
  fixedCategories: string[];
  availableCategories: string[];
  selectedSpecials: string[];
  setSelectedSpecials: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSecondSpecials: string[];
  setSelectedSecondSpecials: React.Dispatch<React.SetStateAction<string[]>>;
  sideSpecials: {[itemName: string]: string[]};
  setSideSpecials: React.Dispatch<React.SetStateAction<{[itemName: string]: string[]}>>;
  vegSpecials: {[itemName: string]: string[]};
  setVegSpecials: React.Dispatch<React.SetStateAction<{[itemName: string]: string[]}>>;
  graveySpecials: {[itemName: string]: string[]};
  setGraveySpecials: React.Dispatch<React.SetStateAction<{[itemName: string]: string[]}>>;
  onCompleteOrder: () => void;
  handleItemSpecialSelection: (
    item: MenuItem, 
    category: 'sides' | 'veg' | 'gravey',
    specialsState: {[itemName: string]: string[]},
    setSpecialsState: React.Dispatch<React.SetStateAction<{[itemName: string]: string[]}>>
  ) => (special: string) => void;
}

export const OrderBuilderDialog: React.FC<OrderBuilderDialogProps> = ({
  open,
  onOpenChange,
  currentOrder,
  setCurrentOrder,
  selectedCategory,
  groupedItems,
  fixedCategories,
  availableCategories,
  selectedSpecials,
  setSelectedSpecials,
  selectedSecondSpecials,
  setSelectedSecondSpecials,
  sideSpecials,
  setSideSpecials,
  vegSpecials,
  setVegSpecials,
  graveySpecials,
  setGraveySpecials,
  onCompleteOrder,
  handleItemSpecialSelection,
}) => {
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Order</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {currentOrder.menuItem && (
            <div>
              <h3 className="font-semibold">Selected Item</h3>
              <p>{currentOrder.menuItem.name} {currentOrder.selectedSize} - ${Math.round(currentOrder.selectedPrice || 0)}</p>
            </div>
          )}

          {/* Special Options for Main Item */}
          {currentOrder.menuItem && currentOrder.menuItem.specials && currentOrder.menuItem.specials.length > 0 && 
           !currentOrder.menuItem.specials.includes('Continuous') && (
            <div>
              <h3 className="font-semibold mb-2">
                {currentOrder.menuItem.specialOption === 'select' ? 'Select Options' : 'Exclude Options'}
                {typeof currentOrder.menuItem.specialCap === 'number' && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Max {currentOrder.menuItem.specialCap})
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {currentOrder.menuItem.specials.filter(special => special !== 'Continuous').map((special) => (
                  <div key={special} className="flex items-center space-x-2">
                    <Checkbox
                      id={`special-${special}`}
                      checked={selectedSpecials.includes(special)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          if (typeof currentOrder.menuItem?.specialCap === 'number' && 
                              selectedSpecials.length >= currentOrder.menuItem.specialCap) {
                            toast({
                              title: "Selection limit reached",
                              description: `You can only select up to ${currentOrder.menuItem.specialCap} options.`,
                              variant: "destructive",
                            });
                            return;
                          }
                          setSelectedSpecials(prev => [...prev, special]);
                        } else {
                          setSelectedSpecials(prev => prev.filter(s => s !== special));
                        }
                      }}
                    />
                    <Label htmlFor={`special-${special}`}>{special}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mix Food Selection - only for main dishes */}
          {selectedCategory === 'main' && (
            <div className="flex items-center space-x-2">
              <Switch
                id="mix-food"
                checked={currentOrder.isMix}
                onCheckedChange={(checked) => setCurrentOrder(prev => ({ 
                  ...prev, 
                  isMix: checked, 
                  secondMenuItem: undefined 
                }))}
              />
              <Label htmlFor="mix-food">Mix Food</Label>
            </div>
          )}

          {currentOrder.isMix && selectedCategory === 'main' && (
            <div>
              <h3 className="font-semibold mb-2">Select Second Main Dish</h3>
              <div className="grid grid-cols-2 gap-2">
                {(groupedItems.main || []).filter(item => 
                  item.name !== currentOrder.menuItem?.name && 
                  item.name.toLowerCase() !== 'continuous'
                ).map((item, index) => (
                  <Button
                    key={index}
                    variant={currentOrder.secondMenuItem?.name === item.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCurrentOrder(prev => ({
                        ...prev,
                        secondMenuItem: prev.secondMenuItem?.name === item.name ? undefined : item
                      }));
                      setSelectedSecondSpecials([]);
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Special Options for Second Item in Mix */}
          {currentOrder.isMix && currentOrder.secondMenuItem && 
           currentOrder.secondMenuItem.specials && currentOrder.secondMenuItem.specials.length > 0 && 
           !currentOrder.secondMenuItem.specials.includes('Continuous') && (
            <div>
              <h3 className="font-semibold mb-2">
                {currentOrder.secondMenuItem.specialOption === 'select' ? 'Select Options for Second Item' : 'Exclude Options for Second Item'}
                {typeof currentOrder.secondMenuItem.specialCap === 'number' && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Max {currentOrder.secondMenuItem.specialCap})
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {currentOrder.secondMenuItem.specials.filter(special => special !== 'Continuous').map((special) => (
                  <div key={special} className="flex items-center space-x-2">
                    <Checkbox
                      id={`second-special-${special}`}
                      checked={selectedSecondSpecials.includes(special)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          if (typeof currentOrder.secondMenuItem?.specialCap === 'number' && 
                              selectedSecondSpecials.length >= currentOrder.secondMenuItem.specialCap) {
                            toast({
                              title: "Selection limit reached",
                              description: `You can only select up to ${currentOrder.secondMenuItem.specialCap} options.`,
                              variant: "destructive",
                            });
                            return;
                          }
                          setSelectedSecondSpecials(prev => [...prev, special]);
                        } else {
                          setSelectedSecondSpecials(prev => prev.filter(s => s !== special));
                        }
                      }}
                    />
                    <Label htmlFor={`second-special-${special}`}>{special}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sides Selection */}
          {(groupedItems.sides || []).filter(item => item.name.toLowerCase() !== 'continuous').length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Select Sides</h3>
              <div className="space-y-2">
                {(groupedItems.sides || []).filter(item => item.name.toLowerCase() !== 'continuous').map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <Button
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
                          // Clear specials when unselecting item
                          if (exists) {
                            setSideSpecials(prev => {
                              const updated = { ...prev };
                              delete updated[item.name];
                              return updated;
                            });
                          }
                        }}
                        className="flex-1 mr-2"
                      >
                        {item.name}
                      </Button>
                    </div>
                    
                    {/* Show special selection for selected sides */}
                    {currentOrder.sides?.some(s => s.name === item.name) && 
                     item.specials && item.specials.length > 0 && 
                     !item.specials.includes('Continuous') && (
                      <div className="ml-4 mt-2 p-2 border rounded">
                        <h4 className="text-sm font-medium mb-1">
                          {item.specialOption === 'select' ? 'Select Options' : 'Exclude Options'}
                          {typeof item.specialCap === 'number' && (
                            <span className="text-xs text-gray-600 ml-1">(Max {item.specialCap})</span>
                          )}
                        </h4>
                        <div className="grid grid-cols-2 gap-1">
                          {item.specials.filter(special => special !== 'Continuous').map((special) => (
                            <div key={special} className="flex items-center space-x-1">
                              <Checkbox
                                id={`side-${item.name}-${special}`}
                                checked={(sideSpecials[item.name] || []).includes(special)}
                                onCheckedChange={(checked) => {
                                  const toggleSpecial = handleItemSpecialSelection(item, 'sides', sideSpecials, setSideSpecials);
                                  toggleSpecial(special);
                                }}
                              />
                              <Label htmlFor={`side-${item.name}-${special}`} className="text-xs">{special}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vegetables Selection */}
          {(groupedItems.veg || []).filter(item => item.name.toLowerCase() !== 'continuous').length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Select Vegetables</h3>
              <div className="space-y-2">
                {(groupedItems.veg || []).filter(item => item.name.toLowerCase() !== 'continuous').map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <Button
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
                          // Clear specials when unselecting item
                          if (exists) {
                            setVegSpecials(prev => {
                              const updated = { ...prev };
                              delete updated[item.name];
                              return updated;
                            });
                          }
                        }}
                        className="flex-1 mr-2"
                      >
                        {item.name}
                      </Button>
                    </div>
                    
                    {/* Show special selection for selected vegetables */}
                    {currentOrder.vegetables?.some(v => v.name === item.name) && 
                     item.specials && item.specials.length > 0 && 
                     !item.specials.includes('Continuous') && (
                      <div className="ml-4 mt-2 p-2 border rounded">
                        <h4 className="text-sm font-medium mb-1">
                          {item.specialOption === 'select' ? 'Select Options' : 'Exclude Options'}
                          {typeof item.specialCap === 'number' && (
                            <span className="text-xs text-gray-600 ml-1">(Max {item.specialCap})</span>
                          )}
                        </h4>
                        <div className="grid grid-cols-2 gap-1">
                          {item.specials.filter(special => special !== 'Continuous').map((special) => (
                            <div key={special} className="flex items-center space-x-1">
                              <Checkbox
                                id={`veg-${item.name}-${special}`}
                                checked={(vegSpecials[item.name] || []).includes(special)}
                                onCheckedChange={(checked) => {
                                  const toggleSpecial = handleItemSpecialSelection(item, 'veg', vegSpecials, setVegSpecials);
                                  toggleSpecial(special);
                                }}
                              />
                              <Label htmlFor={`veg-${item.name}-${special}`} className="text-xs">{special}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gravey Selection */}
          {(groupedItems.gravey || []).filter(item => item.name.toLowerCase() !== 'continuous').length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Select Gravey</h3>
              <div className="space-y-2">
                {(groupedItems.gravey || []).filter(item => item.name.toLowerCase() !== 'continuous').map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <Button
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
                          // Clear specials when unselecting item
                          if (exists) {
                            setGraveySpecials(prev => {
                              const updated = { ...prev };
                              delete updated[item.name];
                              return updated;
                            });
                          }
                        }}
                        className="flex-1 mr-2"
                      >
                        {item.name}
                      </Button>
                    </div>
                    
                    {/* Show special selection for selected gravey */}
                    {currentOrder.gravey?.some(g => g.name === item.name) && 
                     item.specials && item.specials.length > 0 && 
                     !item.specials.includes('Continuous') && (
                      <div className="ml-4 mt-2 p-2 border rounded">
                        <h4 className="text-sm font-medium mb-1">
                          {item.specialOption === 'select' ? 'Select Options' : 'Exclude Options'}
                          {typeof item.specialCap === 'number' && (
                            <span className="text-xs text-gray-600 ml-1">(Max {item.specialCap})</span>
                          )}
                        </h4>
                        <div className="grid grid-cols-2 gap-1">
                          {item.specials.filter(special => special !== 'Continuous').map((special) => (
                            <div key={special} className="flex items-center space-x-1">
                              <Checkbox
                                id={`gravey-${item.name}-${special}`}
                                checked={(graveySpecials[item.name] || []).includes(special)}
                                onCheckedChange={(checked) => {
                                  const toggleSpecial = handleItemSpecialSelection(item, 'gravey', graveySpecials, setGraveySpecials);
                                  toggleSpecial(special);
                                }}
                              />
                              <Label htmlFor={`gravey-${item.name}-${special}`} className="text-xs">{special}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drinks Selection */}
          {(groupedItems.drink || []).filter(item => item.name.toLowerCase() !== 'continuous').length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Select Drink (Optional)</h3>
              <div className="grid grid-cols-1 gap-2">
                {(groupedItems.drink || []).filter(item => item.name.toLowerCase() !== 'continuous').map((item, index) => (
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
                    <span>${Math.round(Object.values(item.prices)[0] || 0)}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Categories */}
          {availableCategories
            .filter(category => !fixedCategories.includes(category))
            .map(category => {
              const items = groupedItems[category] || [];
              const itemsWithPrices = items.filter(item => 
                Object.keys(item.prices).length > 0 && 
                item.name.toLowerCase() !== 'continuous'
              );
              
              if (itemsWithPrices.length === 0) return null;
              
              const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
              
              return (
                <div key={category}>
                  <h3 className="font-semibold mb-2">Select {categoryTitle}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {itemsWithPrices.map((item, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // For dynamic categories, we can add them as sides for now
                          // This can be enhanced based on specific requirements
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
                        <div className="text-left">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            ${Math.round(Object.values(item.prices)[0] || 0)}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}

          <Button onClick={onCompleteOrder} className="w-full">
            Add to Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
