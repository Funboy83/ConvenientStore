import type { User, InventoryItem, Product, AuditLog } from './types';

export const users: User[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    role: 'Admin',
    avatar: '/avatars/01.png',
  },
  {
    id: '2',
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    role: 'Manager',
    avatar: '/avatars/02.png',
  },
  {
    id: '3',
    name: 'David Smith',
    email: 'david.smith@example.com',
    role: 'Cashier',
    avatar: '/avatars/03.png',
  },
];

export const inventory: InventoryItem[] = [
  {
    id: 'inv-001',
    name: 'Premium Coffee Beans',
    sku: 'SKU-PCB-500G',
    category: 'Coffee',
    image: 'https://picsum.photos/seed/101/400/400',
    imageHint: 'coffee beans',
    batches: [
      { id: 'B001', receivedDate: '2024-07-01', expiryDate: '2025-07-01', quantity: 50 },
      { id: 'B005', receivedDate: '2024-07-15', expiryDate: '2025-07-15', quantity: 75 },
    ],
  },
  {
    id: 'inv-002',
    name: 'Fresh Whole Milk',
    sku: 'SKU-FWM-1L',
    category: 'Dairy',
    image: 'https://picsum.photos/seed/102/400/400',
    imageHint: 'milk carton',
    batches: [
      { id: 'B002', receivedDate: '2024-07-20', expiryDate: '2024-08-05', quantity: 100 },
      { id: 'B006', receivedDate: '2024-07-22', expiryDate: '2024-08-07', quantity: 120 },
    ],
  },
  {
    id: 'inv-003',
    name: 'Assorted Pastries',
    sku: 'SKU-AP-12P',
    category: 'Bakery',
    image: 'https://picsum.photos/seed/103/400/400',
    imageHint: 'pastries box',
    batches: [
      { id: 'B003', receivedDate: '2024-07-24', expiryDate: '2024-07-27', quantity: 30 },
    ],
  },
  {
    id: 'inv-004',
    name: 'Vanilla Syrup',
    sku: 'SKU-VS-750ML',
    category: 'Syrups',
    image: 'https://picsum.photos/seed/104/400/400',
    imageHint: 'syrup bottle',
    batches: [
      { id: 'B004', receivedDate: '2024-06-15', expiryDate: '2025-06-15', quantity: 40 },
    ],
  },
  {
    id: 'inv-005',
    name: 'Branded Paper Cups',
    sku: 'SKU-PC-100CT',
    category: 'Disposables',
    image: 'https://picsum.photos/seed/105/400/400',
    imageHint: 'paper cups',
    batches: [
      { id: 'B007', receivedDate: '2024-05-20', expiryDate: 'N/A', quantity: 500 },
    ],
  },
];


export const products: Product[] = [
  { id: 'prod-001', name: 'Espresso', price: 2.50, image: 'https://picsum.photos/seed/201/400/400', imageHint: 'espresso shot' },
  { id: 'prod-002', name: 'Latte', price: 3.75, image: 'https://picsum.photos/seed/202/400/400', imageHint: 'latte art' },
  { id: 'prod-003', name: 'Cappuccino', price: 3.50, image: 'https://picsum.photos/seed/203/400/400', imageHint: 'cappuccino foam' },
  { id: 'prod-004', name: 'Americano', price: 3.00, image: 'https://picsum.photos/seed/204/400/400', imageHint: 'black coffee' },
  { id: 'prod-005', name: 'Croissant', price: 2.75, image: 'https://picsum.photos/seed/106/400/400', imageHint: 'croissant pastry' },
  { id: 'prod-006', name: 'Chocolate Cookie', price: 1.50, image: 'https://picsum.photos/seed/107/400/400', imageHint: 'cookie chocolate' },
  { id: 'prod-007', name: 'Blueberry Muffin', price: 2.25, image: 'https://picsum.photos/seed/108/400/400', imageHint: 'muffin blueberry' },
  { id: 'prod-008', name: 'Iced Tea', price: 2.80, image: 'https://picsum.photos/seed/208/400/400', imageHint: 'iced tea' },
];

export const auditLogs: AuditLog[] = [
    { id: 'log-001', timestamp: '2024-07-25 09:05:14', user: 'David Smith', role: 'Cashier', action: 'SALE', details: 'Transaction #10234 - $6.25' },
    { id: 'log-002', timestamp: '2024-07-25 09:15:22', user: 'Maria Garcia', role: 'Manager', action: 'LOGIN', details: 'Logged in from terminal POS-01' },
    { id: 'log-003', timestamp: '2024-07-25 10:30:45', user: 'David Smith', role: 'Cashier', action: 'SALE', details: 'Transaction #10235 - $12.50' },
    { id: 'log-004', timestamp: '2024-07-25 10:32:01', user: 'Maria Garcia', role: 'Manager', action: 'VOID', details: 'Voided Transaction #10235 for David Smith' },
    { id: 'log-005', timestamp: '2024-07-25 11:05:33', user: 'Alex Johnson', role: 'Admin', action: 'USER_UPDATE', details: 'Updated permissions for role "Cashier"' },
    { id: 'log-006', timestamp: '2024-07-25 13:45:10', user: 'David Smith', role: 'Cashier', action: 'NO_SALE', details: 'Cash drawer opened without sale' },
    { id: 'log-007', timestamp: '2024-07-25 14:20:05', user: 'Maria Garcia', role: 'Manager', action: 'INVENTORY_ADJ', details: 'Adjusted "Fresh Whole Milk" by -2 units' },
];
