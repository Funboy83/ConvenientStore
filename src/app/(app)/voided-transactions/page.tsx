'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore'
import { initializeFirebase } from '@/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { XCircle, DollarSign, Package, User, AlertTriangle } from 'lucide-react'

interface VoidedTransaction {
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
  tenderedAmount?: number
  changeGiven?: number
  status: string
  isVoided: boolean
  transactionCreatedAt: string
  transactionCreatedAtTimestamp: number
  voidedAt: string
  voidedAtTimestamp: number
  voidedBy: string
  originalTransactionId: string
  source: string
  version: string
}

export default function VoidedTransactionsPage() {
  const { firestore, auth } = initializeFirebase()
  
  const [transactions, setTransactions] = useState<VoidedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<VoidedTransaction | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          try {
            await import('firebase/auth').then(({ signInAnonymously }) => signInAnonymously(auth))
            console.log('✅ Signed in anonymously for admin dashboard')
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

  // Load voided transactions
  const loadTransactions = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const voidedRef = collection(firestore, 'voided_transactions')
      const q = query(voidedRef, orderBy('voidedAtTimestamp', 'desc'))

      const snapshot = await getDocs(q)
      
      // Fetch customer names
      const txns: VoidedTransaction[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const txn = {
            id: docSnap.id,
            ...docSnap.data()
          } as VoidedTransaction

          // Fetch customer name if customerId exists
          if (txn.customerId) {
            try {
              if (txn.customerId === 'walk-in') {
                txn.customerName = 'Walk-in Customer'
              } else {
                const customerRef = doc(firestore, 'customers', txn.customerId)
                const customerSnap = await getDoc(customerRef)
                if (customerSnap.exists()) {
                  txn.customerName = customerSnap.data().name || 'Unknown'
                } else {
                  txn.customerName = 'Unknown Customer'
                }
              }
            } catch (error) {
              console.error('Error fetching customer:', error)
              txn.customerName = 'Error loading name'
            }
          } else {
            txn.customerName = 'No Customer'
          }
          return txn
        })
      )

      setTransactions(txns)
      
      if (txns.length === 0) {
        setMessage({ type: 'success', text: 'No voided transactions found.' })
      }
    } catch (error: any) {
      console.error('Error loading voided transactions:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to load voided transactions'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authChecked) {
      loadTransactions()
    }
  }, [authChecked])

  // Calculate totals
  const totalAmount = transactions.reduce((sum, txn) => sum + txn.total, 0)
  const totalItems = transactions.reduce((sum, txn) => sum + txn.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <XCircle className="h-8 w-8 text-red-600" />
            Voided Transactions
          </h1>
          <p className="text-muted-foreground">
            Audit trail of canceled transactions
          </p>
        </div>
        <Button onClick={loadTransactions} variant="outline" disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Warning Banner */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          These transactions were voided and <strong>no inventory was deducted</strong>. This is for audit purposes only.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voided Transactions</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total canceled
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Voided</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Not collected
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Not Sold</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Inventory not deducted
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

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Voided Transaction History</CardTitle>
          <CardDescription>
            Click on a transaction to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No voided transactions</p>
              <p className="text-sm">Great! No sales have been canceled.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voided Date</TableHead>
                    <TableHead>Original Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Voided By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow 
                      key={txn.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTransaction(selectedTransaction?.id === txn.id ? null : txn)}
                    >
                      <TableCell>
                        <div className="text-red-600 font-semibold">
                          {format(new Date(txn.voidedAt), 'MMM d, yyyy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(txn.transactionCreatedAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{txn.originalTransactionId.substring(0, 8)}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="text-xs">{txn.employeeId.substring(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {txn.customerName ? (
                          <span className="text-xs">{txn.customerName}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No customer</span>
                        )}
                      </TableCell>
                      <TableCell>{txn.items.length} items</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{txn.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">
                        ${txn.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {txn.voidedBy}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details */}
      {selectedTransaction && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Voided Transaction Details</CardTitle>
            <CardDescription>
              Original ID: {selectedTransaction.originalTransactionId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold">Transaction Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedTransaction.transactionCreatedAt), 'PPpp')}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Voided At</p>
                <p className="text-sm text-red-600 font-semibold">
                  {format(new Date(selectedTransaction.voidedAt), 'PPpp')}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Voided By</p>
                <p className="text-sm text-muted-foreground">{selectedTransaction.voidedBy}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Employee</p>
                <p className="text-sm text-muted-foreground">{selectedTransaction.employeeId}</p>
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
                  {selectedTransaction.items.map((item, idx) => (
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
                <span>${selectedTransaction.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Tax</span>
                <span>${selectedTransaction.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Discount</span>
                <span>-${selectedTransaction.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t text-red-600">
                <span>Total (Voided)</span>
                <span>${selectedTransaction.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
