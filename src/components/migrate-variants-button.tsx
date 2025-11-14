'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function MigrateVariantsButton() {
  const [isMigrating, setIsMigrating] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleMigrate = async () => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized',
      });
      return;
    }

    const confirmed = window.confirm(
      'This will migrate old-style parent products to the new template system:\n\n' +
      '1. Find parent products (isParentProduct=true)\n' +
      '2. Convert them to NON-SELLABLE templates (isSellable: false)\n' +
      '3. Variants remain as sellable products\n\n' +
      'This cannot be undone. Continue?'
    );

    if (!confirmed) return;

    setIsMigrating(true);

    try {
      // Get all products
      const productsRef = collection(firestore, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const products: any[] = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Find all parent products (old style)
      const parentProducts: any[] = products.filter((p: any) => p.isParentProduct === true);
      
      let migratedCount = 0;
      let errorCount = 0;

      for (const parent of parentProducts) {
        try {
          // Find children of this parent
          const children = products.filter((p: any) => p.parentProductId === parent.id);

          if (children.length === 0) {
            // Parent with no children - just remove isParentProduct flag
            const parentRef = doc(firestore, 'products', parent.id);
            await updateDoc(parentRef, {
              isParentProduct: false,
              isSellable: true, // Make it sellable since it has no variants
            });
            console.log(`Removed isParentProduct flag from ${parent.name} (no children)`);
            continue;
          }

          console.log(`Migrating: ${parent.name}`);
          console.log(`  Has ${children.length} child variants`);

          // Convert parent to NON-SELLABLE TEMPLATE
          const parentRef = doc(firestore, 'products', parent.id);
          await updateDoc(parentRef, {
            isSellable: false, // Mark as template (not sellable in POS)
            isParentProduct: true, // Keep flag for backward compatibility
            onHand: 0, // Templates don't have stock
          });

          // Make sure all children are marked as SELLABLE
          for (const child of children) {
            const childRef = doc(firestore, 'products', child.id);
            await updateDoc(childRef, {
              isSellable: true, // Ensure variants are sellable
              isParentProduct: false,
            });
          }

          migratedCount++;
          console.log(`✓ Successfully migrated ${parent.name} to template with ${children.length} sellable variants`);

        } catch (error) {
          console.error(`Error migrating ${parent.name}:`, error);
          errorCount++;
        }
      }

      toast({
        title: 'Migration Complete',
        description: `Successfully migrated ${migratedCount} product groups. ${errorCount > 0 ? `${errorCount} errors encountered.` : ''}`,
      });

    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        variant: 'destructive',
        title: 'Migration Failed',
        description: error.message || 'An error occurred during migration',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleMigrate}
      disabled={isMigrating}
      className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
    >
      {isMigrating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Migrating...
        </>
      ) : (
        <>
          🔄 Migrate Old Variants to New System
        </>
      )}
    </Button>
  );
}
