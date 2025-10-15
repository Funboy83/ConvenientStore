
'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddProductDialog } from '@/components/add-product-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products, isLoading } = useCollection(productsQuery);

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your product catalog."
      >
        <Button onClick={() => setIsAddProductOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Product
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            A list of all products in your catalog.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Attributes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  </TableRow>
                ))
              )}
              {!isLoading && products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{product.barcode}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.attributes?.map((attr: { key: string, value: string }) => (
                        <Badge key={attr.key} variant="secondary">
                          {attr.key}: {attr.value}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && products?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No products found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddProductDialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen} />
    </>
  );
}
