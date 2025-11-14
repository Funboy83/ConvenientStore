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
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AddVariantProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentProduct: any;
}

export function AddVariantProductDialog({ 
  open, 
  onOpenChange,
  parentProduct 
}: AddVariantProductDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [variantName, setVariantName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [onHand, setOnHand] = useState('');

  // Reset form when dialog opens or parent changes
  useEffect(() => {
    if (open && parentProduct) {
      // Reset to parent product defaults
      setBarcode(parentProduct.barcode || ''); // Initialize with parent barcode
      setCostPrice(parentProduct.costPrice?.toString() || '');
      setSellingPrice(parentProduct.sellingPrice?.toString() || '');
      setOnHand('0');
      
      // Clear selected attributes
      const initialAttrs: Record<string, string> = {};
      if (parentProduct.attributes && Array.isArray(parentProduct.attributes)) {
        parentProduct.attributes.forEach((attr: any) => {
          const attrName = attr.attributeName || attr.key;
          initialAttrs[attrName] = '';
        });
      }
      setSelectedAttributes(initialAttrs);
    }
  }, [open, parentProduct]);

  // Auto-generate variant name based on selected attributes
  useEffect(() => {
    if (parentProduct) {
      // Extract base name (remove existing attribute from parent name)
      // "HAT DUA - vang" → "HAT DUA"
      const baseName = parentProduct.name.includes(' - ') 
        ? parentProduct.name.substring(0, parentProduct.name.lastIndexOf(' - '))
        : parentProduct.name;
      
      const attributeValues = Object.values(selectedAttributes).filter(v => v);
      if (attributeValues.length > 0) {
        setVariantName(`${baseName} - ${attributeValues.join(' ')}`);
      } else {
        setVariantName('');
      }
    }
  }, [selectedAttributes, parentProduct]);

  // Get unique attribute names from parent
  const getParentAttributes = () => {
    if (!parentProduct?.attributes || !Array.isArray(parentProduct.attributes)) {
      return [];
    }
    
    // Group attributes by name to get unique attribute types
    const attrMap = new Map<string, Set<string>>();
    parentProduct.attributes.forEach((attr: any) => {
      const name = attr.attributeName || attr.key;
      const value = attr.attributeValue || attr.value;
      
      if (!attrMap.has(name)) {
        attrMap.set(name, new Set());
      }
      attrMap.get(name)!.add(value);
    });
    
    return Array.from(attrMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values)
    }));
  };

  const handleAttributeChange = (attrName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attrName]: value
    }));
  };

  const handleSave = async () => {
    if (!firestore || !parentProduct) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Parent product information is missing.',
      });
      return;
    }

    console.log('Saving variant with barcode:', barcode); // Debug log

    // Validate all attributes are selected
    const attributes = getParentAttributes();
    const allSelected = attributes.every(attr => selectedAttributes[attr.name]);
    
    if (!allSelected) {
      toast({
        variant: 'destructive',
        title: 'Missing Attributes',
        description: 'Please select values for all attributes.',
      });
      return;
    }

    try {
      const productsRef = collection(firestore, 'products');
      
      // Build attributes array
      const attributesArray = Object.entries(selectedAttributes).map(([key, value]) => ({
        attributeName: key,
        attributeValue: value
      }));

      // Create variant product with own stock and pricing
      const variantData: any = {
        name: variantName,
        barcode: barcode || parentProduct.barcode || '', // Inherit or use different barcode
        attributes: attributesArray, // Store selected attribute combination
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        onHand: parseInt(onHand) || 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add optional fields if they exist in parent
      if (parentProduct.category) variantData.category = parentProduct.category;
      if (parentProduct.brand) variantData.brand = parentProduct.brand;
      if (parentProduct.image) variantData.image = parentProduct.image;
      if (parentProduct.imageUrl) variantData.imageUrl = parentProduct.imageUrl;
      if (parentProduct.imageHint) variantData.imageHint = parentProduct.imageHint;
      if (parentProduct.description) variantData.description = parentProduct.description;
      if (parentProduct.manageByLot) variantData.manageByLot = parentProduct.manageByLot;
      if (parentProduct.position) variantData.position = parentProduct.position;
      if (parentProduct.weight) variantData.weight = parentProduct.weight;
      if (parentProduct.weightUnit) variantData.weightUnit = parentProduct.weightUnit;

      await addDoc(productsRef, variantData);

      toast({
        title: 'Success',
        description: `Variant product "${variantName}" created successfully.`,
      });
      
      // Reset and close
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating variant product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create variant product.',
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const parentAttributes = getParentAttributes();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Additional Variant</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Create additional variant for the same product group as <strong>{parentProduct?.name}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Display parent product image */}
          {parentProduct?.image && (
            <div className="flex justify-center">
              <img 
                src={parentProduct.image} 
                alt={parentProduct.name}
                className="h-32 w-32 object-cover rounded-lg border"
              />
            </div>
          )}

          {/* Attribute Selection */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label className="text-base font-semibold">Select or Enter Attribute Values</Label>
            <p className="text-sm text-muted-foreground">
              Choose from existing values or type new ones
            </p>
            
            {parentAttributes.map((attr) => (
              <div key={attr.name}>
                <Label className="text-sm font-medium mb-2">{attr.name}</Label>
                <div className="space-y-1">
                  <Input
                    type="text"
                    list={`${attr.name}-options`}
                    value={selectedAttributes[attr.name] || ''}
                    onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                    placeholder={`Select or type ${attr.name}`}
                    className="w-full"
                  />
                  <datalist id={`${attr.name}-options`}>
                    {attr.values.map((value) => (
                      <option key={value} value={value} />
                    ))}
                  </datalist>
                  {attr.values.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Existing: {attr.values.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Auto-generated Product Name */}
          <div>
            <Label className="text-sm font-medium mb-2">Product Name (Auto-generated)</Label>
            <Input
              value={variantName}
              disabled
              className="bg-muted"
              placeholder="Select attributes to generate name"
            />
          </div>

          {/* Barcode - Editable */}
          <div>
            <Label className="text-sm font-medium mb-2">Barcode</Label>
            <Input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter barcode (can be different from parent)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can use the same barcode as parent or enter a different one
            </p>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2">Cost Price</Label>
              <Input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2">Selling Price</Label>
              <Input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Stock */}
          <div>
            <Label className="text-sm font-medium mb-2">Initial Stock (On Hand)</Label>
            <Input
              type="number"
              value={onHand}
              onChange={(e) => setOnHand(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Info about inherited fields */}
          <div className="p-3 bg-muted rounded text-sm">
            <p className="font-medium mb-1">Inherited from parent:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Category: {parentProduct?.category || 'None'}</li>
              <li>• Brand: {parentProduct?.brand || 'None'}</li>
              <li>• Image: Same as parent</li>
              <li>• Other settings (weight, position, etc.)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={!variantName || !Object.values(selectedAttributes).every(v => v)}
          >
            Save & Add New Variant Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
