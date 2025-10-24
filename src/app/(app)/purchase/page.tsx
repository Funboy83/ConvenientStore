'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Trash2, Plus, X, ImagePlus } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, initializeFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { AddLotDialog } from '@/components/add-lot-dialog';
import { EditProductImageDialog } from '@/components/edit-product-image-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PurchaseItem {
  id: string;
  productNumber: string;
  productName: string;
  imageUrl?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  note?: string;
  lotId?: string;
  lotName?: string;
  expiryDate?: string;
  onHand?: number;
  manageByLot?: string;
  tempLot?: {
    lotName: string;
    expiryDate: string;
    quantity: number;
  };
}

export default function PurchasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, auth } = initializeFirebase();
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [supplier, setSupplier] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('Generated automatically');
  const [poNumber, setPoNumber] = useState('');
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddLotOpen, setIsAddLotOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PurchaseItem | null>(null);
  const [selectedProductIdForLots, setSelectedProductIdForLots] = useState<string | null>(null);
  const [isEditImageOpen, setIsEditImageOpen] = useState(false);
  const [selectedProductForImage, setSelectedProductForImage] = useState<PurchaseItem | null>(null);

  // Fetch products from Firestore
  const { data: products } = useCollection(
    useMemoFirebase(() => (firestore ? collection(firestore, 'products') : null), [firestore])
  );

  // Fetch lots from Firestore
  const { data: allLots } = useCollection(
    useMemoFirebase(() => (firestore ? collection(firestore, 'lots') : null), [firestore])
  );

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          try {
            const { signInAnonymously } = await import('firebase/auth');
            await signInAnonymously(auth);
          } catch (error) {
            console.error('Auth error:', error);
          }
        }
        unsubscribe();
      });
    };
    checkAuth();
  }, [auth]);

  // Calculate totals
  const subTotal = purchaseItems.reduce((sum, item) => sum + item.total, 0);
  const total = subTotal - discount;

  const handleAddProduct = (product: any) => {
    const newItem: PurchaseItem = {
      id: Math.random().toString(),
      productNumber: product.productNumber || product.id,
      productName: product.name,
      imageUrl: product.imageUrl || product.image,
      unit: product.weightUnit || 'pcs',
      quantity: 0,
      unitPrice: product.costPrice || 0,
      discount: 0,
      total: 0,
      manageByLot: product.manageByLot,
    };
    setPurchaseItems([...purchaseItems, newItem]);
    setSearchQuery('');
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setPurchaseItems(
      purchaseItems.map((item) => {
        if (item.id === id) {
          const total = quantity * item.unitPrice - item.discount;
          return { ...item, quantity, total };
        }
        return item;
      })
    );
  };

  const handleUnitPriceChange = (id: string, unitPrice: number) => {
    setPurchaseItems(
      purchaseItems.map((item) => {
        if (item.id === id) {
          const total = item.quantity * unitPrice - item.discount;
          return { ...item, unitPrice, total };
        }
        return item;
      })
    );
  };

  const handleDiscountChange = (id: string, discount: number) => {
    setPurchaseItems(
      purchaseItems.map((item) => {
        if (item.id === id) {
          const total = item.quantity * item.unitPrice - discount;
          return { ...item, discount, total };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setPurchaseItems(purchaseItems.filter((item) => item.id !== id));
  };

  const handleSelectLot = (itemId: string, lotId: string) => {
    const lot = allLots?.find((l: any) => l.id === lotId);
    if (!lot) return;

    setPurchaseItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          // When selecting a lot, optionally update quantity to the lot's quantity
          // You can change this behavior if you want to keep the manual quantity
          const newQuantity = lot.quantity || 0;
          const newTotal = newQuantity * item.unitPrice - item.discount;
          
          return {
            ...item,
            lotId: lot.id,
            lotName: lot.lotName,
            expiryDate: lot.expiryDate,
            onHand: lot.quantity || 0,
            quantity: newQuantity,
            total: newTotal,
          };
        }
        return item;
      })
    );
  };

  const handleAddNewLot = (product: PurchaseItem) => {
    setSelectedProduct(product);
    setIsAddLotOpen(true);
  };

  const handleClearLot = (itemId: string) => {
    setPurchaseItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            lotId: undefined,
            lotName: undefined,
            expiryDate: undefined,
            onHand: undefined,
          };
        }
        return item;
      })
    );
  };

  const handleSaveLot = async (lotData: { lotName: string; expiryDate: string; quantity: number }) => {
    if (!selectedProduct) {
      return;
    }

    // DON'T save to Firestore yet - just update the purchase item temporarily
    // The lot will be saved when the purchase order is completed
    
    setPurchaseItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === selectedProduct.id) {
          const newQuantity = lotData.quantity;
          const newTotal = newQuantity * item.unitPrice - item.discount;
          return {
            ...item,
            lotName: lotData.lotName,
            expiryDate: lotData.expiryDate,
            quantity: newQuantity,
            total: newTotal,
            // Store as temporary - will be saved to Firestore on purchase completion
            tempLot: {
              lotName: lotData.lotName,
              expiryDate: lotData.expiryDate,
              quantity: lotData.quantity,
            }
          };
        }
        return item;
      })
    );

    setIsAddLotOpen(false);
    setSelectedProduct(null);
  };

  const handleSaveProductImage = (imageUrl: string) => {
    if (!selectedProductForImage) {
      return;
    }

    setPurchaseItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === selectedProductForImage.id) {
          return {
            ...item,
            imageUrl: imageUrl || undefined,
          };
        }
        return item;
      })
    );

    setIsEditImageOpen(false);
    setSelectedProductForImage(null);
  };

  const handleOpenImageEditor = (product: PurchaseItem) => {
    setSelectedProductForImage(product);
    setIsEditImageOpen(true);
  };

  const handleSave = () => {
    // TODO: Save as draft
    console.log('Saving draft...', { purchaseItems, supplier, poNumber, discount, note });
  };

  const handleComplete = async () => {
    if (!firestore) {
      alert('Firestore not initialized');
      return;
    }

    try {
      // First, create lots for items that have tempLot
      const { addDoc } = await import('firebase/firestore');
      const lotsCollection = collection(firestore, 'lots');
      
      const updatedItems = await Promise.all(
        purchaseItems.map(async (item) => {
          if (item.tempLot) {
            // Save the lot to Firestore
            const docRef = await addDoc(lotsCollection, {
              productNumber: item.productNumber,
              lotName: item.tempLot.lotName,
              expiryDate: item.tempLot.expiryDate,
              quantity: item.tempLot.quantity,
              initialQuantity: item.tempLot.quantity,
              createdAt: new Date().toISOString(),
              status: 'active',
            });
            
            // Return item with lotId
            return {
              ...item,
              lotId: docRef.id,
            };
          }
          return item;
        })
      );
      
      // TODO: Now save the purchase order to Firestore
      // TODO: Update product inventory
      
      toast({
        title: 'Purchase completed',
        description: 'Purchase order has been completed successfully.',
      });
      
      // Clear the form
      setPurchaseItems([]);
      setSupplier('');
      setPoNumber('');
      setDiscount(0);
      setNote('');
      
    } catch (error) {
      console.error('Error completing purchase:', error);
      alert('Failed to complete purchase. Please try again.');
    }
  };

  // Filter products based on search
  const filteredProducts = products?.filter(
    (p: any) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">Purchase</h1>
        <div className="w-20"></div>
      </div>

      <div className="space-y-6">
        {/* Product Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product number/name (F3)"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && filteredProducts && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredProducts.slice(0, 10).map((product: any) => (
                    <button
                      key={product.id}
                      className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3"
                      onClick={() => handleAddProduct(product)}
                    >
                      {product.imageUrl || product.image ? (
                        <img 
                          src={product.imageUrl || product.image} 
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded border flex items-center justify-center text-gray-400 text-xs">
                          No img
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.productNumber} | {product.category}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Purchase Items Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product num...</TableHead>
                  <TableHead>Product name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleOpenImageEditor(item)}
                        className="relative group cursor-pointer"
                        title="Click to edit image"
                      >
                        {item.imageUrl ? (
                          <div className="relative">
                            <img 
                              src={item.imageUrl} 
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded border group-hover:opacity-75 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ImagePlus className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs group-hover:bg-gray-200 group-hover:text-blue-600 transition-colors">
                            <ImagePlus className="h-5 w-5" />
                          </div>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-blue-600">{item.productNumber}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Note... <Button variant="link" className="h-auto p-0 text-xs">✏️</Button>
                      </div>
                      {/* Lot/Expiry Date Section - Only show if manageByLot is 'yes' */}
                      {item.manageByLot === 'yes' && (
                        <div className="mt-2 space-y-1">
                          {!item.lotName ? (
                            <>
                              {/* Lot selection dropdown */}
                              {(() => {
                                const productLots = allLots?.filter(
                                  (lot: any) => lot.productNumber === item.productNumber
                                );
                                return productLots && productLots.length > 0 ? (
                                  <Select onValueChange={(lotId) => handleSelectLot(item.id, lotId)}>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Select lot" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {productLots.map((lot: any) => (
                                        <SelectItem key={lot.id} value={lot.id} className="text-xs">
                                          {lot.lotName} - {lot.expiryDate} - On hand: {lot.quantity || 0}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="text-xs text-muted-foreground p-2 border rounded">
                                    No existing lots
                                  </div>
                                );
                              })()}
                            </>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs p-2 bg-green-50 rounded border border-green-200">
                                <div className="font-medium text-green-600">
                                  ✓ {item.lotName} - {item.expiryDate} - Qty: {item.tempLot?.quantity || item.quantity}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleClearLot(item.id)}
                                  title="Clear lot selection"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-xs text-muted-foreground italic">
                                (Will be saved when purchase is completed)
                              </div>
                            </div>
                          )}
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddNewLot(item);
                            }}
                          >
                            + Add new lot, expiry date
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{item.productName}</div>
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.unitPrice || ''}
                        onChange={(e) => handleUnitPriceChange(item.id, Number(e.target.value))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.discount || ''}
                        onChange={(e) => handleDiscountChange(item.id, Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>${item.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2"></div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Supplier Search */}
              <div>
                <Label>Search supplier (F4)</Label>
                <div className="relative mt-1">
                  <Input
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Search supplier"
                  />
                  <Plus className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Purchase Receipt Number */}
              <div>
                <Label>Purchase receipt number</Label>
                <Input value={receiptNumber} readOnly className="mt-1 bg-muted" />
              </div>

              {/* PO Number */}
              <div>
                <Label>PO number</Label>
                <Input
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <div className="mt-1 text-sm font-medium">Draft</div>
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Sub-total</span>
                  <span>{subTotal || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <Input
                    type="number"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-24 h-8 text-right"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold text-blue-600">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Note */}
              <div>
                <Label>Note</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1"
                  placeholder="Add note..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button variant="default" className="flex-1 bg-blue-600" onClick={handleSave}>
                  💾 Save
                </Button>
                <Button variant="default" className="flex-1 bg-green-600" onClick={handleComplete}>
                  ✓ Complete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddLotDialog
        open={isAddLotOpen}
        onOpenChange={setIsAddLotOpen}
        productNumber={selectedProduct?.productNumber || ''}
        onSave={handleSaveLot}
      />

      <EditProductImageDialog
        open={isEditImageOpen}
        onOpenChange={setIsEditImageOpen}
        productName={selectedProductForImage?.productName || ''}
        currentImageUrl={selectedProductForImage?.imageUrl}
        onSave={handleSaveProductImage}
      />
    </>
  );
}
