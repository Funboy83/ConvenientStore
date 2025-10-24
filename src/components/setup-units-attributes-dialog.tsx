'use client';

import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { AddAttributeDialog } from './add-attribute-dialog';
import { AddUnitDialog } from './add-unit-dialog';

interface SetupUnitsAttributesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: any) => void;
}

export function SetupUnitsAttributesDialog({ 
  open, 
  onOpenChange,
  onSave 
}: SetupUnitsAttributesDialogProps) {
  const firestore = useFirestore();
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddAttributeOpen, setIsAddAttributeOpen] = useState(false);
  
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [attributeValue, setAttributeValue] = useState('');
  const [attributePairs, setAttributePairs] = useState<Array<{attribute: string, value: string}>>([]);

  // Fetch all attributes
  const attributesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'productAttributes');
  }, [firestore]);
  const { data: attributes } = useCollection(attributesQuery);

  // Fetch all units
  const unitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'units');
  }, [firestore]);
  const { data: units } = useCollection(unitsQuery);

  const handleAddAttributePair = () => {
    if (selectedAttribute && attributeValue) {
      setAttributePairs([...attributePairs, { attribute: selectedAttribute, value: attributeValue }]);
      setSelectedAttribute('');
      setAttributeValue('');
    }
  };

  const handleRemovePair = (index: number) => {
    setAttributePairs(attributePairs.filter((_, i) => i !== index));
  };

  const handleDone = () => {
    if (onSave) {
      onSave(attributePairs);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    setAttributePairs([]);
    setSelectedAttribute('');
    setAttributeValue('');
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Set up units and attributes</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Unit Section */}
            <div>
              <Label className="text-base font-semibold">Unit</Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Add units for sales or purchase such as bottle, pack, box. Set conversion formulas to quickly calculate price and stock. For example: 1 pack = 4 bottles, 1 box = 20 packs.
              </p>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-blue-600"
                onClick={() => setIsAddUnitOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add basic unit
              </Button>
            </div>

            {/* Attributes Section */}
            <div>
              <Label className="text-base font-semibold">Attributes</Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Add characteristics such as flavor, volume, color
              </p>
              
              <div className="flex items-center gap-2 mb-3">
                <Select value={selectedAttribute} onValueChange={setSelectedAttribute}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {attributes && attributes.length > 0 ? (
                      attributes.map((attr: any) => (
                        <SelectItem key={attr.id} value={attr.name}>
                          {attr.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No attributes. Create one below.</div>
                    )}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Enter value and press Enter"
                  value={attributeValue}
                  onChange={(e) => setAttributeValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAttributePair();
                    }
                  }}
                  className="flex-1"
                />

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddAttributePair}
                >
                  Quick select
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setAttributePairs([]);
                    setSelectedAttribute('');
                    setAttributeValue('');
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Display added attribute pairs */}
              {attributePairs.length > 0 && (
                <div className="space-y-2 mb-3">
                  {attributePairs.map((pair, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="flex-1 text-sm">
                        <strong>{pair.attribute}:</strong> {pair.value}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePair(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-blue-600"
                onClick={() => setIsAddAttributeOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Create attribute
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleDone}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested Modals */}
      <AddAttributeDialog 
        open={isAddAttributeOpen} 
        onOpenChange={setIsAddAttributeOpen}
      />
      <AddUnitDialog 
        open={isAddUnitOpen} 
        onOpenChange={setIsAddUnitOpen}
      />
    </>
  );
}
