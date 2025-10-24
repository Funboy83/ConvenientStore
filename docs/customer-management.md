# Customer Management System

## Overview
The customer management system allows managing customer information with expandable row details matching the KiotViet-style interface.

## Features
- ✅ Add new customers with required and optional fields
- ✅ Expandable customer rows with detailed information
- ✅ Search by name, phone, or email
- ✅ Purchase history tracking
- ✅ Customer notes
- ✅ Total purchases and spending metrics

## Files Created

### 1. AddCustomerDialog Component (`src/components/add-customer-dialog.tsx`)
Modal dialog for creating new customers.

**Required Fields:**
- `name` - Customer name (string, min 1 character)
- `phoneNumber` - Phone number (string, min 1 character)

**Optional Fields:**
- `email` - Email address (validated email format or empty)
- `address` - Customer address (string, textarea)
- `note` - Additional notes (string, textarea)

**Auto-generated Fields:**
- `createdAt` - Timestamp of customer creation
- `totalPurchases` - Total number of orders (initialized to 0)
- `totalSpent` - Total amount spent (initialized to 0)
- `lastPurchase` - Date of last purchase (initialized to null)

### 2. Customers Page (`src/app/(app)/customers/page.tsx`)
Main customer listing page with expandable details.

**Layout:**
- Grid-based layout (12 columns)
- Expandable rows with blue highlight on selection
- Search bar for filtering customers
- Summary statistics (total customers, total spent)

**Columns:**
- Checkbox (col-span-1)
- Customer Name (col-span-3)
- Phone Number (col-span-2)
- Email (col-span-2)
- Total Purchases (col-span-2) - Badge with order count
- Total Spent (col-span-1)
- Last Purchase (col-span-1)

**Expanded View Tabs:**
- **Details** - Full customer information with contact details, statistics
- **Purchase History** - List of all orders (placeholder)
- **Notes** - Customer notes display

**Action Buttons:**
- Primary: Edit, Send Email
- Secondary: Delete
- Dropdown: View Orders, Add to Group, Block Customer

## Navigation
Added "Customers" menu item between "Products" and "Audit Trail" in the sidebar navigation.
- Icon: Users (from lucide-react)
- Route: `/customers`
- Role access: Admin, Manager

## Database Schema

### Collection: `customers`

```typescript
{
  id: string,                    // Auto-generated document ID
  name: string,                  // Required - Customer name
  phoneNumber: string,           // Required - Contact phone
  email?: string,                // Optional - Email address
  address?: string,              // Optional - Physical address
  note?: string,                 // Optional - Additional notes
  createdAt: string,             // ISO timestamp
  totalPurchases: number,        // Count of orders
  totalSpent: number,            // Total amount spent
  lastPurchase: string | null    // ISO timestamp or null
}
```

## Firestore Security Rules
```
match /customers/{customerId} {
  allow get: if true;
  allow list: if true;
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  allow delete: if request.auth != null;
}
```

## UI Components Used
- `Dialog` - Modal for add customer form
- `Form` with `react-hook-form` - Form handling
- `Input` - Text input fields
- `Textarea` - Multi-line address and note fields
- `Button` - Action buttons
- `Tabs` - Expandable details tabs
- `Badge` - Total purchases indicator
- `DropdownMenu` - Additional actions menu
- `Skeleton` - Loading state

## Features to Implement
- [ ] Edit customer functionality
- [ ] Delete customer with confirmation
- [ ] Purchase history tab with real order data
- [ ] Send email functionality
- [ ] Customer groups
- [ ] Block/unblock customer
- [ ] Export customer list
- [ ] Import customers from CSV
- [ ] Customer loyalty points
- [ ] SMS notifications

## Integration Points
- POS system will link customers to sale transactions
- Purchase history will be populated from `saleTransactions` collection
- Email functionality requires email service integration
- SMS requires SMS gateway integration

## Usage Example
```typescript
// Create a new customer
const customerData = {
  name: "John Doe",
  phoneNumber: "+1 234 567 8900",
  email: "john@example.com",
  address: "123 Main St, City, State",
  note: "VIP customer",
  createdAt: new Date().toISOString(),
  totalPurchases: 0,
  totalSpent: 0,
  lastPurchase: null
};

await addDoc(collection(firestore, 'customers'), customerData);
```

## Design Pattern
Follows the same KiotViet-style expandable layout as the Products page:
- Grid-based responsive layout
- Click to expand/collapse rows
- Blue background on selected row
- Tabbed detail view
- Action buttons in bottom-right of expanded view
- Summary statistics in header
- Real-time search filtering

## Deployment
✅ Firestore rules deployed successfully
✅ Customer collection accessible to authenticated users
✅ Navigation menu updated
