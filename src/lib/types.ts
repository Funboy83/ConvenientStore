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

// Product with optional attributes for variants
export type Product = {
  id: string;
  name: string;
  barcode: string; // Shared barcode for all attribute combinations
  category?: string;
  brand?: string;
  image?: string;
  imageHint?: string;
  description?: string;
  costPrice?: number;
  sellingPrice?: number;
  // Parent product relationship
  parentProductId?: string; // If set, this is a child/variant product
  isParentProduct?: boolean; // If true, this is a parent-only product (not directly sellable)
  // If attributes exist, this is a parent product
  attributes?: Array<{
    attributeName: string; // e.g., "Smell"  
    attributeValue: string; // e.g., "Rose"
  }>;
  // Stock tracked per attribute combination
  stockByAttribute?: Record<string, number>; // e.g., {"Rose": 15, "Lavender": 20}
  onHand?: number; // Total stock (for products without attributes)
  manageByLot?: string;
  position?: string;
  weight?: number;
  weightUnit?: string;
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
