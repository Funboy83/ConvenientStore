import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export async function getSalesReport(dateRange: string = 'last-7-days') {
  try {
    const { firestore } = initializeFirebase();
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last-7-days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last-30-days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'this-month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last-month':
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(0); // Last day of previous month
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    // Fetch transactions from pending_transactions collection
    const transactionsRef = collection(firestore, 'pending_transactions');
    const q = query(
      transactionsRef,
      where('createdAt', '>=', startDate.toISOString()),
      where('createdAt', '<=', endDate.toISOString())
    );
    const snapshot = await getDocs(q);

    // Group by date
    const dailySales = new Map<string, {
      date: string;
      transactions: number;
      revenue: number;
      items: Map<string, number>; // product name -> quantity
    }>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const date = new Date(data.createdAt).toISOString().split('T')[0];
      
      if (!dailySales.has(date)) {
        dailySales.set(date, {
          date,
          transactions: 0,
          revenue: 0,
          items: new Map()
        });
      }

      const daySale = dailySales.get(date)!;
      daySale.transactions++;
      daySale.revenue += data.total || 0;

      // Count items
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          const productName = item.productName || 'Unknown';
          const currentCount = daySale.items.get(productName) || 0;
          daySale.items.set(productName, currentCount + (item.quantity || 1));
        });
      }
    });

    // Convert to array and calculate top products
    const salesData = Array.from(dailySales.values()).map(day => {
      // Find top selling product for the day
      let topProduct = 'N/A';
      let maxQuantity = 0;
      day.items.forEach((quantity, productName) => {
        if (quantity > maxQuantity) {
          maxQuantity = quantity;
          topProduct = productName;
        }
      });

      const avgTransaction = day.transactions > 0 ? day.revenue / day.transactions : 0;

      return {
        date: day.date,
        transactions: day.transactions,
        revenue: day.revenue,
        avgTransaction,
        topProduct
      };
    });

    // Sort by date
    salesData.sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data: salesData };
  } catch (error) {
    console.error('Error fetching sales report:', error);
    return { success: false, error: 'Failed to fetch sales report', data: [] };
  }
}

export async function getInventoryReport() {
  try {
    const { firestore } = initializeFirebase();
    
    const productsRef = collection(firestore, 'products');
    const snapshot = await getDocs(productsRef);

    const inventoryData = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const stock = data.onHand || 0;
      const minStock = data.minInventory || 50;
      
      let status: 'good' | 'low' | 'critical' = 'good';
      if (stock === 0) {
        status = 'critical';
      } else if (stock < minStock) {
        status = 'low';
      }

      const value = stock * (data.costPrice || 0);

      return {
        product: data.name || 'Unnamed Product',
        stock,
        minStock,
        status,
        value,
        turnover: 'N/A' // Would need sales data to calculate
      };
    });

    // Sort by status (critical first, then low, then good)
    inventoryData.sort((a: any, b: any) => {
      const statusOrder: any = { critical: 0, low: 1, good: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    return { success: true, data: inventoryData };
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    return { success: false, error: 'Failed to fetch inventory report', data: [] };
  }
}

export async function getTransactionReport(dateRange: string = 'today') {
  try {
    const { firestore } = initializeFirebase();
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    if (dateRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
    }

    const transactionsRef = collection(firestore, 'pending_transactions');
    const q = query(
      transactionsRef,
      where('createdAt', '>=', startDate.toISOString()),
      where('createdAt', '<=', endDate.toISOString()),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);

    const transactions = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const createdAt = new Date(data.createdAt);
      
      return {
        id: doc.id.substring(0, 10).toUpperCase(),
        time: createdAt.toLocaleTimeString('en-US'),
        cashier: data.employeeEmail || 'Unknown',
        amount: data.total || 0,
        items: data.items?.length || 0,
        payment: data.paymentMethod || 'cash',
        status: data.status || 'completed'
      };
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error('Error fetching transaction report:', error);
    return { success: false, error: 'Failed to fetch transaction report', data: [] };
  }
}

export async function getDashboardStats() {
  try {
    const { firestore } = initializeFirebase();
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's transactions
    const transactionsRef = collection(firestore, 'pending_transactions');
    const todayQuery = query(
      transactionsRef,
      where('createdAt', '>=', today.toISOString()),
      where('createdAt', '<', tomorrow.toISOString())
    );
    const todaySnapshot = await getDocs(todayQuery);

    let totalRevenue = 0;
    let transactionCount = 0;

    todaySnapshot.forEach((doc: any) => {
      const data = doc.data();
      totalRevenue += data.total || 0;
      transactionCount++;
    });

    // Get last month's stats for comparison
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastMonthQuery = query(
      transactionsRef,
      where('createdAt', '>=', lastMonth.toISOString()),
      where('createdAt', '<', today.toISOString())
    );
    const lastMonthSnapshot = await getDocs(lastMonthQuery);

    let lastMonthRevenue = 0;
    lastMonthSnapshot.forEach((doc: any) => {
      lastMonthRevenue += doc.data().total || 0;
    });

    const revenueChange = lastMonthRevenue > 0 
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : '0';

    return {
      success: true,
      data: {
        totalRevenue,
        transactionCount,
        revenueChange: `+${revenueChange}%`,
        activeNow: 0, // Would need auth session data
        flaggedActivities: 0 // Would need to track flagged activities
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      success: false,
      error: 'Failed to fetch dashboard stats',
      data: {
        totalRevenue: 0,
        transactionCount: 0,
        revenueChange: '+0%',
        activeNow: 0,
        flaggedActivities: 0
      }
    };
  }
}
