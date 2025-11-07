'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PriceBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductPrice {
  id: string;
  name: string;
  productNumber: string;
  costPrice: number;
  sellingPrice: number;
  newSellingPrice?: number;
}

export function PriceBookDialog({ open, onOpenChange }: PriceBookDialogProps) {
  const [products, setProducts] = useState<ProductPrice[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductPrice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (open && firestore) {
      loadProducts();
    }
  }, [open, firestore]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.productNumber?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    if (!firestore) return;

    setIsLoading(true);
    try {
      const productsRef = collection(firestore, 'products');
      const snapshot = await getDocs(productsRef);

      const productsList: ProductPrice[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Product',
          productNumber: data.productNumber || '',
          costPrice: data.costPrice || 0,
          sellingPrice: data.sellingPrice || 0,
        };
      });

      setProducts(productsList);
      setFilteredProducts(productsList);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceChange = (productId: string, newPrice: string) => {
    const priceValue = parseFloat(newPrice) || 0;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, newSellingPrice: priceValue } : p
      )
    );
  };

  const handleSaveAll = async () => {
    if (!firestore) return;

    const productsToUpdate = products.filter((p) => p.newSellingPrice !== undefined);

    if (productsToUpdate.length === 0) {
      toast({
        title: 'No changes',
        description: 'No prices have been modified',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatePromises = productsToUpdate.map((product) => {
        const productRef = doc(firestore, 'products', product.id);
        return updateDoc(productRef, {
          sellingPrice: product.newSellingPrice,
          updatedAt: new Date().toISOString(),
        });
      });

      await Promise.all(updatePromises);

      toast({
        title: 'Success',
        description: `Updated ${productsToUpdate.length} product prices`,
      });

      // Refresh products
      await loadProducts();
    } catch (error) {
      console.error('Error updating prices:', error);
      toast({
        title: 'Error',
        description: 'Failed to update some prices',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateMargin = (cost: number, selling: number): string => {
    if (cost === 0) return '0';
    return (((selling - cost) / selling) * 100).toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Price Book</DialogTitle>
          <DialogDescription>
            Update selling prices for your products. Changes are saved immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Products Table */}
          <ScrollArea className="h-[400px] border rounded-md">
            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 pb-2 border-b font-semibold text-sm">
                    <div className="col-span-3">Product</div>
                    <div className="col-span-2">Product #</div>
                    <div className="col-span-2 text-right">Cost Price</div>
                    <div className="col-span-2 text-right">Current Price</div>
                    <div className="col-span-2 text-right">New Price</div>
                    <div className="col-span-1 text-right">Margin</div>
                  </div>

                  {/* Product Rows */}
                  {filteredProducts.map((product) => {
                    const newPrice = product.newSellingPrice ?? product.sellingPrice;
                    const margin = calculateMargin(product.costPrice, newPrice);

                    return (
                      <div
                        key={product.id}
                        className="grid grid-cols-12 gap-4 py-2 border-b items-center hover:bg-muted/50"
                      >
                        <div className="col-span-3 text-sm font-medium truncate">
                          {product.name}
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {product.productNumber}
                        </div>
                        <div className="col-span-2 text-right text-sm">
                          ${product.costPrice.toFixed(2)}
                        </div>
                        <div className="col-span-2 text-right text-sm font-medium">
                          ${product.sellingPrice.toFixed(2)}
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={product.sellingPrice.toFixed(2)}
                            value={product.newSellingPrice ?? ''}
                            onChange={(e) => handlePriceChange(product.id, e.target.value)}
                            className="h-8 text-right"
                          />
                        </div>
                        <div className="col-span-1 text-right text-sm">
                          <span
                            className={
                              parseFloat(margin) < 20
                                ? 'text-red-600'
                                : parseFloat(margin) < 30
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }
                          >
                            {margin}%
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Summary */}
          <div className="text-sm text-muted-foreground">
            {products.filter((p) => p.newSellingPrice !== undefined).length > 0 && (
              <div className="text-blue-600 font-medium">
                {products.filter((p) => p.newSellingPrice !== undefined).length} price(s) modified
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving || isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
