# Purchase Order & Lot Management Implementation

## Overview
This implementation adds a comprehensive Purchase Order system with lot/expiry date management, matching the KiotViet design pattern. Products can be configured to track lots and expiry dates, and the purchase flow conditionally shows lot management based on this setting.

## Features Implemented

### 1. Product: Manage by Lot/Expiry Date ✅

**Location**: `src/components/add-product-dialog.tsx`

Products now have a `manageByLot` field that determines if they require lot/expiry tracking:

```typescript
manageByLot: z.enum(["yes", "no"]).default("no")
```

**UI**:
- In the "Onhand" section of Add Product dialog
- Label: "Manage by lot, expiry date"
- Options: Yes / No (dropdown)
- Default: No

**When to use**:
- **Yes**: For products with expiry dates (food, medicine, cosmetics)
- **No**: For non-perishable products (hardware, furniture, electronics)

---

### 2. Purchase Order Page ✅

**Location**: `src/app/(app)/purchase/page.tsx`

A full-page purchase order interface (not a modal) for receiving stock.

**Features**:
- Product search by number/name/barcode (F3)
- Multiple line items with quantity, unit price, discount
- Supplier search (F4)
- Purchase receipt number (auto-generated)
- PO number (manual entry)
- Status indicator (Draft/Complete)
- Sub-total and total calculation
- Notes field
- Save (draft) and Complete buttons

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ ← Back        Purchase                                   │
├─────────────────────────────────────────────────────────┤
│ 🔍 Search by product number/name (F3)                   │
├─────────────────────────────────────────────────────────┤
│ No. | Product# | Product | Unit | Qty | Price | Total   │
│  1  | 070074...| Sữa...  | pcs  |  0  | $100  | $0.00  │
│     | Note...  |         |      |     |       |        │
│     | Lot mgmt |         |      |     |       |        │
├─────────────────────────────────────────────────────────┤
│                                    Supplier: [_______]  │
│                                    Receipt#: Auto       │
│                                    PO#: [__________]    │
│                                    Status: Draft        │
│                                    Sub-total: $0.00     │
│                                    Discount: [_____]    │
│                                    Total: $0.00         │
│                                    [💾 Save][✓Complete] │
└─────────────────────────────────────────────────────────┘
```

---

### 3. Conditional Lot Management ✅

**Logic**: Only products with `manageByLot='yes'` show lot/expiry controls in the purchase page.

#### For Products WITHOUT Lot Management (manageByLot='no'):
- No additional fields shown
- Simple quantity entry

#### For Products WITH Lot Management (manageByLot='yes'):

The product row shows additional controls:

```
┌──────────────────────────────────────────────────┐
│ Product: Bánh Chocopie 6C                        │
│ ┌──────────────────────────────────────────────┐ │
│ │ Enter lot, expiry date         [______]      │ │
│ │ Select lot                                   │ │
│ │ Add new lot, expiry date                     │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Options**:

1. **Enter manually**: Type lot name and expiry date directly
2. **Select existing lot**: Click "Select lot" to choose from existing lots
   - Shows existing lots with format: "Lot 1 - 12/31/2025 - On hand: 60"
   - Displays in orange badge when selected
3. **Add new lot**: Click "Add new lot, expiry date" to open modal

---

### 4. Add Lot Dialog ✅

**Location**: `src/components/add-lot-dialog.tsx`

Modal dialog for creating new lots when receiving stock.

**Fields**:
- **Lot name**: Text input (required)
  - Example: "Lot 1", "Batch A", "LOT-2025-001"
- **Expiry date**: Date picker (required)
  - Only allows future dates
  - Format: MM/DD/YYYY
- **Quantity**: Number input (required)
  - Minimum: 1
  - Pre-fills the purchase order quantity

**UI**:
```
┌───────────────────────────────────────────┐
│ Add new lot for 070074118659        [×]   │
├───────────────────────────────────────────┤
│ Lot name                                  │
│ [_________________________________]       │
│                                           │
│ Expiry date                               │
│ [Pick a date               📅]            │
│                                           │
│ Quantity                                  │
│ [_________________________________]       │
│                                           │
│                    [Cancel]  [Add]        │
└───────────────────────────────────────────┘
```

**Actions**:
- **Cancel**: Close without saving
- **Add**: Create lot and fill purchase order fields

---

### 5. Navigation Updates ✅

**Inventory Page** (`src/app/(app)/inventory/page.tsx`):
- "Add New Stock" button now navigates to `/purchase` page
- No longer opens the old AddStockDialog modal

**Sidebar Navigation** (`src/components/nav.tsx`):
- Added "Purchase" menu item
- Icon: ShoppingCart
- Route: `/purchase`
- Roles: Admin, Manager

---

## User Workflows

### Workflow 1: Add Product with Lot Management

1. Click "Add Product"
2. Fill in product details (name, price, etc.)
3. In "Onhand" section, set "Manage by lot, expiry date" to **Yes**
4. Click "Add Product"
5. ✅ Product is now configured for lot tracking

### Workflow 2: Receive Stock (No Lot Management)

1. Go to Inventory → Click "Add New Stock"
2. Search for product (e.g., "Hammer")
3. Product appears in table
4. Enter quantity and unit price
5. Click "Complete"
6. ✅ Stock added without lot tracking

### Workflow 3: Receive Stock (With Lot Management - New Lot)

1. Go to Inventory → Click "Add New Stock"
2. Search for product with lot management (e.g., "Sữa Ensure")
3. Product appears with lot management section
4. Click "Add new lot, expiry date"
5. **Add Lot Dialog opens**:
   - Enter Lot name: "LOT-2025-001"
   - Select Expiry date: 12/31/2025
   - Enter Quantity: 100
   - Click "Add"
6. Lot info fills in purchase order
7. Orange badge shows: "LOT-2025-001 - 12/31/2025 - On hand: 0"
8. Click "Complete"
9. ✅ Stock added with lot tracking

### Workflow 4: Receive Stock (With Lot Management - Existing Lot)

1. Go to Inventory → Click "Add New Stock"
2. Search for product with existing lots
3. Product appears with lot management section
4. Click "Select lot"
5. Choose from existing lots: "Lot 1 - 12/31/2025 - On hand: 60"
6. Selected lot appears in orange badge
7. Enter additional quantity
8. Click "Complete"
9. ✅ Stock added to existing lot

---

## Database Schema

### Products Collection - Additional Field

```typescript
{
  // ... existing fields
  manageByLot: "yes" | "no",  // NEW: Determines if lot tracking is required
}
```

### Lots Collection (Future)

```typescript
{
  id: string,
  productId: string,          // Reference to product
  lotName: string,            // User-defined lot name
  expiryDate: string,         // ISO date string
  receivedDate: string,       // ISO date string
  quantity: number,           // Current quantity
  initialQuantity: number,    // Original quantity received
  unitPrice: number,          // Cost per unit
  status: "active" | "expired" | "depleted"
}
```

### Purchase Orders Collection (Future)

```typescript
{
  id: string,
  receiptNumber: string,      // Auto-generated or manual
  poNumber: string,           // Purchase order number
  supplierId: string,         // Reference to supplier
  status: "draft" | "complete",
  items: [{
    productId: string,
    productNumber: string,
    productName: string,
    unit: string,
    quantity: number,
    unitPrice: number,
    discount: number,
    total: number,
    lotId?: string,           // If product has lot management
    lotName?: string,
    expiryDate?: string,
  }],
  subTotal: number,
  discount: number,
  total: number,
  note: string,
  createdAt: string,
  completedAt?: string,
}
```

---

## Technical Implementation Details

### Conditional Rendering in Purchase Page

```typescript
{item.manageByLot === 'yes' && (
  <div className="mt-2 space-y-1">
    {!item.lotName ? (
      <>
        <Input placeholder="Enter lot, expiry date" />
        <Button onClick={() => handleSelectLot(item.id)}>
          Select lot
        </Button>
      </>
    ) : (
      <div className="bg-orange-50 border-orange-200">
        {item.lotName} - {item.expiryDate} - On hand: {item.onHand}
      </div>
    )}
    <Button onClick={() => handleAddNewLot(item)}>
      Add new lot, expiry date
    </Button>
  </div>
)}
```

### State Management

The purchase page maintains:
- `purchaseItems[]`: Array of line items
- `selectedProduct`: Currently selected product for lot creation
- `isAddLotOpen`: Modal open state
- Real-time calculations for totals

---

## UI/UX Highlights

### Design Matches KiotViet

✅ **Full-page layout** (not modal)
✅ **Product search** with dropdown suggestions
✅ **Inline lot management** in table rows
✅ **Orange badges** for selected lots
✅ **Two-button footer**: Save (blue) + Complete (green)
✅ **Right sidebar** for totals and metadata

### Accessibility

- Keyboard shortcuts (F3 for product search, F4 for supplier)
- Clear visual indicators (orange for lots, blue for links)
- Form validation with error messages
- Loading states and empty states

### Responsive Design

- Table scrolls horizontally on mobile
- Sidebar stacks below on smaller screens
- Touch-friendly buttons and inputs

---

## Future Enhancements

### Phase 2 - Lot Selection Dropdown
- Fetch existing lots from Firestore
- Show lot details in dropdown (name, expiry, quantity)
- Filter by product ID
- Sort by expiry date (FIFO)

### Phase 3 - Supplier Management
- Create `suppliers` collection
- Supplier dropdown with autocomplete
- Add new supplier from purchase page
- Track supplier history

### Phase 4 - Purchase Order History
- List all purchase orders (draft + completed)
- Filter by date, supplier, status
- Edit draft orders
- Print purchase receipts
- Export to PDF/Excel

### Phase 5 - Inventory Updates
- Auto-update inventory when purchase order is completed
- Create inventory batches for FIFO tracking
- Update product `onHand` quantity
- Generate audit logs

### Phase 6 - Expiry Alerts
- Dashboard widget for expiring products
- Email/notification alerts 30 days before expiry
- Automatic status change for expired lots
- Suggested markdowns for near-expiry items

---

## Testing Checklist

### Product Creation
- [ ] Create product with manageByLot='no' → No lot fields in purchase
- [ ] Create product with manageByLot='yes' → Lot fields appear in purchase
- [ ] Toggle manageByLot setting → Purchase page reflects change

### Purchase Page
- [ ] Search for products by name
- [ ] Search for products by product number
- [ ] Search for products by barcode
- [ ] Add multiple products to purchase order
- [ ] Edit quantity, unit price, discount
- [ ] Calculate totals correctly
- [ ] Remove items from purchase order

### Lot Management
- [ ] Add new lot with valid data → Success
- [ ] Add new lot without lot name → Error
- [ ] Add new lot without expiry date → Error
- [ ] Add new lot with past expiry date → Error
- [ ] Select existing lot → Fills purchase order
- [ ] Lot badge displays correctly (orange with details)

### Navigation
- [ ] Inventory page → Click "Add New Stock" → Goes to /purchase
- [ ] Sidebar "Purchase" link → Goes to /purchase
- [ ] Purchase page → Click "← Back" → Returns to previous page

### Save & Complete
- [ ] Click "Save" → Purchase order saved as draft
- [ ] Click "Complete" → Purchase order completed
- [ ] Complete updates inventory (when implemented)

---

## Files Modified

### New Files
- ✅ `src/app/(app)/purchase/page.tsx` - Purchase order page
- ✅ `src/components/add-lot-dialog.tsx` - Add lot modal component

### Modified Files
- ✅ `src/app/(app)/inventory/page.tsx` - Changed button to navigate instead of modal
- ✅ `src/components/nav.tsx` - Added Purchase menu item
- ✅ `src/components/add-product-dialog.tsx` - Already had manageByLot field

### Unchanged (Legacy)
- `src/components/add-stock-dialog.tsx` - Old modal (can be removed)

---

## Summary

This implementation provides a complete purchase order workflow with conditional lot/expiry date management. Products are configured at creation time to either track lots or not, and the purchase interface adapts accordingly. The design closely matches the KiotViet reference screenshots, with a full-page layout, inline lot management, and clear visual indicators.

Key achievement: **Only products with lot management enabled show lot/expiry fields**, keeping the interface clean for non-perishable products while providing detailed tracking for items that need it.
