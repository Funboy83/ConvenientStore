'use client';

import { useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddSupplierDialog } from '@/components/add-supplier-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuppliersPage() {
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const firestore = useFirestore();

  const suppliersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'suppliers');
  }, [firestore]);

  const { data: suppliers, isLoading } = useCollection(suppliersQuery);

  const filteredSuppliers = suppliers?.filter((supplier: any) =>
    supplier.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.supplierNumber?.includes(searchQuery) ||
    supplier.phoneNumber?.includes(searchQuery)
  );

  // Calculate totals
  const totalCreditAmount = suppliers?.reduce((sum: number, s: any) => sum + (s.creditAmount || 0), 0) || 0;
  const totalPurchase = suppliers?.reduce((sum: number, s: any) => sum + (s.totalPurchaseAmount || 0), 0) || 0;

  return (
    <>
      <div className="space-y-4">
        {/* Header with search and actions */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="By number, name, phone no."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <span className="mr-2">⚖️</span>
            </Button>
            <Button onClick={() => setIsAddSupplierOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Supplier
            </Button>
            <Button variant="outline">Import file</Button>
            <Button variant="outline">Export file</Button>
            <Button variant="outline" size="icon">
              <span>☰</span>
            </Button>
            <Button variant="outline" size="icon">
              <span>⚙️</span>
            </Button>
            <Button variant="outline" size="icon">
              <span>?</span>
            </Button>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="border rounded-lg bg-white">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium">
            <div className="col-span-1 flex items-center gap-2">
              <input type="checkbox" className="rounded" />
            </div>
            <div className="col-span-2">Supplier number</div>
            <div className="col-span-3">Supplier name</div>
            <div className="col-span-2">Phone number</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-1 text-right">Supplier's credit amount</div>
            <div className="col-span-1 text-right">Total purchase</div>
          </div>

          {/* Summary Row */}
          {!isLoading && suppliers && suppliers.length > 0 && (
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b bg-blue-50 font-medium">
              <div className="col-span-1"></div>
              <div className="col-span-2"></div>
              <div className="col-span-3"></div>
              <div className="col-span-2"></div>
              <div className="col-span-2"></div>
              <div className="col-span-1 text-right text-green-600">
                ${totalCreditAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="col-span-1 text-right text-blue-600">
                ${totalPurchase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}

          {/* Supplier Rows */}
          <div>
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 border-b">
                  <div className="col-span-12">
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))
            )}
            
            {!isLoading && filteredSuppliers?.map((supplier: any) => (
              <div
                key={supplier.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-muted/50 cursor-pointer"
              >
                <div className="col-span-1 flex items-center gap-2">
                  <input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} />
                </div>
                <div className="col-span-2 font-medium">{supplier.supplierNumber}</div>
                <div className="col-span-3">{supplier.supplierName}</div>
                <div className="col-span-2">
                  {supplier.phoneNumber || '---'}
                </div>
                <div className="col-span-2 text-sm">
                  {supplier.email || '---'}
                </div>
                <div className="col-span-1 text-right font-medium">
                  ${(supplier.creditAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="col-span-1 text-right font-medium">
                  ${(supplier.totalPurchaseAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}

            {!isLoading && filteredSuppliers?.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                {searchQuery ? (
                  <p>No suppliers found matching "{searchQuery}"</p>
                ) : (
                  <p>No suppliers yet. Add your first supplier to get started!</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isLoading && filteredSuppliers && filteredSuppliers.length > 0 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select className="border rounded px-2 py-1">
                  <option value="15">15 rows</option>
                  <option value="30">30 rows</option>
                  <option value="50">50 rows</option>
                  <option value="100">100 rows</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddSupplierDialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen} />
    </>
  );
}
