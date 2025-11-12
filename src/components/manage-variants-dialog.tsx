'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Edit, Check, X } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import type { Variant } from '@/lib/types';

interface ManageVariantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  sharedBarcode: string;
}

export function ManageVariantsDialog({ 
  open, 
  onOpenChange,
  productId,
  productName,
  sharedBarcode
}: ManageVariantsDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  // Form state for new variant
  const [variantName, setVariantName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [sku, setSku] = useState('');
  
  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Variant>>({});

  // Fetch existing variants for this product
  const variantsQuery = useMemoFirebase(() => {
    if (!firestore || !productId) return null;
    const variantsRef = collection(firestore, 'variants');
    return query(variantsRef, where('productId', '==', productId));
  }, [firestore, productId]);

  const { data: variants } = useCollection(variantsQuery);

  const handleAddVariant = async () => {
    if (!variantName || !sellingPrice) {
      toast({
        title: 'Missing information',
        description: 'Please provide at least variant name and selling price.',
        variant: 'destructive',
      });
      return;
    }

    if (!firestore) return;

    try {
      const fullName = `${productName} - ${variantName}`;
      const variantData = {
        productId,
        variantName,
        fullName,
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice),
        stockQuantity: parseInt(stockQuantity) || 0,
        sku: sku || undefined,
        isActive: true,
        createdAt: new Date(),
      };

      await addDoc(collection(firestore, 'variants'), variantData);
      
      // Clear form
      setVariantName('');
      setCostPrice('');
      setSellingPrice('');
      setStockQuantity('');
      setSku('');

      toast({
        title: 'Variant added',
        description: `${fullName} has been created.`,
      });

      // Dialog will auto-update when collection changes
    } catch (error) {
      console.error('Error adding variant:', error);
      toast({
        title: 'Error',
        description: 'Failed to add variant.',
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (variant: any) => {
    setEditingId(variant.id);
    setEditFormData({
      variantName: variant.variantName,
      costPrice: variant.costPrice,
      sellingPrice: variant.sellingPrice,
      stockQuantity: variant.stockQuantity,
      sku: variant.sku,
    });
  };

  const handleSaveEdit = async (variantId: string) => {
    if (!firestore) return;

    try {
      const fullName = `${productName} - ${editFormData.variantName}`;
      const variantRef = doc(firestore, 'variants', variantId);
      await updateDoc(variantRef, {
        variantName: editFormData.variantName,
        fullName,
        costPrice: editFormData.costPrice,
        sellingPrice: editFormData.sellingPrice,
        stockQuantity: editFormData.stockQuantity,
        sku: editFormData.sku,
        updatedAt: new Date(),
      });

      setEditingId(null);
      setEditFormData({});

      toast({
        title: 'Variant updated',
        description: 'Changes have been saved.',
      });

      // Dialog will auto-update when collection changes
    } catch (error) {
      console.error('Error updating variant:', error);
      toast({
        title: 'Error',
        description: 'Failed to update variant.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleDeleteVariant = async (variantId: string, variantName: string) => {
    if (!firestore) return;
    
    if (!confirm(`Are you sure you want to delete "${variantName}"?`)) {
      return;
    }

    try {
      const variantRef = doc(firestore, 'variants', variantId);
      await deleteDoc(variantRef);

      toast({
        title: 'Variant deleted',
        description: `${variantName} has been removed.`,
      });

      // Dialog will auto-update when collection changes
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete variant.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Variants: {productName}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Shared Barcode: <strong>{sharedBarcode}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add New Variant Form */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-lg">Add New Variant</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="variantName">Variant Name *</Label>
                <Input
                  id="variantName"
                  placeholder="e.g., Rose"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sellingPrice">Selling Price *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="stockQuantity">Stock</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  placeholder="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  placeholder="Optional"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleAddVariant} className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </div>

          {/* Existing Variants Table */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Existing Variants</h3>
            {variants && variants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant Name</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant: any) => (
                    <TableRow key={variant.id}>
                      {editingId === variant.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={editFormData.variantName}
                              onChange={(e) => setEditFormData({ ...editFormData, variantName: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            {productName} - {editFormData.variantName}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={editFormData.costPrice}
                              onChange={(e) => setEditFormData({ ...editFormData, costPrice: parseFloat(e.target.value) })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={editFormData.sellingPrice}
                              onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: parseFloat(e.target.value) })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={editFormData.stockQuantity}
                              onChange={(e) => setEditFormData({ ...editFormData, stockQuantity: parseInt(e.target.value) })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editFormData.sku}
                              onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(variant.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{variant.variantName}</TableCell>
                          <TableCell>{variant.fullName}</TableCell>
                          <TableCell>${variant.costPrice?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>${variant.sellingPrice?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>{variant.stockQuantity || 0}</TableCell>
                          <TableCell>{variant.sku || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => handleEditClick(variant)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleDeleteVariant(variant.id, variant.fullName)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No variants yet. Add your first variant above.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
