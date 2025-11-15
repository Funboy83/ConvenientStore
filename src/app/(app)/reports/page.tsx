"use client";

import { useState } from "react";
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
  ShoppingCart
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

type ReportType = 'overview' | 'sales' | 'inventory' | 'employees' | 'transactions' | 'alerts';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('overview');
  const [dateRange, setDateRange] = useState('last-7-days');

  // Mock data for different reports
  const salesReportData = [
    { date: '2025-11-07', transactions: 145, revenue: 8234.50, avgTransaction: 56.83, topProduct: 'Coca Cola 330ml' },
    { date: '2025-11-08', transactions: 132, revenue: 7456.20, avgTransaction: 56.49, topProduct: 'Rice 5kg' },
    { date: '2025-11-09', transactions: 168, revenue: 9821.30, avgTransaction: 58.46, topProduct: 'Water 1.5L' },
    { date: '2025-11-10', transactions: 156, revenue: 8945.80, avgTransaction: 57.34, topProduct: 'Bread' },
    { date: '2025-11-11', transactions: 189, revenue: 11234.60, avgTransaction: 59.44, topProduct: 'Coffee' },
    { date: '2025-11-12', transactions: 203, revenue: 12456.90, avgTransaction: 61.37, topProduct: 'Snacks' },
    { date: '2025-11-13', transactions: 178, revenue: 10234.50, avgTransaction: 57.52, topProduct: 'Milk' },
  ];

  const inventoryReportData = [
    { product: 'Coca Cola 330ml', stock: 245, minStock: 100, status: 'good', value: 1225.00, turnover: '8.5 days' },
    { product: 'Rice 5kg', stock: 45, minStock: 50, status: 'low', value: 2250.00, turnover: '12 days' },
    { product: 'Water 1.5L', stock: 12, minStock: 80, status: 'critical', value: 180.00, turnover: '3 days' },
    { product: 'Bread', stock: 156, minStock: 80, status: 'good', value: 780.00, turnover: '2 days' },
    { product: 'Coffee', stock: 89, minStock: 60, status: 'good', value: 2670.00, turnover: '15 days' },
    { product: 'Snacks', stock: 234, minStock: 120, status: 'good', value: 4680.00, turnover: '7 days' },
    { product: 'Milk 1L', stock: 67, minStock: 70, status: 'low', value: 1675.00, turnover: '4 days' },
  ];

  const employeeReportData = [
    { name: 'David Smith', role: 'Cashier', sales: 234, revenue: 12456.80, avgSale: 53.25, hours: 40, performance: 'excellent' },
    { name: 'Maria Garcia', role: 'Manager', sales: 156, revenue: 8923.40, avgSale: 57.20, hours: 45, performance: 'good' },
    { name: 'John Doe', role: 'Cashier', sales: 198, revenue: 9876.50, avgSale: 49.88, hours: 38, performance: 'good' },
    { name: 'Sarah Johnson', role: 'Cashier', sales: 212, revenue: 11234.20, avgSale: 52.99, hours: 42, performance: 'excellent' },
    { name: 'Alex Johnson', role: 'Admin', sales: 45, revenue: 2345.60, avgSale: 52.12, hours: 20, performance: 'average' },
  ];

  const transactionReportData = [
    { id: 'TXN-001', time: '9:05:14 AM', cashier: 'David Smith', amount: 156.80, items: 8, payment: 'cash', status: 'completed' },
    { id: 'TXN-002', time: '9:15:22 AM', cashier: 'Maria Garcia', amount: 89.50, items: 5, payment: 'card', status: 'completed' },
    { id: 'TXN-003', time: '9:30:45 AM', cashier: 'David Smith', amount: 234.20, items: 12, payment: 'card', status: 'completed' },
    { id: 'TXN-004', time: '10:02:01 AM', cashier: 'Sarah Johnson', amount: 45.60, items: 3, payment: 'cash', status: 'completed' },
    { id: 'TXN-005', time: '10:30:18 AM', cashier: 'David Smith', amount: 178.90, items: 9, payment: 'card', status: 'completed' },
    { id: 'TXN-006', time: '10:45:33 AM', cashier: 'Maria Garcia', amount: 67.40, items: 4, payment: 'cash', status: 'voided' },
  ];

  const alertsReportData = [
    { time: '10:32:01 AM', type: 'Low Stock', severity: 'high', message: 'Water 1.5L stock below minimum', action: 'Reorder required' },
    { time: '9:45:22 AM', type: 'Price Change', severity: 'medium', message: 'Coffee price updated by Maria Garcia', action: 'Approved' },
    { time: '8:15:45 AM', type: 'Void Transaction', severity: 'high', message: 'TXN-006 voided by Maria Garcia', action: 'Under review' },
    { time: 'Yesterday', type: 'Low Stock', severity: 'medium', message: 'Rice 5kg approaching minimum', action: 'Monitor' },
    { time: 'Yesterday', type: 'Large Transaction', severity: 'low', message: 'Transaction over $500 by David Smith', action: 'Verified' },
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
    switch (selectedReport) {
      case 'sales':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Sales Report - Last 7 Days</CardTitle>
              <CardDescription>Daily sales transactions, revenue, and top products</CardDescription>
            </CardHeader>
            <CardContent>
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
                      ${(salesReportData.reduce((sum, item) => sum + item.avgTransaction, 0) / salesReportData.length).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Transaction</div>
                  </div>
                </div>
              </div>
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
