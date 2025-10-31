
'use client';

import { useState } from 'react';
import { PlusCircle, MoreHorizontal, Search, ImagePlus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddProductDialog } from '@/components/add-product-dialog';
import { EditProductImageDialog } from '@/components/edit-product-image-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditImageOpen, setIsEditImageOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const firestore = useFirestore();
  const router = useRouter();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products, isLoading } = useCollection(productsQuery);

  const handleRowClick = (productId: string) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  const handleOpenImageEditor = (product: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion
    setSelectedProduct(product);
    setIsEditImageOpen(true);
  };

  const handleSaveProductImage = async (imageUrl: string) => {
    if (!selectedProduct || !firestore) {
      return;
    }

    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const productRef = doc(firestore, 'products', selectedProduct.id);
      
      await updateDoc(productRef, {
        imageUrl: imageUrl || null,
        image: imageUrl || null, // Update both fields for compatibility
      });

      setIsEditImageOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error updating product image:', error);
      alert('Failed to update product image. Please try again.');
    }
  };

  const handleDeleteClick = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete || !firestore) {
      return;
    }

    setIsDeleting(true);
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const productRef = doc(firestore, 'products', productToDelete.id);
      
      await deleteDoc(productRef);

      // Close the expanded row if it was the deleted product
      if (expandedProductId === productToDelete.id) {
        setExpandedProductId(null);
      }

      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = products?.filter((product: any) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.productNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalOnHand = products?.reduce((sum: number, p: any) => sum + (p.onHand || 0), 0) || 0;
  const totalCustomerOrdered = products?.reduce((sum: number, p: any) => sum + (p.customerOrdered || 0), 0) || 0;

  return (
    <>
      <div className="space-y-4">
        {/* Header with search and actions */}
        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="By product number/name"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <span className="text-lg">⚡</span>
            </Button>
            <Button variant="outline" onClick={() => setIsAddProductOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create
            </Button>
            <Button variant="outline">Import file</Button>
            <Button variant="outline">Export file</Button>
            <Button variant="outline" size="icon">
              <span className="text-lg">☰</span>
            </Button>
            <Button variant="outline" size="icon">
              <span className="text-lg">⚙️</span>
            </Button>
            <Button variant="outline" size="icon">
              <span className="text-lg">?</span>
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <div className="border rounded-lg bg-white">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium">
            <div className="col-span-1 flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>⭐</span>
            </div>
            <div className="col-span-2">Product number</div>
            <div className="col-span-2">Product name</div>
            <div className="col-span-1 text-right">Selling price</div>
            <div className="col-span-1 text-right">Cost price</div>
            <div className="col-span-1 text-right">On hand</div>
            <div className="col-span-1 text-right">Customer ordered</div>
            <div className="col-span-2">Created date</div>
            <div className="col-span-1 text-right">Stockout forecast</div>
          </div>

          {/* Summary Row */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b bg-muted/20 text-sm font-medium">
            <div className="col-span-6"></div>
            <div className="col-span-1 text-right">{totalOnHand}</div>
            <div className="col-span-1 text-right">{totalCustomerOrdered}</div>
            <div className="col-span-3 text-right">---</div>
            <div className="col-span-1 text-right">---</div>
          </div>

          {/* Product Rows */}
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
            
            {!isLoading && filteredProducts?.map((product: any) => (
              <div key={product.id} className={`border-b ${expandedProductId === product.id ? 'bg-blue-50' : ''}`}>
                {/* Main Row */}
                <div
                  className="grid grid-cols-12 gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(product.id)}
                >
                  <div className="col-span-1 flex items-center gap-2">
                    <input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} />
                    <span>⭐</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    {product.imageUrl || product.image ? (
                      <img 
                        src={product.imageUrl || product.image} 
                        alt={product.name} 
                        className="w-8 h-8 rounded object-cover" 
                      />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs">
                        {product.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <span className="text-blue-600">{product.productNumber || product.id.slice(0, 8)}</span>
                  </div>
                  <div className="col-span-2">{product.name}</div>
                  <div className="col-span-1 text-right">${(product.sellingPrice || 0).toFixed(2)}</div>
                  <div className="col-span-1 text-right">${(product.costPrice || 0).toFixed(2)}</div>
                  <div className="col-span-1 text-right">{product.onHand || 0}</div>
                  <div className="col-span-1 text-right">
                    {product.customerOrdered > 0 ? (
                      <span className="text-blue-600">{product.customerOrdered}</span>
                    ) : (
                      product.customerOrdered || 0
                    )}
                  </div>
                  <div className="col-span-2">
                    {product.createdAt ? new Date(product.createdAt).toLocaleString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '---'}
                  </div>
                  <div className="col-span-1 text-right">
                    {product.stockoutForecast ? `${product.stockoutForecast} day(s)` : '---'}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedProductId === product.id && (
                  <div className="border-t bg-white">
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
                        <TabsTrigger value="details" className="rounded-none">Details</TabsTrigger>
                        <TabsTrigger value="description" className="rounded-none">Description, note</TabsTrigger>
                        <TabsTrigger value="stock" className="rounded-none">Stock card</TabsTrigger>
                        <TabsTrigger value="total" className="rounded-none">Total On Hand</TabsTrigger>
                        {product.manageByLot === 'yes' && (
                          <TabsTrigger value="lot" className="rounded-none">Lot - Expiry date</TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="details" className="p-6">
                        <div className="flex gap-6">
                          {/* Product Image - Clickable */}
                          <button
                            onClick={(e) => handleOpenImageEditor(product, e)}
                            className="w-32 h-32 bg-muted rounded flex items-center justify-center relative group cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                            title="Click to edit image"
                          >
                            {product.imageUrl || product.image ? (
                              <div className="relative w-full h-full">
                                <img 
                                  src={product.imageUrl || product.image} 
                                  alt={product.name} 
                                  className="rounded object-cover w-full h-full group-hover:opacity-75 transition-opacity" 
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                  <ImagePlus className="h-8 w-8 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                                <ImagePlus className="h-12 w-12 mb-2" />
                                <span className="text-xs">Add Image</span>
                              </div>
                            )}
                          </button>

                          {/* Product Details */}
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                              <span>Category: {product.category || 'None'}</span>
                              <span className="px-2 py-1 bg-muted rounded text-xs">
                                {product.manageByLot === 'yes' ? 'Product - lot, expiry date' : 'Standard product'}
                              </span>
                              <span>For sale</span>
                              {product.loyaltyPoints && (
                                <span className="text-orange-500">Loyalty points not applied</span>
                              )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-4 gap-x-8 gap-y-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Product No.</div>
                                <div className="font-medium">{product.productNumber || product.id.slice(0, 13)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Barcode</div>
                                <div className="font-medium">{product.barcode || product.productNumber || product.id.slice(0, 13)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">{product.manageByLot === 'yes' ? 'Inventory level' : 'On hand'}</div>
                                <div className="font-medium">{product.onHand || 0} {product.manageByLot === 'yes' && `- ${product.maxInventory || 999999999}`}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Cost price</div>
                                <div className="font-medium">${(product.costPrice || 0).toFixed(2)}</div>
                              </div>

                              <div>
                                <div className="text-sm text-muted-foreground">Cost price</div>
                                <div className="font-medium">${(product.costPrice || 0).toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Selling price</div>
                                <div className="font-medium">${(product.sellingPrice || 0).toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Brand</div>
                                <div className="font-medium">{product.brand || 'None'}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Position</div>
                                <div className="font-medium">{product.position || 'None'}</div>
                              </div>

                              <div>
                                <div className="text-sm text-muted-foreground">Weight</div>
                                <div className="font-medium">{product.weight ? `${product.weight} ${product.weightUnit}` : 'None'}</div>
                              </div>
                              {product.supplier && (
                                <div className="col-span-4">
                                  <div className="text-sm text-muted-foreground">Supplier</div>
                                  <div className="font-medium">{product.supplier}</div>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-6">
                              <Button variant="link" className="text-blue-600 p-0 h-auto">Add unit</Button>
                              <Button variant="link" className="text-blue-600 p-0 h-auto">Create attribute</Button>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between mt-6 pt-6 border-t">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => handleDeleteClick(product, e)}
                            >
                              <span className="mr-2">🗑️</span> Delete
                            </Button>
                            <Button variant="outline" size="sm">
                              <span className="mr-2">📋</span> Copy
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-blue-600">
                              <span className="mr-2">✏️</span> Update
                            </Button>
                            <Button variant="outline" size="sm">
                              <span className="mr-2">🖨️</span> Print label
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push('/purchase')}>
                                  Purchase
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Deactivate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="description" className="p-6">
                        <div className="text-sm text-muted-foreground">
                          {product.description || 'No description available'}
                        </div>
                      </TabsContent>

                      <TabsContent value="stock" className="p-6">
                        <div className="text-sm text-muted-foreground">
                          Stock card information will be displayed here.
                        </div>
                      </TabsContent>

                      <TabsContent value="total" className="p-6">
                        <div className="text-sm text-muted-foreground">
                          Total on hand: {product.onHand || 0}
                        </div>
                      </TabsContent>

                      {product.manageByLot === 'yes' && (
                        <TabsContent value="lot" className="p-6">
                          <div className="text-sm text-muted-foreground">
                            Lot and expiry date information will be displayed here.
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>
                )}
              </div>
            ))}

            {!isLoading && filteredProducts?.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                No products found. Add one to get started.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-muted-foreground">
            <div>Show 15 rows</div>
          </div>
        </div>
      </div>

      <AddProductDialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen} />
      
      <EditProductImageDialog
        open={isEditImageOpen}
        onOpenChange={setIsEditImageOpen}
        productName={selectedProduct?.name || ''}
        currentImageUrl={selectedProduct?.imageUrl || selectedProduct?.image}
        onSave={handleSaveProductImage}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
              <br />
              <br />
              This action cannot be undone. The product will be permanently removed from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
