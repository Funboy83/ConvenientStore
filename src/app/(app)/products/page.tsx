
'use client';

import React, { useState } from 'react';
import { PlusCircle, MoreHorizontal, Search, ImagePlus, DollarSign, Filter, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddProductDialog } from '@/components/add-product-dialog';
import { EditProductImageDialog } from '@/components/edit-product-image-dialog';
import { PriceBookDialog } from '@/components/price-book-dialog';
import { AddUnitToProductDialog } from '@/components/add-unit-to-product-dialog';
import { AddAttributeToProductDialog } from '@/components/add-attribute-to-product-dialog';
import { AddVariantProductDialog } from '@/components/add-variant-product-dialog';
import { FixExistingParentProductsButton } from '@/components/fix-existing-parent-products-button';
import { CleanupDuplicateProductsButton } from '@/components/cleanup-duplicate-products-button';
import { MigrateVariantsButton } from '@/components/migrate-variants-button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
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

// Component to display lots for a product
function ProductLots({ product }: { product: any }) {
  const firestore = useFirestore();
  
  // Try to find lots by matching either productNumber or the displayed product number (from table)
  // The displayed productNumber is either product.productNumber or product.id.slice(0, 8)
  const displayedProductNumber = product?.productNumber || product?.id?.slice(0, 8);
  
  // Fetch ALL lots and filter client-side since we need to match by full product.id or partial match
  const lotsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'lots');
  }, [firestore]);

  const { data: allLots, isLoading } = useCollection(lotsQuery);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading lots...</div>;
  }

  // Filter lots that match this product's ID (either exact match or starts with)
  const lots = allLots?.filter((lot: any) => {
    // Try exact match first
    if (lot.productNumber === product?.productNumber) return true;
    // Try matching with full product ID
    if (lot.productNumber === product?.id) return true;
    // Try matching if lot's productNumber starts with displayed number
    if (lot.productNumber?.startsWith(displayedProductNumber)) return true;
    // Try matching if displayed number is part of lot's productNumber
    if (displayedProductNumber && lot.productNumber?.includes(displayedProductNumber)) return true;
    return false;
  });

  if (!lots || lots.length === 0) {
    return <div className="text-sm text-muted-foreground">No lots found for this product.</div>;
  }

  // Check for expired lots
  const now = new Date();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
        <div>Lot Number</div>
        <div>Expiry Date</div>
        <div className="text-right">Quantity</div>
        <div>Status</div>
        <div>Received Date</div>
      </div>
      {lots.map((lot: any) => {
        const expiryDate = lot.expiryDate?.toDate ? lot.expiryDate.toDate() : new Date(lot.expiryDate);
        const isExpired = expiryDate < now;
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isNearExpiry = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

        return (
          <div key={lot.id} className="grid grid-cols-5 gap-4 text-sm py-2 border-b last:border-0">
            <div className="font-medium">{lot.lotName || lot.lotNumber || 'N/A'}</div>
            <div className={isExpired ? 'text-red-600 font-medium' : isNearExpiry ? 'text-orange-600' : ''}>
              {expiryDate.toLocaleDateString()}
            </div>
            <div className="text-right font-semibold">{lot.quantity || 0}</div>
            <div>
              {isExpired ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Expired
                </span>
              ) : isNearExpiry ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Expiring Soon ({daysUntilExpiry}d)
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              )}
            </div>
            <div className="text-muted-foreground">
              {lot.receivedDate?.toDate ? lot.receivedDate.toDate().toLocaleDateString() : 'N/A'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ProductsPage() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isPriceBookOpen, setIsPriceBookOpen] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditImageOpen, setIsEditImageOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [productForUnit, setProductForUnit] = useState<any>(null);
  const [isAddAttributeOpen, setIsAddAttributeOpen] = useState(false);
  const [productForAttribute, setProductForAttribute] = useState<any>(null);
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
  const [parentProductForVariant, setParentProductForVariant] = useState<any>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const firestore = useFirestore();
  const router = useRouter();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products, isLoading } = useCollection(productsQuery);

  // Organize products - Group by name pattern (base name before " - ")
  const organizedProducts = () => {
    if (!products) return [];
    
    // Extract base name from product name
    const getBaseName = (name: string) => {
      const lastDashIndex = name.lastIndexOf(' - ');
      return lastDashIndex > 0 ? name.substring(0, lastDashIndex) : name;
    };

    // Group products by base name
    const groupsMap = new Map<string, any[]>();
    products.forEach((product: any) => {
      const baseName = getBaseName(product.name);
      if (!groupsMap.has(baseName)) {
        groupsMap.set(baseName, []);
      }
      groupsMap.get(baseName)!.push(product);
    });

    // Convert to organized structure
    const organized: any[] = [];
    groupsMap.forEach((groupProducts, baseName) => {
      if (groupProducts.length === 1) {
        // Single product, no grouping needed
        organized.push({
          ...groupProducts[0],
          isParent: false,
          variantCount: 0,
          children: []
        });
      } else {
        // Multiple products with same base name - show first as parent with rest as children
        const [firstProduct, ...restProducts] = groupProducts;
        organized.push({
          ...firstProduct,
          isParent: true,
          variantCount: restProducts.length,
          children: restProducts,
          baseName: baseName
        });
      }
    });

    return organized;
  };

  const handleRowClick = (product: any) => {
    // If it's a parent with variants, toggle group expansion
    if (product.isParent && product.variantCount > 0) {
      toggleGroupExpansion(product.id, new MouseEvent('click') as any);
      return;
    }
    // For all products (including single variants in a group), open details
    setExpandedProductId(expandedProductId === product.id ? null : product.id);
  };

  const toggleGroupExpansion = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
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

  const handleEditClick = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToEdit(product);
    setIsEditMode(true);
    setIsAddProductOpen(true);
  };

  const handleAddUnitClick = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductForUnit(product);
    setIsAddUnitOpen(true);
  };

  const handleCreateAttributeClick = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductForAttribute(product);
    setIsAddAttributeOpen(true);
  };

  const handleAddVariantClick = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setParentProductForVariant(product);
    setIsAddVariantOpen(true);
  };

  const handleToggleActive = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!firestore) {
      return;
    }

    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const productRef = doc(firestore, 'products', product.id);
      
      const newStatus = product.isActive === false ? true : false;
      
      await updateDoc(productRef, {
        isActive: newStatus,
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ Product ${newStatus ? 'activated' : 'deactivated'}:`, product.name);
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Failed to update product status. Please try again.');
    }
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

  const filteredProducts = organizedProducts()?.filter((product: any) => {
    // Filter by search query
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by active status
    const matchesActiveStatus = showInactive ? true : product.isActive !== false;
    
    return matchesSearch && matchesActiveStatus;
  });

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
            <MigrateVariantsButton />
            <FixExistingParentProductsButton />
            <CleanupDuplicateProductsButton />
            <Button 
              variant={showInactive ? "default" : "outline"}
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
              className={showInactive ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {showInactive ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Showing Inactive
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Inactive
                </>
              )}
            </Button>
            <Button variant="outline" size="icon">
              <span className="text-lg">⚡</span>
            </Button>
            <Button variant="outline" onClick={() => setIsPriceBookOpen(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Price Book
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
            
            {!isLoading && filteredProducts?.map((product: any) => {
              const isGroupExpanded = expandedGroups.has(product.id);
              const hasVariants = product.variantCount > 0;
              
              return (
                <React.Fragment key={product.id}>
                  {/* Group Container - Show border when expanded with variants */}
                  <div className={hasVariants && isGroupExpanded ? 'border-2 border-blue-400 rounded-lg my-1' : ''}>
                    
                    {/* Parent Product Row - HIDE when group is expanded, show collapsed view */}
                    {!(hasVariants && isGroupExpanded) && (
                      <div className={`border-b ${expandedProductId === product.id ? 'bg-blue-50' : ''}`}>
                        {/* Main Row */}
                        <div
                          className="grid grid-cols-12 gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(product)}
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
                          <div className="col-span-2 flex items-center gap-2">
                            {hasVariants && (
                              <button
                                onClick={(e) => toggleGroupExpansion(product.id, e)}
                                className="text-blue-600 hover:text-blue-800 font-bold text-lg"
                              >
                                ▶
                              </button>
                            )}
                            <span>
                              {hasVariants && `(${product.variantCount + 1}) `}{product.name}
                            </span>
                            {product.isActive === false && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="col-span-1 text-right">${(product.sellingPrice || 0).toFixed(2)}</div>
                          <div className="col-span-1 text-right">${(product.costPrice || 0).toFixed(2)}</div>
                          <div className="col-span-1 text-right">
                            {product.onHand || 0}
                          </div>
                          <div className="col-span-1 text-right">
                            {product.customerOrdered > 0 ? (
                              <span className="text-blue-600">{product.customerOrdered}</span>
                            ) : (
                              product.customerOrdered || 0
                            )}
                          </div>
                          <div className="col-span-2">
                            {product.createdAt ? (
                              product.createdAt.toDate ? 
                                product.createdAt.toDate().toLocaleString('en-US', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) 
                                : new Date(product.createdAt).toLocaleString('en-US', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                            ) : '---'}
                          </div>
                          <div className="col-span-1 text-right">
                            {product.stockoutForecast ? `${product.stockoutForecast} day(s)` : '---'}
                          </div>
                        </div>

                        {/* Expanded Details for Parent (when NOT in group view) */}
                        {expandedProductId === product.id && !(hasVariants && isGroupExpanded) && (
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
                            
                            {/* Variant Group Info Message */}
                            {product.isParent && product.variantCount > 0 && (
                              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                  <strong>📦 Variant Group:</strong> This product has {product.variantCount} variant{product.variantCount > 1 ? 's' : ''}. Each variant has its own stock and pricing.
                                </p>
                              </div>
                            )}
                            
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
                                <div className="font-medium">
                                  {product.onHand || 0} {product.manageByLot === 'yes' && `- ${product.maxInventory || 999999999}`}
                                </div>
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
                              <Button 
                                variant="link" 
                                className="text-blue-600 p-0 h-auto"
                                onClick={(e) => handleAddUnitClick(product, e)}
                              >
                                Add unit
                              </Button>
                              <Button 
                                variant="link" 
                                className="text-blue-600 p-0 h-auto"
                                onClick={(e) => handleCreateAttributeClick(product, e)}
                              >
                                Add attribute
                              </Button>
                            </div>

                            {/* Show "Add new variant product" button if product has attributes */}
                            {product.attributes && product.attributes.length > 0 && (
                              <div className="mt-4">
                                <Button 
                                  variant="default"
                                  size="sm"
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                  onClick={(e) => handleAddVariantClick(product, e)}
                                >
                                  + Add new variant product
                                </Button>
                              </div>
                            )}
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
                            <Button 
                              size="sm" 
                              className="bg-blue-600"
                              onClick={(e) => handleEditClick(product, e)}
                            >
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
                                <DropdownMenuItem onClick={(e) => handleToggleActive(product, e)}>
                                  {product.isActive === false ? 'Activate' : 'Deactivate'}
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
                          <ProductLots product={product} />
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>
                )}
                    </div>
                    )}

                    {/* Group Header Row - Show when expanded (replaces parent row) */}
                    {hasVariants && isGroupExpanded && (
                      <div className="bg-blue-50 border-b border-blue-200">
                        <div className="grid grid-cols-12 gap-4 px-4 py-3">
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
                          <div className="col-span-9 flex items-center gap-2">
                            <button
                              onClick={(e) => toggleGroupExpansion(product.id, e)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-lg"
                            >
                              ▼
                            </button>
                            <span className="font-medium">({product.variantCount + 1}) {product.name}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Child Variants - Show when group is expanded */}
                    {hasVariants && isGroupExpanded && product.children?.map((child: any) => (
                      <div key={child.id} className={`border-t ${expandedProductId === child.id ? 'bg-blue-50' : 'bg-white'}`}>
                        {/* Child Row */}
                        <div
                          className="grid grid-cols-12 gap-4 px-4 py-2 cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedProductId(expandedProductId === child.id ? null : child.id)}
                        >
                          <div className="col-span-1 flex items-center gap-2">
                            <input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} />
                            <span>⭐</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            {child.imageUrl || child.image ? (
                              <img 
                                src={child.imageUrl || child.image} 
                                alt={child.name} 
                                className="w-8 h-8 rounded object-cover" 
                              />
                            ) : (
                              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs">
                                {child.name?.charAt(0) || '?'}
                              </div>
                            )}
                            <span className="text-blue-600">{child.productNumber || child.id.slice(0, 8)}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <span>{child.name}</span>
                            {child.isActive === false && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="col-span-1 text-right">${(child.sellingPrice || 0).toFixed(2)}</div>
                          <div className="col-span-1 text-right">${(child.costPrice || 0).toFixed(2)}</div>
                          <div className="col-span-1 text-right">{child.onHand || 0}</div>
                          <div className="col-span-1 text-right">
                            {child.customerOrdered > 0 ? (
                              <span className="text-blue-600">{child.customerOrdered}</span>
                            ) : (
                              child.customerOrdered || 0
                            )}
                          </div>
                          <div className="col-span-2">
                            {child.createdAt ? (
                              child.createdAt.toDate ? 
                                child.createdAt.toDate().toLocaleString('en-US', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) 
                                : new Date(child.createdAt).toLocaleString('en-US', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                            ) : '---'}
                          </div>
                          <div className="col-span-1 text-right">
                            {child.stockoutForecast ? `${child.stockoutForecast} day(s)` : '---'}
                          </div>
                        </div>

                        {/* Expanded Details for Child */}
                        {expandedProductId === child.id && (
                          <div className="border-t bg-white">
                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
                                <TabsTrigger value="details" className="rounded-none">Details</TabsTrigger>
                                <TabsTrigger value="description" className="rounded-none">Description, note</TabsTrigger>
                                <TabsTrigger value="stock" className="rounded-none">Stock card</TabsTrigger>
                                <TabsTrigger value="total" className="rounded-none">Total On Hand</TabsTrigger>
                                {child.manageByLot === 'yes' && (
                                  <TabsTrigger value="lot" className="rounded-none">Lot - Expiry date</TabsTrigger>
                                )}
                              </TabsList>

                              <TabsContent value="details" className="p-6">
                                <div className="flex gap-6">
                                  <button
                                    onClick={(e) => handleOpenImageEditor(child, e)}
                                    className="w-32 h-32 bg-muted rounded flex items-center justify-center relative group cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                                    title="Click to edit image"
                                  >
                                    {child.imageUrl || child.image ? (
                                      <img src={child.imageUrl || child.image} alt={child.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="text-4xl">{child.name?.charAt(0) || '?'}</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ImagePlus className="h-8 w-8 text-white" />
                                    </div>
                                  </button>

                                  <div className="flex-1">
                                    <h3 className="text-xl font-semibold mb-2">{child.name}</h3>
                                    
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                      <span>Category: {child.category || 'None'}</span>
                                      <span className="px-2 py-1 bg-muted rounded text-xs">
                                        {child.manageByLot === 'yes' ? 'Product - lot, expiry date' : 'Standard product'}
                                      </span>
                                      <span>For sale</span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-x-8 gap-y-4">
                                      <div>
                                        <div className="text-sm text-muted-foreground">Product No.</div>
                                        <div className="font-medium">{child.productNumber || child.id.slice(0, 13)}</div>
                                      </div>
                                      <div>
                                        <div className="text-sm text-muted-foreground">Barcode</div>
                                        <div className="font-medium">{child.barcode || child.productNumber || child.id.slice(0, 13)}</div>
                                      </div>
                                      <div>
                                        <div className="text-sm text-muted-foreground">On hand</div>
                                        <div className="font-medium">{child.onHand || 0}</div>
                                      </div>
                                      <div>
                                        <div className="text-sm text-muted-foreground">Cost price</div>
                                        <div className="font-medium">${(child.costPrice || 0).toFixed(2)}</div>
                                      </div>
                                    </div>

                                    <div className="mt-6 flex gap-2">
                                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick(child, e); }}>
                                        Edit
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAddUnitClick(child, e); }}>
                                            Add Unit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleActive(child, e); }}>
                                            {child.isActive === false ? 'Activate' : 'Deactivate'}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClick(child, e); }} className="text-destructive">
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="description" className="p-6">
                                <div className="text-sm text-muted-foreground">
                                  {child.description || 'No description available'}
                                </div>
                              </TabsContent>

                              <TabsContent value="stock" className="p-6">
                                <div className="text-sm text-muted-foreground">
                                  Stock card information will be displayed here.
                                </div>
                              </TabsContent>

                              <TabsContent value="total" className="p-6">
                                <div className="text-sm text-muted-foreground">
                                  Total on hand: {child.onHand || 0}
                                </div>
                              </TabsContent>

                              {child.manageByLot === 'yes' && (
                                <TabsContent value="lot" className="p-6">
                                  <ProductLots product={child} />
                                </TabsContent>
                              )}
                            </Tabs>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Variant Button - Show at bottom of expanded group */}
                    {hasVariants && isGroupExpanded && (
                      <div className="px-4 py-3 border-t bg-blue-50 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddVariantClick(product, e);
                          }}
                          className="text-blue-600 border-blue-300 hover:bg-blue-100"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add new variant product
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(product.id);
                          }}
                        >
                          📋 Copy
                        </Button>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}

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

      <AddProductDialog 
        open={isAddProductOpen} 
        onOpenChange={(open) => {
          setIsAddProductOpen(open);
          if (!open) {
            setIsEditMode(false);
            setProductToEdit(null);
          }
        }}
        editMode={isEditMode}
        productToEdit={productToEdit}
      />
      
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

      <AddUnitToProductDialog 
        open={isAddUnitOpen} 
        onOpenChange={setIsAddUnitOpen}
        product={productForUnit}
      />

      <AddAttributeToProductDialog
        open={isAddAttributeOpen}
        onOpenChange={setIsAddAttributeOpen}
        product={productForAttribute}
      />

      <AddVariantProductDialog
        open={isAddVariantOpen}
        onOpenChange={setIsAddVariantOpen}
        parentProduct={parentProductForVariant}
      />

      <PriceBookDialog open={isPriceBookOpen} onOpenChange={setIsPriceBookOpen} />
    </>
  );
}
