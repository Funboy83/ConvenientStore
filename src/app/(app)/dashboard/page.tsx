'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  CreditCard,
  DollarSign,
  ShieldAlert,
  Loader2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { DashboardChart } from "@/components/dashboard-chart"
import { getDashboardStats } from '@/lib/report-actions';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

interface DashboardStats {
  totalRevenue: number;
  revenueChange: string;
  transactionCount: number;
  activeNow: number;
  flaggedActivities: number;
}

interface RecentActivity {
  id: string;
  user: string;
  role: string;
  action: string;
  timestamp: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    revenueChange: '+0%',
    transactionCount: 0,
    activeNow: 0,
    flaggedActivities: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResult = await getDashboardStats();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      // Fetch recent transactions for activity log
      const { firestore } = initializeFirebase();
      const transactionsRef = collection(firestore, 'pending_transactions');
      const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(5));
      const snapshot = await getDocs(q);

      const activities: RecentActivity[] = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          user: data.employeeEmail?.split('@')[0] || 'Unknown',
          role: 'Cashier',
          action: data.paymentMethod === 'void' ? 'VOID' : 'SALE',
          timestamp: data.createdAt
        };
      });
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const recentLogs = recentActivity.slice(0, 5)

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Welcome back! Here's a summary of your store's activity." />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Welcome back! Here's a summary of your store's activity." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.revenueChange}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.transactionCount}</div>
            <p className="text-xs text-muted-foreground">
              Today's transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{recentActivity.length > 0 ? new Set(recentActivity.map(a => a.user)).size : 0}</div>
            <p className="text-xs text-muted-foreground">
              Employees recently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Transactions
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.transactionCount}</div>
            <p className="text-xs text-muted-foreground">
              Sales completed today
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <div className="lg:col-span-4">
            <DashboardChart />
        </div>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-medium">{log.user}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {log.role}
                      </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={log.action === 'VOID' || log.action === 'NO_SALE' ? 'destructive' : 'secondary'}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
