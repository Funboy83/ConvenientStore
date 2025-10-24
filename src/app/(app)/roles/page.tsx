'use client'

import { useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function RolesPage() {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<'admin' | 'employee'>('employee')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  const checkMyRole = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const functions = getFunctions()
      const getUserRole = httpsCallable(functions, 'getUserRole')
      
      const result = await getUserRole()
      const data = result.data as {
        success: boolean
        userId: string
        role: string | null
        isOwner: boolean
      }
      
      setCurrentRole(data.role)
      setCurrentUserId(data.userId)
      setIsOwner(data.isOwner)
      
      setMessage({
        type: 'success',
        text: `Your user ID: ${data.userId}\nYour role: ${data.role || 'None'}\nOwner: ${data.isOwner ? 'Yes' : 'No'}`
      })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to get your role'
      })
    } finally {
      setLoading(false)
    }
  }

  const setUserRole = async () => {
    if (!userId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a user ID' })
      return
    }

    setLoading(true)
    setMessage(null)
    
    try {
      const functions = getFunctions()
      const setRole = httpsCallable(functions, 'setUserRole')
      
      const result = await setRole({ userId: userId.trim(), role })
      const data = result.data as {
        success: boolean
        message: string
      }
      
      setMessage({
        type: 'success',
        text: data.message
      })
      setUserId('')
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to set user role'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Role Management</h1>
        <p className="text-muted-foreground">
          Manage custom roles for two-collection security model
        </p>
      </div>

      {/* Check My Role */}
      <Card>
        <CardHeader>
          <CardTitle>My Role Information</CardTitle>
          <CardDescription>
            Check your current role and user ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkMyRole} disabled={loading}>
            Check My Role
          </Button>

          {currentUserId && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-semibold">User ID:</span>
                <code className="text-sm bg-background px-2 py-1 rounded">
                  {currentUserId}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Role:</span>
                {currentRole ? (
                  <Badge variant={currentRole === 'admin' ? 'default' : 'secondary'}>
                    {currentRole}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Owner:</span>
                {isOwner ? (
                  <Badge variant="default">Yes</Badge>
                ) : (
                  <Badge variant="outline">No</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set User Role */}
      <Card>
        <CardHeader>
          <CardTitle>Set User Role</CardTitle>
          <CardDescription>
            Assign admin or employee roles to users (Owner only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="Enter Firebase User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Get the user ID from the "My Role Information" section above or from Firebase Console
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'employee') => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin (Full Access)</SelectItem>
                <SelectItem value="employee">Employee (Limited Access)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={setUserRole} disabled={loading}>
            {loading ? 'Setting Role...' : 'Set Role'}
          </Button>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
            <h4 className="font-semibold">Role Permissions:</h4>
            <ul className="text-sm space-y-1">
              <li className="flex items-start gap-2">
                <Badge variant="default" className="mt-0.5">Admin</Badge>
                <span>Full access to all collections, can review and finalize transactions</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">Employee</Badge>
                <span>Write-only to pending_transactions, cannot read/edit/delete</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription className="whitespace-pre-line">
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Collection Security Model</CardTitle>
          <CardDescription>
            How the security model works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">📝 pending_transactions</h4>
            <p className="text-sm text-muted-foreground">
              POS employees write sales here. Write-once only - cannot read, edit, or delete.
              Prevents fraud and tampering.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">✅ final_invoices</h4>
            <p className="text-sm text-muted-foreground">
              Admin reviews pending transactions and finalizes them here. Employees have zero access.
              Creates an immutable audit trail.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Quick Start:</h4>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Click "Check My Role" to get your User ID</li>
              <li>Copy your User ID</li>
              <li>Paste it in the "Set User Role" section</li>
              <li>Select "Admin" role</li>
              <li>Click "Set Role"</li>
              <li>You now have admin access!</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
