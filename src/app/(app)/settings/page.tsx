
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddUnitDialog } from '@/components/add-unit-dialog';
import { AddAttributeDialog } from '@/components/add-attribute-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddAttributeOpen, setIsAddAttributeOpen] = useState(false);
  const firestore = useFirestore();

  const unitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'units');
  }, [firestore]);

  const attributesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'productAttributes');
  }, [firestore]);

  const { data: units, isLoading: isLoadingUnits } = useCollection(unitsQuery);
  const { data: attributes, isLoading: isLoadingAttributes } = useCollection(attributesQuery);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage application-wide settings for products."
      />
      <Tabs defaultValue="attributes">
        <TabsList className="mb-4">
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
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
      </Tabs>
      <AddUnitDialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen} />
      <AddAttributeDialog open={isAddAttributeOpen} onOpenChange={setIsAddAttributeOpen} />
    </>
  );
}
