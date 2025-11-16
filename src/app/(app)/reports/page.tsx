"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Download,
  Calendar,
  BarChart3,
  ShoppingCart,
  Loader2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSalesReport, getInventoryReport, getTransactionReport } from "@/lib/report-actions";

type ReportType = 'overview' | 'sales' | 'inventory' | 'employees' | 'transactions' | 'alerts';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('overview');
  const [dateRange, setDateRange] = useState('last-7-days');
  const [loading, setLoading] = useState(false);
  
  // Real data from Firebase
  const [salesReportData, setSalesReportData] = useState<any[]>([]);
  const [inventoryReportData, setInventoryReportData] = useState<any[]>([]);
  const [transactionReportData, setTransactionReportData] = useState<any[]>([]);

  // Load data when report type or date range changes
  useEffect(() => {
    loadReportData();
  }, [selectedReport, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      if (selectedReport === 'sales' || selectedReport === 'overview') {
        const salesResult = await getSalesReport(dateRange);
        if (salesResult.success) {
          setSalesReportData(salesResult.data);
        }
      }
      
      if (selectedReport === 'inventory' || selectedReport === 'overview') {
        const inventoryResult = await getInventoryReport();
        if (inventoryResult.success) {
          setInventoryReportData(inventoryResult.data);
        }
      }
      
      if (selectedReport === 'transactions') {
        const transactionResult = await getTransactionReport(dateRange);
        if (transactionResult.success) {
          setTransactionReportData(transactionResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for employees and alerts (not yet implemented in backend)
  const employeeReportData = [
    { name: 'David Smith', role: 'Cashier', sales: 234, revenue: 12456.80, avgSale: 53.25, hours: 40, performance: 'excellent' },
    { name: 'Maria Garcia', role: 'Manager', sales: 156, revenue: 8923.40, avgSale: 57.20, hours: 45, performance: 'good' },
    { name: 'John Doe', role: 'Cashier', sales: 198, revenue: 9876.50, avgSale: 49.88, hours: 38, performance: 'good' },
  ];

  const alertsReportData = [
    { time: '10:32:01 AM', type: 'Low Stock', severity: 'high', message: 'Water 1.5L stock below minimum', action: 'Reorder required' },
    { time: '9:45:22 AM', type: 'Price Change', severity: 'medium', message: 'Coffee price updated', action: 'Approved' },
  ];

  const reportCards = [
    {
      id: 'sales' as ReportType,
      title: 'Sales Report',
      description: 'Daily sales performance and trends',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      count: salesReportData.length,
      total: `$${salesReportData.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}`
    },
    {
      id: 'inventory' as ReportType,
      title: 'Inventory Report',
      description: 'Stock levels and product turnover',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      count: inventoryReportData.length,
      total: `$${inventoryReportData.reduce((sum, item) => sum + item.value, 0).toFixed(2)}`
    },
    {
      id: 'employees' as ReportType,
      title: 'Employee Performance',
      description: 'Staff activity and sales metrics',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      count: employeeReportData.length,
      total: `${employeeReportData.reduce((sum, item) => sum + item.sales, 0)} sales`
    },
    {
      id: 'transactions' as ReportType,
      title: 'Transaction Log',
      description: 'Detailed transaction history',
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      count: transactionReportData.length,
      total: `${transactionReportData.length} today`
    },
    {
      id: 'alerts' as ReportType,
      title: 'System Alerts',
      description: 'Important notifications and warnings',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      count: alertsReportData.filter(a => a.severity === 'high').length,
      total: `${alertsReportData.length} total`
    },
  ];

  const handleExport = () => {
    alert('Export functionality - will download CSV/Excel file');
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">Loading report data...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    switch (selectedReport) {
      case 'sales':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Sales Report - {dateRange.replace(/-/g, ' ').toUpperCase()}</CardTitle>
              <CardDescription>Daily sales transactions, revenue, and top products</CardDescription>
            </CardHeader>
            <CardContent>
              {salesReportData.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No sales data available for this period
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Transactions</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Avg Transaction</TableHead>
                        <TableHead>Top Product</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReportData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{new Date(row.date).toLocaleDateString()}</TableCell>
                          <TableCell>{row.transactions}</TableCell>
                          <TableCell className="text-green-600 font-semibold">${row.revenue.toFixed(2)}</TableCell>
                          <TableCell>${row.avgTransaction.toFixed(2)}</TableCell>
                          <TableCell>{row.topProduct}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {salesReportData.reduce((sum, item) => sum + item.transactions, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Transactions</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          ${salesReportData.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          ${salesReportData.length > 0 ? (salesReportData.reduce((sum, item) => sum + item.avgTransaction, 0) / salesReportData.length).toFixed(2) : '0.00'}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Transaction</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );

      case 'inventory':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Inventory Report</CardTitle>
              <CardDescription>Current stock levels, values, and turnover rates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Turnover</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryReportData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.product}</TableCell>
                      <TableCell>{row.stock}</TableCell>
                      <TableCell>{row.minStock}</TableCell>
                      <TableCell>
                        <Badge variant={
                          row.status === 'good' ? 'default' :
                          row.status === 'low' ? 'secondary' :
                          'destructive'
                        }>
                          {row.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>${row.value.toFixed(2)}</TableCell>
                      <TableCell>{row.turnover}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {inventoryReportData.filter(i => i.status === 'good').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Products in Good Stock</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {inventoryReportData.filter(i => i.status === 'low').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Low Stock Alerts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {inventoryReportData.filter(i => i.status === 'critical').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Critical Stock</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'employees':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Employee Performance Report</CardTitle>
              <CardDescription>Staff sales metrics and performance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg Sale</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeReportData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>{row.sales}</TableCell>
                      <TableCell className="text-green-600">${row.revenue.toFixed(2)}</TableCell>
                      <TableCell>${row.avgSale.toFixed(2)}</TableCell>
                      <TableCell>{row.hours}h</TableCell>
                      <TableCell>
                        <Badge variant={
                          row.performance === 'excellent' ? 'default' :
                          row.performance === 'good' ? 'secondary' :
                          'outline'
                        }>
                          {row.performance.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'transactions':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Log - Today</CardTitle>
              <CardDescription>Detailed transaction history with status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionReportData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.id}</TableCell>
                      <TableCell>{row.time}</TableCell>
                      <TableCell>{row.cashier}</TableCell>
                      <TableCell className="text-green-600 font-semibold">${row.amount.toFixed(2)}</TableCell>
                      <TableCell>{row.items}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.payment.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'completed' ? 'default' : 'destructive'}>
                          {row.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'alerts':
        return (
          <Card>
            <CardHeader>
              <CardTitle>System Alerts & Notifications</CardTitle>
              <CardDescription>Important warnings and flagged activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertsReportData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.time}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>
                        <Badge variant={
                          row.severity === 'high' ? 'destructive' :
                          row.severity === 'medium' ? 'secondary' :
                          'outline'
                        }>
                          {row.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.message}</TableCell>
                      <TableCell>{row.action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description="View detailed reports and analysis of your store operations"
      />

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Report Type Cards - Overview */}
      {selectedReport === 'overview' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {reportCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card 
                key={card.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedReport(card.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 ${card.bgColor} rounded-lg`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                  <div className="mt-3 flex items-center text-xs text-muted-foreground">
                    <BarChart3 className="mr-1 h-3 w-3" />
                    {card.count} items
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Back to Overview Button */
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedReport('overview')}
          >
            ← Back to Overview
          </Button>
        </div>
      )}

      {/* Detailed Report Content */}
      {selectedReport !== 'overview' && renderReportContent()}
    </>
  );
}
