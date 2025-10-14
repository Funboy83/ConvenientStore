export type UserRole = 'Admin' | 'Manager' | 'Cashier';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
};

export type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  role?: UserRole[];
};

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  imageHint: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  image: string;
  imageHint: string;
  batches: Batch[];
};

export type Batch = {
  id: string;
  receivedDate: string;
  expiryDate: string;
  quantity: number;
};

export type AuditLog = {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  details: string;
};
