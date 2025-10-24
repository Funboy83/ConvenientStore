'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { initializeFirebase } from '@/firebase'
import { PageHeader } from '@/components/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { format } from 'date-fns'
import { RefreshCw, DollarSign, CheckCircle2, Clock } from 'lucide-react'

interface AuditLog {
  id: string
  timestamp: string
  timestampMs: number
  user: string
  userId: string
  userType: string
  action: string
  details: string
  type: 'TRANSACTION_CREATED' | 'TRANSACTION_FINALIZED' | 'INVENTORY_DEDUCTED'
  amount?: number
  paymentMethod?: string
  itemCount?: number
  tenderedAmount?: number
  changeGiven?: number
}

export default function AuditTrailPage() {
  const { firestore, auth } = initializeFirebase()
  
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          try {
            await import('firebase/auth').then(({ signInAnonymously }) => signInAnonymously(auth))
            console.log('✅ Signed in anonymously for audit trail')
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

  // Load audit logs from pending and final transactions
  const loadAuditLogs = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const allLogs: AuditLog[] = []

      // Load pending transactions
      const pendingRef = collection(firestore, 'pending_transactions')
      const pendingQuery = query(
        pendingRef,
        orderBy('createdAtTimestamp', 'desc'),
        limit(100)
      )
      const pendingSnapshot = await getDocs(pendingQuery)
      
      pendingSnapshot.docs.forEach(doc => {
        const data = doc.data()
        allLogs.push({
          id: `pending-${doc.id}`,
          timestamp: data.createdAt,
          timestampMs: data.createdAtTimestamp,
          user: data.employeeType === 'anonymous' ? 'POS Employee (Anonymous)' : 'POS Employee',
          userId: data.employeeId,
          userType: data.employeeType,
          action: 'TRANSACTION_CREATED',
          details: `Created ${data.paymentMethod} transaction for $${data.total.toFixed(2)} with ${data.items.length} item(s)${
            data.paymentMethod === 'cash' && data.tenderedAmount 
              ? ` - Cash: $${data.tenderedAmount.toFixed(2)}, Change: $${(data.changeGiven || 0).toFixed(2)}` 
              : ''
          }`,
          type: 'TRANSACTION_CREATED',
          amount: data.total,
          paymentMethod: data.paymentMethod,
          itemCount: data.items.length,
          tenderedAmount: data.tenderedAmount,
          changeGiven: data.changeGiven,
        })
      })

      // Load final invoices
      const finalRef = collection(firestore, 'final_invoices')
      const finalQuery = query(
        finalRef,
        orderBy('finalizedAtTimestamp', 'desc'),
        limit(100)
      )
      const finalSnapshot = await getDocs(finalQuery)
      
      finalSnapshot.docs.forEach(doc => {
        const data = doc.data()
        
        // Log for finalization
        allLogs.push({
          id: `finalized-${doc.id}`,
          timestamp: data.finalizedAt,
          timestampMs: data.finalizedAtTimestamp,
          user: 'Admin/Manager',
          userId: 'system',
          userType: 'admin',
          action: 'TRANSACTION_FINALIZED',
          details: `Finalized transaction ${data.originalTransactionId?.substring(0, 8)} - $${data.total.toFixed(2)} via ${data.paymentMethod}${
            data.paymentMethod === 'cash' && data.tenderedAmount 
              ? ` - Cash: $${data.tenderedAmount.toFixed(2)}, Change: $${(data.changeGiven || 0).toFixed(2)}` 
              : ''
          }`,
          type: 'TRANSACTION_FINALIZED',
          amount: data.total,
          paymentMethod: data.paymentMethod,
          itemCount: data.items.length,
          tenderedAmount: data.tenderedAmount,
          changeGiven: data.changeGiven,
        })

        // Log for inventory deduction
        if (data.inventoryDeducted) {
          allLogs.push({
            id: `inventory-${doc.id}`,
            timestamp: data.finalizedAt,
            timestampMs: data.finalizedAtTimestamp + 1, // Slightly after finalization
            user: 'System',
            userId: 'system',
            userType: 'system',
            action: 'INVENTORY_DEDUCTED',
            details: `Deducted inventory for ${data.items.length} item(s): ${data.items.map((item: any) => `${item.productName} (x${item.quantity})`).join(', ')}`,
            type: 'INVENTORY_DEDUCTED',
            itemCount: data.items.length,
          })
        }
      })

      // Sort all logs by timestamp (most recent first)
      allLogs.sort((a, b) => b.timestampMs - a.timestampMs)

      setLogs(allLogs)
      
      if (allLogs.length === 0) {
        setMessage({ type: 'success', text: 'No audit logs found. Start making transactions!' })
      }
    } catch (error: any) {
      console.error('Error loading audit logs:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to load audit logs'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authChecked) {
      loadAuditLogs()
    }
  }, [authChecked])

  return (
    <>
      <PageHeader
        title="Audit Trail"
        description="A detailed log of all actions taken within the system."
      />

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Review all system events to ensure security and accountability.</CardDescription>
          </div>
          <Button onClick={loadAuditLogs} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <p>No audit logs found</p>
              <p className="text-sm">Activity will appear here as transactions are created and finalized</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.user}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.userId.substring(0, 12)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        log.action === 'TRANSACTION_CREATED' ? 'secondary' :
                        log.action === 'TRANSACTION_FINALIZED' ? 'default' :
                        'outline'
                      }>
                        {log.action === 'TRANSACTION_CREATED' && <Clock className="h-3 w-3 mr-1" />}
                        {log.action === 'TRANSACTION_FINALIZED' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {log.action === 'INVENTORY_DEDUCTED' && <DollarSign className="h-3 w-3 mr-1" />}
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="text-sm">{log.details}</div>
                      {log.paymentMethod && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {log.paymentMethod.toUpperCase()}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.amount ? (
                        <div className="font-semibold text-green-600">
                          ${log.amount.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
