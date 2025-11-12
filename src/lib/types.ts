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

// Parent Product (groups variants with shared barcode)
export type Product = {
  id: string;
  name: string;
  sharedBarcode: string; // Single barcode for all variants
  hasVariants: boolean; // Flag to check if product has variants
  category?: string;
  brand?: string;
  image?: string;
  imageHint?: string;
  description?: string;
  // Fields that used to be here are now in variants
};

// Variant (actual sellable item with specific attributes)
export type Variant = {
  id: string;
  productId: string; // Links to parent product
  variantName: string; // e.g., "Rose", "Lavender"
  fullName: string; // e.g., "Shampoo - Rose"
  stockQuantity: number; // Inventory tracked per variant
  costPrice: number;
  sellingPrice: number;
  sku?: string; // Optional internal code
  weight?: number;
  weightUnit?: string;
  position?: string;
  manageByLot?: boolean;
  isActive?: boolean;
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
