'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, MoreHorizontal, Search, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddCustomerDialog } from '@/components/add-customer-dialog';
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
import { Badge } from '@/components/ui/badge';
import { initializeFirebase } from '@/firebase';

export default function CustomersPage() {
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const firestore = useFirestore();
  const { auth } = initializeFirebase();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          try {
            await import('firebase/auth').then(({ signInAnonymously }) => signInAnonymously(auth));
            console.log('✅ Signed in anonymously for customers page');
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

  const customersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'customers');
  }, [firestore]);

  const { data: customers, isLoading } = useCollection(customersQuery);

  const handleRowClick = (customerId: string) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };

  const filteredCustomers = customers?.filter((customer: any) =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phoneNumber?.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalCustomers = customers?.length || 0;
  const totalSpent = customers?.reduce((sum: number, c: any) => sum + (c.totalSpent || 0), 0) || 0;

  return (
    <>
      <div className="space-y-4">
        {/* Header with search and actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground">Manage your customer database</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsAddCustomerOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
            <Button variant="outline">Import</Button>
            <Button variant="outline">Export</Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="px-4 py-2 bg-muted rounded-md">
              <span className="text-muted-foreground">Total Customers: </span>
              <span className="font-semibold">{totalCustomers}</span>
            </div>
            <div className="px-4 py-2 bg-muted rounded-md">
              <span className="text-muted-foreground">Total Spent: </span>
              <span className="font-semibold">${totalSpent.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="border rounded-lg bg-white">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium">
            <div className="col-span-1 flex items-center gap-2">
              <input type="checkbox" className="rounded" />
            </div>
            <div className="col-span-3">Customer Name</div>
            <div className="col-span-2">Phone Number</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-2">Total Purchases</div>
            <div className="col-span-1">Total Spent</div>
            <div className="col-span-1">Last Purchase</div>
          </div>

          {/* Customer Rows */}
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
            
            {!isLoading && filteredCustomers?.map((customer: any) => (
              <div key={customer.id} className={`border-b ${expandedCustomerId === customer.id ? 'bg-blue-50' : ''}`}>
                {/* Main Row */}
                <div
                  className="grid grid-cols-12 gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(customer.id)}
                >
                  <div className="col-span-1 flex items-center gap-2">
                    <input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="col-span-3 font-medium">{customer.name}</div>
                  <div className="col-span-2 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {customer.phoneNumber}
                  </div>
                  <div className="col-span-2 flex items-center gap-1 text-sm">
                    {customer.email ? (
                      <>
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {customer.email}
                      </>
                    ) : (
                      <span className="text-muted-foreground">---</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    <Badge variant={customer.totalPurchases > 0 ? 'default' : 'secondary'}>
                      {customer.totalPurchases || 0} orders
                    </Badge>
                  </div>
                  <div className="col-span-1 text-right font-medium">
                    ${(customer.totalSpent || 0).toFixed(2)}
                  </div>
                  <div className="col-span-1 text-sm text-muted-foreground">
                    {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : '---'}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedCustomerId === customer.id && (
                  <div className="border-t bg-white">
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
                        <TabsTrigger value="details" className="rounded-none">Details</TabsTrigger>
                        <TabsTrigger value="history" className="rounded-none">Purchase History</TabsTrigger>
                        <TabsTrigger value="notes" className="rounded-none">Notes</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-xl font-semibold mb-4">{customer.name}</h3>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                            <div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                Phone Number
                              </div>
                              <div className="font-medium">{customer.phoneNumber}</div>
                            </div>

                            <div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                Email
                              </div>
                              <div className="font-medium">{customer.email || 'Not provided'}</div>
                            </div>

                            <div>
                              <div className="text-sm text-muted-foreground">Customer Since</div>
                              <div className="font-medium">
                                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '---'}
                              </div>
                            </div>

                            <div className="col-span-3">
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Address
                              </div>
                              <div className="font-medium">{customer.address || 'Not provided'}</div>
                            </div>

                            <div>
                              <div className="text-sm text-muted-foreground">Total Orders</div>
                              <div className="font-medium text-lg">{customer.totalPurchases || 0}</div>
                            </div>

                            <div>
                              <div className="text-sm text-muted-foreground">Total Spent</div>
                              <div className="font-medium text-lg text-green-600">
                                ${(customer.totalSpent || 0).toFixed(2)}
                              </div>
                            </div>

                            <div>
                              <div className="text-sm text-muted-foreground">Last Purchase</div>
                              <div className="font-medium">
                                {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'Never'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between mt-6 pt-6 border-t">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <span className="mr-2">🗑️</span> Delete
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-blue-600">
                              <span className="mr-2">✏️</span> Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <span className="mr-2">📧</span> Send Email
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  View Orders
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Add to Group
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Block Customer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="history" className="p-6">
                        <div className="text-sm text-muted-foreground">
                          {customer.totalPurchases > 0 ? (
                            <p>Purchase history will be displayed here.</p>
                          ) : (
                            <p>No purchases yet.</p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="notes" className="p-6">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Customer Notes</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.note || 'No notes available.'}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            ))}

            {!isLoading && filteredCustomers?.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                {searchQuery ? (
                  <p>No customers found matching "{searchQuery}"</p>
                ) : (
                  <p>No customers yet. Add your first customer to get started!</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isLoading && filteredCustomers && filteredCustomers.length > 0 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-muted-foreground">
              <div>Showing {filteredCustomers.length} customer(s)</div>
            </div>
          )}
        </div>
      </div>

      <AddCustomerDialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen} />
    </>
  );
}
