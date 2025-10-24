# Supplier Management System

## Overview
The supplier management system allows managing supplier information with a clean KiotViet-style interface matching the reference design.

## Features
- ✅ Add new suppliers with auto-generated supplier numbers
- ✅ Required supplier name field
- ✅ Optional phone, email fields
- ✅ Collapsible address section (optional)
- ✅ Search by supplier number, name, or phone
- ✅ Summary row showing total credit amount and total purchases
- ✅ Clean table layout matching KiotViet design

## Files Created

### 1. AddSupplierDialog Component (`src/components/add-supplier-dialog.tsx`)
Modal dialog for creating new suppliers with a simplified form.

**Required Fields:**
- `supplierName` - Supplier name (string, min 1 character)

**Optional Fields:**
- `phoneNumber` - Phone number (string)
- `email` - Email address (validated email format or empty)
- `address` - Supplier address (string, textarea)
- `state` - State/Province (string)
- `county` - County/District (string)

**Auto-generated Fields:**
- `supplierNumber` - Format: NCCOXXXXXX (auto-generated from timestamp)
- `createdAt` - Timestamp of supplier creation
- `totalPurchaseAmount` - Total purchase amount (initialized to 0)
- `creditAmount` - Supplier's credit amount (initialized to 0)

**Key Features:**
- Collapsible "Address" section with chevron icon
- Address section starts collapsed by default
- Clean two-column layout for fields
- "Auto-generated" placeholder for supplier number field (disabled)

### 2. Suppliers Page (`src/app/(app)/suppliers/page.tsx`)
Main supplier listing page matching KiotViet design exactly.

**Layout:**
- Grid-based layout (12 columns)
- Summary row with totals in blue background
- Search bar with filter icon
- Action buttons: Supplier, Import file, Export file, and utility icons

**Columns:**
- Checkbox (col-span-1)
- Supplier number (col-span-2) - Format: NCCOXXXXXX
- Supplier name (col-span-3)
- Phone number (col-span-2)
- Email (col-span-2)
- Supplier's credit amount (col-span-1, right-aligned)
- Total purchase (col-span-1, right-aligned)

**Summary Row:**
- Blue background (bg-blue-50)
- Shows total credit amount in green
- Shows total purchase amount in blue
- Dollar format with 2 decimal places

**Footer:**
- "Show X rows" dropdown selector (15, 30, 50, 100)

## Navigation
Added "Suppliers" menu item after "Customers" in the sidebar navigation.
- Icon: Users (from lucide-react)
- Route: `/suppliers`
- Role access: Admin, Manager

## Database Schema

### Collection: `suppliers`

```typescript
{
  id: string,                    // Auto-generated document ID
  supplierNumber: string,        // Required - Auto-generated (NCCOXXXXXX)
  supplierName: string,          // Required - Supplier name
  phoneNumber?: string,          // Optional - Contact phone
  email?: string,                // Optional - Email address
  address?: string,              // Optional - Physical address
  state?: string,                // Optional - State/Province
  county?: string,               // Optional - County/District
  createdAt: string,             // ISO timestamp
  totalPurchaseAmount: number,   // Total purchase amount
  creditAmount: number           // Supplier's credit amount
}
```

## Firestore Security Rules
```
match /suppliers/{supplierId} {
  allow get: if true;
  allow list: if true;
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  allow delete: if request.auth != null;
}
```

## UI Components Used
- `Dialog` - Modal for add supplier form
- `Form` with `react-hook-form` - Form handling
- `Input` - Text input fields
- `Textarea` - Multi-line address field
- `Button` - Action buttons
- `ChevronDown`/`ChevronUp` - Collapsible section indicators
- `Skeleton` - Loading state

## Key Design Decisions

### 1. Simplified Dialog
Removed unnecessary sections from the reference design:
- ❌ Supplier group, note section
- ❌ Invoice information section
- ✅ Kept only essential fields: name, phone, email, address

### 2. Collapsible Address
- Address section is collapsible with chevron icon
- Starts collapsed by default
- Includes: Address (textarea), State, County fields
- Smooth transition on expand/collapse

### 3. Auto-generated Supplier Number
- Format: NCCOXXXXXX (e.g., NCC000001, NCC123456)
- Generated from timestamp last 6 digits
- Displayed as disabled field with "Auto-generated" placeholder

### 4. Table Layout
- Matches KiotViet design exactly
- Summary row with colored totals (green for credit, blue for purchase)
- Clean hover states
- Right-aligned monetary values

## Features to Implement
- [ ] Edit supplier functionality
- [ ] Delete supplier with confirmation
- [ ] View supplier purchase history
- [ ] Import suppliers from file (Excel/CSV)
- [ ] Export suppliers to file
- [ ] Bulk actions (select multiple suppliers)
- [ ] Supplier groups/categories
- [ ] Credit limit management
- [ ] Payment terms
- [ ] Supplier performance metrics

## Integration Points
- Purchase orders will link to suppliers
- Inventory batches will track supplier information
- Payment tracking for supplier credit amounts
- Purchase history reports by supplier

## Usage Example
```typescript
// Create a new supplier
const supplierData = {
  supplierNumber: "NCC000123",
  supplierName: "ABC Wholesale Co.",
  phoneNumber: "714555555",
  email: "hot@gmail.com",
  address: "123 Business St",
  state: "California",
  county: "Los Angeles",
  createdAt: new Date().toISOString(),
  totalPurchaseAmount: 6000.00,
  creditAmount: 6000.00
};

await addDoc(collection(firestore, 'suppliers'), supplierData);
```

## Number Format
All monetary values are formatted with:
- Dollar sign ($)
- Comma thousands separator
- Two decimal places
- Right-aligned in table cells

Example: `$6,000.00`

## Deployment
✅ Firestore rules deployed successfully
✅ Supplier collection accessible to authenticated users
✅ Navigation menu updated with Suppliers item
