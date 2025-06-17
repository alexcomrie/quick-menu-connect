
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MenuItem } from '../../types/restaurant';

interface SizeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMenuItem: MenuItem | null;
  onSizeSelection: (size: string) => void;
}

export const SizeSelectionDialog: React.FC<SizeSelectionDialogProps> = ({
  open,
  onOpenChange,
  selectedMenuItem,
  onSizeSelection,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Size</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {selectedMenuItem && Object.entries(selectedMenuItem.prices).map(([size, price]) => (
            <Button
              key={size}
              onClick={() => onSizeSelection(size)}
              variant="outline"
              className="w-full justify-between"
            >
              <span>{size}</span>
              <span>${Math.round(price)}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
