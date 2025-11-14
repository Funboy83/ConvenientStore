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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { AddAttributeDialog } from './add-attribute-dialog';
import { useToast } from '@/hooks/use-toast';

interface AddAttributeToProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export function AddAttributeToProductDialog({ 
  open, 
  onOpenChange,
  product 
}: AddAttributeToProductDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAddAttributeOpen, setIsAddAttributeOpen] = useState(false);
  
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [attributeValue, setAttributeValue] = useState('');
  const [attributePairs, setAttributePairs] = useState<Array<{key: string, value: string}>>([]);

  // Fetch all attributes
  const attributesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'productAttributes');
  }, [firestore]);
  const { data: attributes } = useCollection(attributesQuery);

  // Load existing attributes when product changes
  useEffect(() => {
    if (product?.attributes && Array.isArray(product.attributes)) {
      setAttributePairs(product.attributes.map((attr: any) => ({
        key: attr.key || attr.attributeName,
        value: attr.value || attr.attributeValue
      })));
    } else {
      setAttributePairs([]);
    }
  }, [product]);

  // Get available values for selected attribute
  const selectedAttributeData = attributes?.find((attr: any) => attr.name === selectedAttribute);
  const availableValues = selectedAttributeData?.values || [];

  const handleAddAttributePair = () => {
    if (selectedAttribute && attributeValue) {
      // Check if this attribute already exists
      const exists = attributePairs.some(pair => pair.key === selectedAttribute && pair.value === attributeValue);
      if (exists) {
        toast({
          variant: 'destructive',
          title: 'Duplicate Attribute',
          description: 'This attribute value is already added.',
        });
        return;
      }

      setAttributePairs([...attributePairs, { key: selectedAttribute, value: attributeValue }]);
      setSelectedAttribute('');
      setAttributeValue('');
    }
  };

  const handleRemovePair = (index: number) => {
    setAttributePairs(attributePairs.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!firestore || !product) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Product information is missing.',
      });
      return;
    }

    if (attributePairs.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add at least one attribute.',
      });
      return;
    }

    try {
      const productRef = doc(firestore, 'products', product.id);
      
      // Get the first attribute to append to product name
      const firstAttribute = attributePairs[0];
      const newName = `${product.name} - ${firstAttribute.value}`;
      
      // Rename product and add attributes array (keeps all existing data: stock, price, etc.)
      await updateDoc(productRef, {
        name: newName,
        attributes: attributePairs,
      });

      toast({
        title: 'Product Updated',
        description: `Product renamed to "${newName}" with attributes added.`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update product.',
      });
    }
  };

  const handleCancel = () => {
    // Reset to original product attributes
    if (product?.attributes && Array.isArray(product.attributes)) {
      setAttributePairs(product.attributes.map((attr: any) => ({
        key: attr.key || attr.attributeName,
        value: attr.value || attr.attributeValue
      })));
    } else {
      setAttributePairs([]);
    }
    setSelectedAttribute('');
    setAttributeValue('');
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Attributes to {product?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Add characteristics such as flavor, color, size, or smell to this product. When you add attributes, the product will automatically become a parent product with variants.
              </p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium mb-2">Attribute Type</Label>
                    <Select value={selectedAttribute} onValueChange={(value) => {
                      setSelectedAttribute(value);
                      setAttributeValue('');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select attribute type" />
                      </SelectTrigger>
                      <SelectContent>
                        {attributes && attributes.length > 0 ? (
                          attributes.map((attr: any) => (
                            <SelectItem key={attr.id} value={attr.name}>
                              {attr.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No attributes available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2">Value</Label>
                    {availableValues.length > 0 ? (
                      <Select value={attributeValue} onValueChange={setAttributeValue}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableValues.map((value: string) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Enter value"
                        value={attributeValue}
                        onChange={(e) => setAttributeValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddAttributePair();
                          }
                        }}
                      />
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddAttributePair}
                  disabled={!selectedAttribute || !attributeValue}
                  className="w-full"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Attribute
                </Button>
              </div>

              {/* Display added attribute pairs */}
              {attributePairs.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium">Added Attributes:</Label>
                  {attributePairs.map((pair, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{pair.key}:</span>
                        <span className="text-sm ml-2">{pair.value}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePair(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-blue-600"
                  onClick={() => setIsAddAttributeOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Create new attribute type
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested Modal for Creating New Attribute Types */}
      <AddAttributeDialog 
        open={isAddAttributeOpen} 
        onOpenChange={setIsAddAttributeOpen}
      />
    </>
  );
}
