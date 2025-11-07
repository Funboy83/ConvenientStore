'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Package, DollarSign, FileText, ShoppingCart } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  receiptNumber: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: Array<{
    productNumber: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  note: string;
  status: string;
  createdAt: string;
  createdAtTimestamp: number;
}

export default function PurchaseHistoryPage() {
  const { firestore, auth } = initializeFirebase();
  
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          try {
            await import('firebase/auth').then(({ signInAnonymously }) => signInAnonymously(auth));
            console.log('✅ Signed in anonymously');
          } catch (error) {
            console.error('Auth error:', error);
          }
        }
        setAuthChecked(true);
        unsubscribe();
      });
    };
    checkAuth();
  }, [auth]);

  // Load purchase orders
  const loadPurchases = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const purchasesRef = collection(firestore, 'purchase_orders');
      const q = query(purchasesRef, orderBy('createdAtTimestamp', 'desc'));

      const snapshot = await getDocs(q);
      
      const orders: PurchaseOrder[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PurchaseOrder));

      setPurchases(orders);
      
      if (orders.length === 0) {
        setMessage({ type: 'success', text: 'No purchase orders yet.' });
      }
    } catch (error: any) {
      console.error('Error loading purchases:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to load purchase orders'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      loadPurchases();
    }
  }, [authChecked]);

  // Calculate totals
  const totalAmount = purchases.reduce((sum, po) => sum + po.total, 0);
  const totalItems = purchases.reduce((sum, po) => sum + po.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            Purchase History
          </h1>
          <p className="text-muted-foreground">
            View all completed purchase orders
          </p>
        </div>
        <Button onClick={loadPurchases} variant="outline" disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
            <p className="text-xs text-muted-foreground">
              Purchase orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Purchased</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Total quantity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>
            Click on a purchase order to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No purchase orders</p>
              <p className="text-sm">Complete your first purchase to see it here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Qty</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((po) => (
                    <TableRow 
                      key={po.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedPurchase(selectedPurchase?.id === po.id ? null : po)}
                    >
                      <TableCell>
                        {format(new Date(po.createdAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-semibold">{po.purchaseOrderNumber}</code>
                      </TableCell>
                      <TableCell>{po.supplierName}</TableCell>
                      <TableCell>{po.items.length} items</TableCell>
                      <TableCell>
                        {po.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${po.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          {po.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Order Details */}
      {selectedPurchase && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order Details</CardTitle>
            <CardDescription>
              {selectedPurchase.purchaseOrderNumber}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold">Purchase Order Number</p>
                <p className="text-sm text-muted-foreground">{selectedPurchase.purchaseOrderNumber}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">PO Number</p>
                <p className="text-sm text-muted-foreground">{selectedPurchase.poNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Supplier</p>
                <p className="text-sm text-muted-foreground">{selectedPurchase.supplierName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedPurchase.createdAt), 'PPpp')}
                </p>
              </div>
            </div>

            {selectedPurchase.note && (
              <div>
                <p className="text-sm font-semibold">Note</p>
                <p className="text-sm text-muted-foreground">{selectedPurchase.note}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold mb-2">Items</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPurchase.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.productNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>${item.discount.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">${item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-1">
                <span>Subtotal</span>
                <span>${selectedPurchase.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Discount</span>
                <span>-${selectedPurchase.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>${selectedPurchase.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
