'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { AddUnitDialog } from './add-unit-dialog';

interface AddUnitToProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export function AddUnitToProductDialog({ open, onOpenChange, product }: AddUnitToProductDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);

  // Fetch units from Firestore
  const { data: units } = useCollection(
    useMemoFirebase(() => firestore ? collection(firestore, 'units') : null, [firestore])
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (open && product) {
      setWeight(product.weight?.toString() || '');
      setSelectedUnit(product.weightUnit || '');
    }
  }, [open, product]);

  const handleSave = async () => {
    if (!firestore || !product) return;

    if (!selectedUnit) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a unit.',
      });
      return;
    }

    try {
      const productRef = doc(firestore, 'products', product.id);
      await updateDoc(productRef, {
        weight: parseFloat(weight) || 0,
        weightUnit: selectedUnit,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Unit Updated',
        description: `Product weight unit has been updated to ${selectedUnit}.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating unit:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update unit. Please try again.',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add/Update Unit for {product?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight/Quantity</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                placeholder="Enter weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="unit">Unit</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddUnitOpen(true)}
                  className="h-auto p-1 text-xs"
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  New Unit
                </Button>
              </div>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units && units.length > 0 ? (
                    units.map((u: any) => (
                      <SelectItem key={u.id} value={u.abbreviation}>
                        {u.name} ({u.abbreviation})
                      </SelectItem>
                    ))
                  ) : (
                    <div 
                      className="p-2 text-sm text-muted-foreground hover:text-primary cursor-pointer hover:bg-muted"
                      onClick={() => {
                        onOpenChange(false);
                        setIsAddUnitOpen(true);
                      }}
                    >
                      No units. Click to add →
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddUnitDialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen} />
    </>
  );
}
