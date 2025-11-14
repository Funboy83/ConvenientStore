'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';

export function FixExistingParentProductsButton() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isProcessing, setIsProcessing] = useState(false);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products } = useCollection(productsQuery);

  const handleFix = async () => {
    if (!firestore || !products) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized or no products found.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Find products that have attributes but aren't marked as parent products
      const productsToFix = products.filter((p: any) => 
        p.attributes && 
        Array.isArray(p.attributes) && 
        p.attributes.length > 0 && 
        !p.isParentProduct &&
        !p.parentProductId // Not a child product
      );

      if (productsToFix.length === 0) {
        toast({
          title: 'No Products to Fix',
          description: 'All products with attributes are already marked as parent products.',
        });
        setIsProcessing(false);
        return;
      }

      // Update each product
      let fixed = 0;
      for (const product of productsToFix) {
        try {
          const productRef = doc(firestore, 'products', product.id);
          await updateDoc(productRef, {
            isParentProduct: true,
            onHand: 0, // Parent products don't have their own stock
          });
          fixed++;
        } catch (error) {
          console.error(`Failed to update product ${product.id}:`, error);
        }
      }

      toast({
        title: 'Success',
        description: `Fixed ${fixed} parent product(s). They are now marked as parent-only and their stock is set to 0.`,
      });

      // Refresh the page to see changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error('Error fixing products:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fix products.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Count products that need fixing
  const needsFixing = products?.filter((p: any) => 
    p.attributes && 
    Array.isArray(p.attributes) && 
    p.attributes.length > 0 && 
    !p.isParentProduct &&
    !p.parentProductId
  ).length || 0;

  if (needsFixing === 0) {
    return null; // Don't show button if nothing to fix
  }

  return (
    <Button
      onClick={handleFix}
      disabled={isProcessing}
      variant="outline"
      className="bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
    >
      {isProcessing ? 'Fixing...' : `Fix ${needsFixing} Existing Parent Product${needsFixing > 1 ? 's' : ''}`}
    </Button>
  );
}
