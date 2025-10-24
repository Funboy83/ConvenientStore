# Lot Management Fix - Database Integration

## Issue Fixed
The purchase page was showing a hardcoded "Lot 1 - 12/31/2025 - On hand: 60" example instead of fetching real lots from the database.

## Changes Made

### 1. Created `lots` Collection in Firestore ✅

**Schema**:
```typescript
{
  id: string,                    // Auto-generated document ID
  productNumber: string,         // Reference to product
  lotName: string,               // User-defined lot name (e.g., "LOT-001")
  expiryDate: string,            // Format: MM/DD/YYYY
  quantity: number,              // Current quantity in this lot
  initialQuantity: number,       // Original quantity when created
  createdAt: string,             // ISO timestamp
  status: "active" | "expired"   // Lot status
}
```

### 2. Updated Purchase Page (`src/app/(app)/purchase/page.tsx`)

**Before**: Hardcoded lot selection
```typescript
onClick={() => handleSelectLot(item.id, { 
  id: '1', 
  name: 'Lot 1', 
  expiryDate: '12/31/2025', 
  onHand: 60 
})}
```

**After**: Real database integration

#### Added Real-time Lot Fetching:
```typescript
// Fetch all lots from Firestore
const { data: allLots } = useCollection(
  useMemoFirebase(() => (firestore ? collection(firestore, 'lots') : null), [firestore])
);
```

#### Replaced Hardcoded Button with Dropdown:
```typescript
{(() => {
  // Filter lots by product number
  const productLots = allLots?.filter(
    (lot: any) => lot.productNumber === item.productNumber
  );
  
  return productLots && productLots.length > 0 ? (
    // Show dropdown with real lots
    <Select onValueChange={(lotId) => handleSelectLot(item.id, lotId)}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Select lot" />
      </SelectTrigger>
      <SelectContent>
        {productLots.map((lot: any) => (
          <SelectItem key={lot.id} value={lot.id}>
            {lot.lotName} - {lot.expiryDate} - On hand: {lot.quantity || 0}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    // Show message if no lots exist
    <div className="text-xs text-muted-foreground p-2 border rounded">
      No existing lots
    </div>
  );
})()}
```

#### Updated Lot Selection Handler:
```typescript
const handleSelectLot = (itemId: string, lotId: string) => {
  const lot = allLots?.find((l: any) => l.id === lotId);
  if (!lot) return;

  setPurchaseItems(
    purchaseItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          lotId: lot.id,
          lotName: lot.lotName,
          expiryDate: lot.expiryDate,
          onHand: lot.quantity || 0,
        };
      }
      return item;
    })
  );
};
```

#### Updated Add New Lot Function:
Now saves to Firestore when creating a new lot:
```typescript
const handleSaveLot = (lotData) => {
  if (selectedProduct && firestore) {
    const lotsCollection = collection(firestore, 'lots');
    
    addDoc(lotsCollection, {
      productNumber: selectedProduct.productNumber,
      lotName: lotData.lotName,
      expiryDate: lotData.expiryDate,
      quantity: lotData.quantity,
      initialQuantity: lotData.quantity,
      createdAt: new Date().toISOString(),
      status: 'active',
    }).then((docRef) => {
      // Update purchase item with new lot ID
      setPurchaseItems(/* ... */);
    });
  }
};
```

### 3. Updated Firestore Rules ✅

Added security rules for the `lots` collection:

```plaintext
match /lots/{lotId} {
  allow get: if true;
  allow list: if true;
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  allow delete: if request.auth != null;
}
```

**Deployed**: ✅ Rules deployed successfully to Firebase

### 4. Added Select Component Import

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

---

## How It Works Now

### Scenario 1: Product with NO Existing Lots

When you add a product with `manageByLot='yes'` that has no lots yet:

1. Search and add product to purchase order
2. Lot management section appears
3. Shows: **"No existing lots"** message
4. Click "Add new lot, expiry date"
5. Fill in modal: Lot name, Expiry date, Quantity
6. Click "Add"
7. ✅ Lot is saved to Firestore `lots` collection
8. Orange badge appears with lot details

### Scenario 2: Product with Existing Lots

When you add a product that already has lots:

1. Search and add product to purchase order
2. Lot management section appears
3. Shows: **Dropdown with existing lots**
   ```
   Select lot ▼
   ├─ LOT-001 - 12/31/2025 - On hand: 100
   ├─ LOT-002 - 01/15/2026 - On hand: 50
   └─ LOT-003 - 02/28/2026 - On hand: 75
   ```
4. Select a lot from dropdown
5. ✅ Orange badge appears with selected lot details
6. Can also click "Add new lot, expiry date" to create additional lot

### Scenario 3: Product without Lot Management

Products with `manageByLot='no'`:
- No lot section appears
- Simple quantity entry only

---

## Database Queries

### Fetch All Lots
```typescript
const { data: allLots } = useCollection(
  collection(firestore, 'lots')
);
```

### Filter Lots by Product
```typescript
const productLots = allLots?.filter(
  (lot: any) => lot.productNumber === item.productNumber
);
```

### Create New Lot
```typescript
await addDoc(collection(firestore, 'lots'), {
  productNumber: "070074118659",
  lotName: "LOT-001",
  expiryDate: "12/31/2025",
  quantity: 100,
  initialQuantity: 100,
  createdAt: new Date().toISOString(),
  status: 'active',
});
```

---

## Testing Instructions

### Test 1: Add Product and Create First Lot
1. Create a product with "Manage by lot, expiry date" = **Yes**
2. Go to Purchase page
3. Search for that product
4. Verify: "No existing lots" message appears
5. Click "Add new lot, expiry date"
6. Enter: Lot name "LOT-001", Expiry "12/31/2025", Quantity "100"
7. Click "Add"
8. Verify: Orange badge shows "LOT-001 - 12/31/2025 - On hand: 100"
9. Check Firestore: New document should exist in `lots` collection

### Test 2: Select Existing Lot
1. Go to Purchase page
2. Search for product that has lots (from Test 1)
3. Verify: Dropdown appears with "Select lot"
4. Click dropdown
5. Verify: See "LOT-001 - 12/31/2025 - On hand: 100"
6. Select it
7. Verify: Orange badge appears with lot details

### Test 3: Add Multiple Lots for Same Product
1. Go to Purchase page
2. Add same product from Test 1
3. Click "Add new lot, expiry date"
4. Enter: Lot name "LOT-002", Expiry "01/15/2026", Quantity "50"
5. Click "Add"
6. Verify: Badge shows LOT-002
7. Add product again
8. Verify: Dropdown now shows both LOT-001 and LOT-002

### Test 4: Product Without Lot Management
1. Create product with "Manage by lot" = **No**
2. Go to Purchase page
3. Add that product
4. Verify: No lot section appears
5. Only quantity input is shown

---

## Benefits

### Before (Hardcoded)
- ❌ Always showed "Lot 1" example
- ❌ No real database integration
- ❌ Couldn't track actual inventory lots
- ❌ Couldn't reuse lots across purchases

### After (Database-Driven)
- ✅ Shows only real lots from database
- ✅ Lots are saved to Firestore
- ✅ Can select from existing lots
- ✅ Real-time updates when lots are added
- ✅ Each product can have multiple lots
- ✅ Tracks quantity per lot
- ✅ Ready for FIFO inventory tracking

---

## Future Enhancements

### Phase 1 (Current) ✅
- Create lots when receiving stock
- Select from existing lots
- Display lot details in purchase order

### Phase 2 (Next)
- Auto-update lot quantities when purchase is completed
- Decrement lot quantity when selling (FIFO)
- Mark lots as "depleted" when quantity reaches 0

### Phase 3
- Expiry date warnings (30 days before)
- Automatic status change to "expired"
- Dashboard widget showing expiring lots
- Suggested markdowns for near-expiry products

### Phase 4
- Lot history tracking
- Transfer quantities between lots
- Merge/split lots
- Generate lot reports

---

## Files Modified

### Modified
- ✅ `src/app/(app)/purchase/page.tsx` - Replaced hardcoded lot with database integration
- ✅ `firestore.rules` - Added `lots` collection rules

### Database
- ✅ New collection: `lots`
- ✅ Security rules deployed

---

## Summary

The "Lot 1" you were seeing was a **hardcoded example** for demo purposes. I've replaced it with a **real database-driven system** that:

1. **Fetches lots from Firestore** in real-time
2. **Shows dropdown** only if lots exist for the product
3. **Saves new lots** to the database when created
4. **Filters lots** by product number
5. **Displays "No existing lots"** message when there are no lots yet

Now when you click "Select lot", you'll only see lots that actually exist in your database for that specific product! 🎉
