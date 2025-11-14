'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CleanupDuplicateProductsButton() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products } = useCollection(productsQuery);

  const findDuplicates = () => {
    if (!products) return;

    // Find products with same name but different IDs (potential duplicates)
    const nameMap = new Map<string, any[]>();
    
    products.forEach((p: any) => {
      const key = `${p.name}-${p.barcode || 'no-barcode'}`;
      if (!nameMap.has(key)) {
        nameMap.set(key, []);
      }
      nameMap.get(key)!.push(p);
    });

    // Find duplicates
    const found: any[] = [];
    nameMap.forEach((prods, key) => {
      if (prods.length > 1) {
        // Keep the newest one, mark others as duplicates
        prods.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Skip the first (newest) one, mark rest as duplicates
        for (let i = 1; i < prods.length; i++) {
          found.push(prods[i]);
        }
      }
    });

    setDuplicates(found);
    
    if (found.length > 0) {
      setShowConfirm(true);
    } else {
      toast({
        title: 'No Duplicates Found',
        description: 'Your products database looks clean!',
      });
    }
  };

  const handleCleanup = async () => {
    if (!firestore || duplicates.length === 0) return;

    setIsProcessing(true);
    setShowConfirm(false);

    try {
      let deleted = 0;
      for (const dup of duplicates) {
        try {
          await deleteDoc(doc(firestore, 'products', dup.id));
          deleted++;
        } catch (error) {
          console.error(`Failed to delete duplicate ${dup.id}:`, error);
        }
      }

      toast({
        title: 'Cleanup Complete',
        description: `Removed ${deleted} duplicate product(s). The page will refresh.`,
      });

      // Refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error('Error cleaning up:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to clean up duplicates.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        onClick={findDuplicates}
        disabled={isProcessing}
        variant="outline"
        className="bg-orange-50 border-orange-300 hover:bg-orange-100"
      >
        {isProcessing ? 'Cleaning...' : '🔍 Find & Remove Duplicate Products'}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Found {duplicates.length} Duplicate Product(s)</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-4">
                <p>The following duplicate products were found:</p>
                <ul className="list-disc list-inside space-y-1 max-h-60 overflow-y-auto">
                  {duplicates.map((dup) => (
                    <li key={dup.id} className="text-sm">
                      {dup.name} {dup.barcode ? `(${dup.barcode})` : ''}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-semibold">
                  These duplicates will be removed. The newest version of each product will be kept.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanup} className="bg-destructive hover:bg-destructive/90">
              Remove Duplicates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
