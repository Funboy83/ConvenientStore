'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, where, addDoc, deleteDoc, doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { initializeFirebase } from '@/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Clock, DollarSign, Package, User, CreditCard } from 'lucide-react'

interface PendingTransaction {
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
  isPending: boolean
  isFinalized: boolean
  createdAt: string
  createdAtTimestamp: number
  source: string
  version: string
}

export default function PendingTransactionsPage() {
  const { firestore, auth } = initializeFirebase()
  
  const [transactions, setTransactions] = useState<PendingTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<PendingTransaction | null>(null)
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

  // Load pending transactions
  const loadTransactions = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const pendingRef = collection(firestore, 'pending_transactions')
      // Simplified query - filter client-side until index is built
      const q = query(
        pendingRef,
        orderBy('createdAtTimestamp', 'desc')
      )

      const snapshot = await getDocs(q)
      
      // Filter for pending transactions client-side and fetch customer names
      const txns: PendingTransaction[] = await Promise.all(
        snapshot.docs
          .map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          } as PendingTransaction))
          .filter(txn => txn.isPending === true)
          .map(async (txn) => {
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
        setMessage({ type: 'success', text: 'No pending transactions to review. All caught up! 🎉' })
      }
    } catch (error: any) {
      console.error('Error loading transactions:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to load pending transactions'
      })
    } finally {
      setLoading(false)
    }
  }

  // Finalize a single transaction
  const finalizeTransaction = async (transaction: PendingTransaction) => {
    setProcessing(transaction.id)
    setMessage(null)

    try {
      // Step 1: Deduct inventory for each item
      console.log('📦 Deducting inventory for', transaction.items.length, 'items')
      for (const item of transaction.items) {
        const productRef = doc(firestore, 'products', item.productId)
        
        // Get current product to check stock
        const productSnap = await getDoc(productRef)
        if (productSnap.exists()) {
          const currentStock = productSnap.data().onHand || 0
          console.log(`  - ${item.productName}: ${currentStock} -> ${currentStock - item.quantity}`)
          
          // Update inventory (deduct quantity)
          await updateDoc(productRef, {
            onHand: increment(-item.quantity),
            updatedAt: new Date().toISOString()
          })
        } else {
          console.warn(`  ⚠️ Product ${item.productId} not found`)
        }
      }

      // Step 2: Update customer purchase history (if customer exists and is not walk-in)
      if (transaction.customerId && transaction.customerId !== 'walk-in') {
        console.log('👤 Updating customer purchase history:', transaction.customerId)
        try {
          const customerRef = doc(firestore, 'customers', transaction.customerId)
          const customerSnap = await getDoc(customerRef)
          
          if (customerSnap.exists()) {
            const customerData = customerSnap.data()
            const currentTotalPurchases = customerData.totalPurchases || 0
            const currentTotalSpent = customerData.totalSpent || 0
            
            await updateDoc(customerRef, {
              totalPurchases: currentTotalPurchases + 1,
              totalSpent: currentTotalSpent + transaction.total,
              lastPurchase: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            console.log('✅ Customer purchase history updated')
          } else {
            console.warn('⚠️ Customer not found:', transaction.customerId)
          }
        } catch (error) {
          console.error('Error updating customer:', error)
          // Continue with finalization even if customer update fails
        }
      }

      // Step 3: Create final invoice
      const finalInvoiceData = {
        // Original transaction data
        employeeId: transaction.employeeId,
        employeeType: transaction.employeeType,
        customerId: transaction.customerId,
        items: transaction.items,
        subtotal: transaction.subtotal,
        tax: transaction.tax,
        discount: transaction.discount,
        total: transaction.total,
        paymentMethod: transaction.paymentMethod,
        
        // Cash handling audit fields (if present)
        ...(transaction.tenderedAmount !== undefined && {
          tenderedAmount: transaction.tenderedAmount,
          changeGiven: transaction.changeGiven || 0,
        }),
        
        // Finalization metadata
        status: 'finalized',
        isPending: false,
        isFinalized: true,
        inventoryDeducted: true,
        
        // Timestamps
        transactionCreatedAt: transaction.createdAt,
        transactionCreatedAtTimestamp: transaction.createdAtTimestamp,
        finalizedAt: new Date().toISOString(),
        finalizedAtTimestamp: Date.now(),
        
        // Audit trail
        originalTransactionId: transaction.id,
        source: transaction.source,
        version: transaction.version,
      }

      // Step 4: Add to final_invoices collection
      const finalRef = collection(firestore, 'final_invoices')
      await addDoc(finalRef, finalInvoiceData)

      // Step 5: Delete from pending_transactions
      const pendingDoc = doc(firestore, 'pending_transactions', transaction.id)
      await deleteDoc(pendingDoc)

      console.log('✅ Transaction finalized, inventory deducted, and customer updated')

      setMessage({
        type: 'success',
        text: `Transaction ${transaction.id.substring(0, 8)} finalized successfully! Inventory deducted and customer updated.`
      })

      // Reload transactions
      await loadTransactions()
    } catch (error: any) {
      console.error('Error finalizing transaction:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to finalize transaction'
      })
    } finally {
      setProcessing(null)
    }
  }

  // Void a transaction (save to voided_transactions for audit trail)
  const voidTransaction = async (transaction: PendingTransaction) => {
    if (!confirm(`Are you sure you want to VOID this transaction?\n\nTransaction ID: ${transaction.id.substring(0, 8)}\nTotal: $${transaction.total.toFixed(2)}\n\nThis will be saved as a voided transaction for audit purposes.\nInventory will NOT be deducted.`)) {
      return
    }

    setProcessing(transaction.id)
    setMessage(null)

    try {
      // Get current admin user info
      const currentUser = auth.currentUser
      const voidedBy = currentUser?.email || currentUser?.uid || 'unknown'

      // Create voided transaction record
      const voidedTransactionData = {
        // Original transaction data
        ...transaction,
        
        // Void metadata
        status: 'voided',
        isPending: false,
        isFinalized: false,
        isVoided: true,
        
        // Audit trail
        voidedAt: new Date().toISOString(),
        voidedAtTimestamp: Date.now(),
        voidedBy: voidedBy,
        originalTransactionId: transaction.id,
        
        // Keep original timestamps
        transactionCreatedAt: transaction.createdAt,
        transactionCreatedAtTimestamp: transaction.createdAtTimestamp,
      }

      // Step 1: Add to voided_transactions collection
      const voidedRef = collection(firestore, 'voided_transactions')
      await addDoc(voidedRef, voidedTransactionData)

      // Step 2: Delete from pending_transactions
      const pendingDoc = doc(firestore, 'pending_transactions', transaction.id)
      await deleteDoc(pendingDoc)

      console.log('✅ Transaction voided and saved to audit trail')

      setMessage({
        type: 'success',
        text: `Transaction ${transaction.id.substring(0, 8)} has been voided and saved to audit trail.`
      })

      // Reload transactions
      await loadTransactions()
    } catch (error: any) {
      console.error('Error voiding transaction:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to void transaction'
      })
    } finally {
      setProcessing(null)
    }
  }

  // Finalize all transactions
  const finalizeAll = async () => {
    if (!confirm(`Finalize all ${transactions.length} pending transactions?`)) {
      return
    }

    setMessage(null)
    let successCount = 0
    let errorCount = 0

    for (const txn of transactions) {
      try {
        await finalizeTransaction(txn)
        successCount++
      } catch (error) {
        console.error('Error finalizing:', txn.id, error)
        errorCount++
      }
    }

    setMessage({
      type: errorCount === 0 ? 'success' : 'error',
      text: `Finalized ${successCount} transactions. ${errorCount} errors.`
    })
  }

  useEffect(() => {
    // Only load transactions after authentication is checked
    if (authChecked) {
      loadTransactions()
    }
  }, [authChecked])

  // Calculate totals
  const totalAmount = transactions.reduce((sum, txn) => sum + txn.total, 0)
  const totalItems = transactions.reduce((sum, txn) => sum + txn.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
  
  // Calculate cash drawer totals
  const cashTransactions = transactions.filter(txn => txn.paymentMethod === 'cash' && txn.tenderedAmount !== undefined)
  const expectedCashInDrawer = cashTransactions.reduce((sum, txn) => sum + txn.total, 0)
  const actualCashReceived = cashTransactions.reduce((sum, txn) => sum + (txn.tenderedAmount || 0), 0)
  const totalChangeGiven = cashTransactions.reduce((sum, txn) => sum + (txn.changeGiven || 0), 0)
  const netCashInDrawer = actualCashReceived - totalChangeGiven

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pending Transactions</h1>
          <p className="text-muted-foreground">
            Review and finalize employee sales
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTransactions} variant="outline" disabled={loading}>
            Refresh
          </Button>
          {transactions.length > 0 && (
            <Button onClick={finalizeAll} disabled={loading || processing !== null}>
              Finalize All ({transactions.length})
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across all pending sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Items sold
            </p>
          </CardContent>
        </Card>

        <Card className={cashTransactions.length > 0 ? 'border-green-200 bg-green-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Drawer</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">${netCashInDrawer.toFixed(2)}</div>
            <p className="text-xs text-green-600">
              {cashTransactions.length} cash transaction{cashTransactions.length !== 1 ? 's' : ''}
            </p>
            {cashTransactions.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <div>Received: ${actualCashReceived.toFixed(2)}</div>
                <div>Change: -${totalChangeGiven.toFixed(2)}</div>
                <div className="font-semibold border-t pt-1">Net: ${netCashInDrawer.toFixed(2)}</div>
              </div>
            )}
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
          <CardTitle>Transaction List</CardTitle>
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
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No pending transactions</p>
              <p className="text-sm">All sales have been finalized!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Cash Details</TableHead>
                    <TableHead>Actions</TableHead>
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
                        {format(new Date(txn.createdAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{txn.id.substring(0, 8)}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="text-xs">{txn.employeeId.substring(0, 8)}</span>
                          <Badge variant="outline" className="text-xs">
                            {txn.employeeType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {txn.customerName ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" />
                            <span className="text-xs">{txn.customerName}</span>
                            {txn.customerId === 'walk-in' && (
                              <Badge variant="secondary" className="text-xs">Walk-in</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No customer</span>
                        )}
                      </TableCell>
                      <TableCell>{txn.items.length} items</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {txn.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${txn.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {txn.paymentMethod === 'cash' && txn.tenderedAmount !== undefined ? (
                          <div className="text-xs">
                            <div className="text-green-700">
                              Received: <span className="font-semibold">${txn.tenderedAmount.toFixed(2)}</span>
                            </div>
                            <div className="text-green-600">
                              Change: <span className="font-semibold">${(txn.changeGiven || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              finalizeTransaction(txn)
                            }}
                            disabled={processing === txn.id}
                          >
                            {processing === txn.id ? 'Processing...' : 'Finalize'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              voidTransaction(txn)
                            }}
                            disabled={processing === txn.id}
                          >
                            Void
                          </Button>
                        </div>
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
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              {selectedTransaction.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold">Employee ID</p>
                <p className="text-sm text-muted-foreground">{selectedTransaction.employeeId}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Employee Type</p>
                <Badge variant="outline">{selectedTransaction.employeeType}</Badge>
              </div>
              <div>
                <p className="text-sm font-semibold">Payment Method</p>
                <Badge variant="secondary">{selectedTransaction.paymentMethod}</Badge>
              </div>
              <div>
                <p className="text-sm font-semibold">Source</p>
                <p className="text-sm text-muted-foreground">{selectedTransaction.source}</p>
              </div>
            </div>

            {/* Cash Handling Audit Info */}
            {selectedTransaction.paymentMethod === 'cash' && selectedTransaction.tenderedAmount !== undefined && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cash Transaction Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-green-700 font-medium">Total Amount</p>
                    <p className="text-green-900 font-bold">${selectedTransaction.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-green-700 font-medium">Cash Received</p>
                    <p className="text-green-900 font-bold">${selectedTransaction.tenderedAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-green-700 font-medium">Change Given</p>
                    <p className="text-green-900 font-bold">${(selectedTransaction.changeGiven || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-green-700 font-medium">Verification</p>
                    <p className="text-green-900 font-bold">
                      {selectedTransaction.tenderedAmount - selectedTransaction.total === (selectedTransaction.changeGiven || 0) 
                        ? '✓ Correct' 
                        : '⚠️ Mismatch'}
                    </p>
                  </div>
                </div>
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
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>${selectedTransaction.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
