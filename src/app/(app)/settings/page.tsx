
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddUnitDialog } from '@/components/add-unit-dialog';
import { AddAttributeDialog } from '@/components/add-attribute-dialog';
import { AddCategoryDialog } from '@/components/add-category-dialog';
import { AddBrandDialog } from '@/components/add-brand-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const openModalParam = searchParams.get('openModal');
  
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddAttributeOpen, setIsAddAttributeOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(tabParam || 'units');
  const firestore = useFirestore();

  // Update active tab when URL param changes
  useEffect(() => {
    if (tabParam === 'units' || tabParam === 'attributes') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Auto-open modal based on URL parameter
  useEffect(() => {
    if (openModalParam === 'unit') {
      setIsAddUnitOpen(true);
    } else if (openModalParam === 'attribute') {
      setIsAddAttributeOpen(true);
    } else if (openModalParam === 'category') {
      setIsAddCategoryOpen(true);
    } else if (openModalParam === 'brand') {
      setIsAddBrandOpen(true);
    }
  }, [openModalParam]);

  const unitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'units');
  }, [firestore]);

  const attributesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'productAttributes');
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const brandsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'brands');
  }, [firestore]);

  const { data: units, isLoading: isLoadingUnits } = useCollection(unitsQuery);
  const { data: attributes, isLoading: isLoadingAttributes } = useCollection(attributesQuery);
  const { data: categories, isLoading: isLoadingCategories } = useCollection(categoriesQuery);
  const { data: brands, isLoading: isLoadingBrands } = useCollection(brandsQuery);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage application-wide settings for products."
      />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="units">Units of measure</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="categories">Product categories</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
        </TabsList>

        <TabsContent value="attributes">
          <Card>
            <CardHeader>
              <CardTitle>Manage Attributes</CardTitle>
              <CardDescription>
                Create and manage reusable attributes (e.g., category, brand, position) for your products.
              </CardDescription>
              <div className="pt-2">
                <Button size="sm" onClick={() => setIsAddAttributeOpen(true)}>
                  <PlusCircle className="mr-2" />
                  Add Attribute
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attribute Name</TableHead>
                    <TableHead>Possible Values</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAttributes && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[300px]" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoadingAttributes && attributes?.map(attr => (
                    <TableRow key={attr.id}>
                      <TableCell className="font-medium capitalize">{attr.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {attr.values?.map((val: string) => (
                            <Badge key={val} variant="secondary">{val}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units">
          <Card>
            <CardHeader>
              <CardTitle>Manage Units</CardTitle>
              <CardDescription>
                Create and manage units of measure (e.g., box, can, pack).
              </CardDescription>
              <div className="pt-2">
                <Button size="sm" onClick={() => setIsAddUnitOpen(true)}>
                  <PlusCircle className="mr-2" />
                  Add Unit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit Name</TableHead>
                      <TableHead>Abbreviation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUnits && Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      </TableRow>
                    ))}
                    {!isLoadingUnits && units?.map(unit => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>{unit.abbreviation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>
                Organize products by types, features, or functions.
              </CardDescription>
              <div className="pt-2">
                <Button size="sm" onClick={() => setIsAddCategoryOpen(true)}>
                  <PlusCircle className="mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingCategories && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoadingCategories && categories?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No categories yet. Click "Add Category" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoadingCategories && categories?.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">{category.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands">
          <Card>
            <CardHeader>
              <CardTitle>Brands</CardTitle>
              <CardDescription>
                Group products by manufacturer brands or product lines.
              </CardDescription>
              <div className="pt-2">
                <Button size="sm" onClick={() => setIsAddBrandOpen(true)}>
                  <PlusCircle className="mr-2" />
                  Add Brand
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand Name</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingBrands && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoadingBrands && brands?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No brands yet. Click "Add Brand" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoadingBrands && brands?.map(brand => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell className="text-muted-foreground">{brand.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <AddUnitDialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen} />
      <AddAttributeDialog open={isAddAttributeOpen} onOpenChange={setIsAddAttributeOpen} />
      <AddCategoryDialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen} />
      <AddBrandDialog open={isAddBrandOpen} onOpenChange={setIsAddBrandOpen} />
    </>
  );
}
