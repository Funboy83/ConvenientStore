'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { initializeFirebase } from '@/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { CheckCircle2, DollarSign, Package, User, Search, FileText } from 'lucide-react'

interface FinalInvoice {
  id: string
  employeeId: string
  employeeType: string
  customerId: string | null
  customerName?: string
  items: Array<{
    productId: string
    productName: string
    productNumber: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  status: string
  isPending: boolean
  isFinalized: boolean
  transactionCreatedAt: string
  transactionCreatedAtTimestamp: number
  finalizedAt: string
  finalizedAtTimestamp: number
  originalTransactionId: string
  source: string
  version: string
}

export default function FinalInvoicesPage() {
  const { firestore, auth } = initializeFirebase()
  
  const [invoices, setInvoices] = useState<FinalInvoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<FinalInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<FinalInvoice | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [authChecked, setAuthChecked] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth state
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          // Sign in anonymously if not authenticated
          try {
            await import('firebase/auth').then(({ signInAnonymously }) => signInAnonymously(auth))
            console.log('✅ Signed in anonymously for final invoices')
          } catch (error) {
            console.error('Auth error:', error)
          }
        }
        setAuthChecked(true)
        unsubscribe()
      })
    }
    checkAuth()
  }, [auth])

  // Load final invoices
  const loadInvoices = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const finalRef = collection(firestore, 'final_invoices')
      const q = query(
        finalRef,
        orderBy('finalizedAtTimestamp', 'desc')
      )

      const snapshot = await getDocs(q)
      
      // Fetch customer names for each invoice
      const invs: FinalInvoice[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const invoice = {
            id: docSnap.id,
            ...docSnap.data()
          } as FinalInvoice

          // Fetch customer name if customerId exists
          if (invoice.customerId) {
            try {
              if (invoice.customerId === 'walk-in') {
                invoice.customerName = 'Walk-in Customer'
              } else {
                const { doc, getDoc } = await import('firebase/firestore')
                const customerRef = doc(firestore, 'customers', invoice.customerId)
                const customerSnap = await getDoc(customerRef)
                if (customerSnap.exists()) {
                  invoice.customerName = customerSnap.data().name || 'Unknown'
                } else {
                  invoice.customerName = 'Unknown Customer'
                }
              }
            } catch (error) {
              console.error('Error fetching customer:', error)
              invoice.customerName = 'Error loading name'
            }
          } else {
            invoice.customerName = 'No Customer'
          }

          return invoice
        })
      )

      setInvoices(invs)
      setFilteredInvoices(invs)
      
      if (invs.length === 0) {
        setMessage({ type: 'success', text: 'No finalized invoices yet.' })
      }
    } catch (error: any) {
      console.error('Error loading invoices:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to load final invoices'
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter invoices
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInvoices(invoices)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = invoices.filter(inv => 
      inv.id.toLowerCase().includes(query) ||
      inv.originalTransactionId.toLowerCase().includes(query) ||
      inv.employeeId.toLowerCase().includes(query) ||
      inv.items.some(item => 
        item.productName.toLowerCase().includes(query) ||
        item.productNumber.toLowerCase().includes(query)
      )
    )

    setFilteredInvoices(filtered)
  }, [searchQuery, invoices])

  useEffect(() => {
    // Only load invoices after authentication is checked
    if (authChecked) {
      loadInvoices()
    }
  }, [authChecked])

  // Calculate totals
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalItems = filteredInvoices.reduce((sum, inv) => sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Final Invoices</h1>
          <p className="text-muted-foreground">
            Finalized and approved sales transactions
          </p>
        </div>
        <Button onClick={loadInvoices} variant="outline" disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.length !== invoices.length && `of ${invoices.length} total`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Finalized sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Items sold
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

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice ID, transaction ID, employee, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>
            Click on an invoice to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>No invoices found</p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search query' : 'No finalized invoices yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Finalized</TableHead>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Transaction Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow 
                      key={inv.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedInvoice(selectedInvoice?.id === inv.id ? null : inv)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-xs">
                            {format(new Date(inv.finalizedAt), 'MMM d, HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{inv.id.substring(0, 8)}</code>
                      </TableCell>
                      <TableCell>
                        {format(new Date(inv.transactionCreatedAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="text-xs">{inv.employeeId.substring(0, 8)}</span>
                          <Badge variant="outline" className="text-xs">
                            {inv.employeeType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {inv.customerName ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" />
                            <span className="text-xs">{inv.customerName}</span>
                            {inv.customerId === 'walk-in' && (
                              <Badge variant="secondary" className="text-xs">Walk-in</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No customer</span>
                        )}
                      </TableCell>
                      <TableCell>{inv.items.length} items</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {inv.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${inv.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details */}
      {selectedInvoice && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>{selectedInvoice.id}</CardDescription>
              </div>
              <Badge variant="default" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Finalized
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold">Original Transaction ID</p>
                <code className="text-xs text-muted-foreground">{selectedInvoice.originalTransactionId}</code>
              </div>
              <div>
                <p className="text-sm font-semibold">Employee ID</p>
                <p className="text-sm text-muted-foreground">{selectedInvoice.employeeId}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Employee Type</p>
                <Badge variant="outline">{selectedInvoice.employeeType}</Badge>
              </div>
              <div>
                <p className="text-sm font-semibold">Payment Method</p>
                <Badge variant="secondary">{selectedInvoice.paymentMethod}</Badge>
              </div>
              <div>
                <p className="text-sm font-semibold">Transaction Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedInvoice.transactionCreatedAt), 'MMM d, yyyy HH:mm:ss')}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Finalized</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedInvoice.finalizedAt), 'MMM d, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Items</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.productNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">${item.totalPrice.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-1">
                <span>Subtotal</span>
                <span>${selectedInvoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Tax</span>
                <span>${selectedInvoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Discount</span>
                <span>-${selectedInvoice.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>${selectedInvoice.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
