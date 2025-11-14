# Name-Pattern Variant System

## Overview
The cleanest and most practical variant system implementation using name-based grouping. No template products, no complex database relationships - just intelligent naming and UI grouping.

## How It Works

### 1. Adding Attributes (First Variant)
When you click "Add Attribute" on a product:
- **Before**: `HAT DUA` (stock: 50, price: $10)
- **After**: `HAT DUA - vang` (stock: 50, price: $10)

**What happens:**
- Product is renamed to include the attribute value
- ALL existing data is preserved (stock, price, barcode, category, etc.)
- An `attributes` array is added to store the attribute
- Product remains fully sellable with its original inventory

### 2. Adding More Variants
When you click "Add Variant" on `HAT DUA - vang`:
- System extracts base name: `HAT DUA`
- Creates new product: `HAT DUA - trang`
- New variant has its own stock, price, barcode

**Example Flow:**
```
Original: "HAT DUA" (stock: 50, price: $10)
    ↓ Add Attribute (color: vang)
Variant 1: "HAT DUA - vang" (stock: 50, price: $10)
    ↓ Add Variant (color: trang)
Variant 2: "HAT DUA - trang" (stock: 0, price: $12)
```

### 3. UI Grouping
The products page automatically detects products with the same base name:
- Extracts text before last " - " as the base name
- Groups products with matching base names
- Shows first product as parent with rest as children
- Expandable/collapsible groups (▶/▼)

**Visual Display:**
```
▶ (2) HAT DUA - vang
    ↓ Click to expand
▼ (2) HAT DUA - vang
    ├─ HAT DUA - vang (stock: 50, $10)
    └─ HAT DUA - trang (stock: 20, $12)
```

## Database Structure

### Product Document
```json
{
  "name": "HAT DUA - vang",
  "barcode": "12345",
  "attributes": [
    {
      "attributeName": "color",
      "attributeValue": "vang"
    }
  ],
  "costPrice": 8,
  "sellingPrice": 10,
  "onHand": 50,
  "isActive": true,
  "category": "Seeds",
  "brand": "ABC"
}
```

**Key Points:**
- ✅ All products are fully sellable (no `isSellable: false`)
- ✅ Each variant has its own stock and pricing
- ✅ No template products in database
- ✅ No `parentProductId` relationships
- ✅ No `isParentProduct` flags
- ✅ Just simple, clean product data

## Advantages

### 1. **Simpler Database**
- No template/parent products cluttering the database
- Every product in DB is a real, sellable item
- Cleaner data model, easier to maintain

### 2. **No Data Loss**
- Original product keeps all its data when adding attributes
- Stock, price, and settings are preserved
- No need to re-enter information

### 3. **Flexible**
- Products can have 1 or many variants
- Single products work exactly as before
- Variants can be added anytime

### 4. **POS-Friendly**
- All products automatically visible in POS
- No filtering needed (`isSellable` checks)
- Each variant sellable with its own barcode

### 5. **User-Friendly**
- Natural workflow: rename → add more
- Visual grouping makes sense
- KiotViet-style collapsible interface

## Implementation Files

### 1. `add-attribute-to-product-dialog.tsx`
**Purpose**: Add attributes to products (creates first variant)

**Logic**:
```typescript
// Rename product with first attribute value
const newName = `${product.name} - ${firstAttribute.value}`;

await updateDoc(productRef, {
  name: newName,
  attributes: attributePairs,
  // Keeps all existing data: stock, price, barcode, etc.
});
```

### 2. `add-variant-product-dialog.tsx`
**Purpose**: Create additional variants

**Logic**:
```typescript
// Extract base name from existing variant
const baseName = name.substring(0, name.lastIndexOf(' - '));

// Create new variant with base name + new attribute
const variantName = `${baseName} - ${newAttributeValue}`;

const variantData = {
  name: variantName,
  barcode: barcode,
  attributes: attributesArray,
  costPrice: parseFloat(costPrice),
  sellingPrice: parseFloat(sellingPrice),
  onHand: parseInt(onHand),
  isActive: true,
  // No parentProductId, isSellable, or isParentProduct
};
```

### 3. `products/page.tsx`
**Purpose**: Display products with intelligent grouping

**Logic**:
```typescript
const organizedProducts = () => {
  // Extract base name (text before last " - ")
  const getBaseName = (name: string) => {
    const lastDashIndex = name.lastIndexOf(' - ');
    return lastDashIndex > 0 ? name.substring(0, lastDashIndex) : name;
  };

  // Group products by base name
  const groupsMap = new Map();
  products.forEach(product => {
    const baseName = getBaseName(product.name);
    if (!groupsMap.has(baseName)) {
      groupsMap.set(baseName, []);
    }
    groupsMap.get(baseName).push(product);
  });

  // Show first product as parent with rest as children
  return organized;
};
```

## Migration from Old System

If you have products with `parentProductId` or `isSellable: false`:

1. **Template Products**: These should be deleted or converted to real variants
2. **Variant Products**: Remove `parentProductId`, keep as-is
3. **Ensure Naming**: Variants should follow "BASE - attribute" pattern

## Naming Convention

**Rules:**
- Base name + " - " + attribute value
- Last dash is the separator
- Examples:
  - ✅ `HAT DUA - vang`
  - ✅ `COCA COLA - 330ml`
  - ✅ `T-SHIRT - red` (note: internal dashes OK)
  - ✅ `PHONE CASE - iPhone 13 - blue` (last dash is separator)

**Handling Complex Names:**
```javascript
// "T-SHIRT - RED - SIZE M" 
// Base name: "T-SHIRT - RED"
// Attribute: "SIZE M"
// System uses lastIndexOf(' - ') to find separator
```

## Testing Checklist

- [ ] Create product "TEST ITEM"
- [ ] Add attribute (color: red) → Becomes "TEST ITEM - red"
- [ ] Verify stock and price preserved
- [ ] Add variant (color: blue) → Creates "TEST ITEM - blue"
- [ ] Check products page shows group with 2 items
- [ ] Expand group, verify both variants visible
- [ ] Check POS, verify both variants appear
- [ ] Test selling both variants in POS

## Troubleshooting

### Q: Products not grouping together?
**A**: Check naming - must have " - " separator. Use lastIndexOf to find it.

### Q: Can I have variants without attributes?
**A**: Yes, any products sharing base name will group. But it's recommended to use the attribute system for clarity.

### Q: What if I want different barcodes?
**A**: Each variant can have its own barcode. Set it when creating the variant.

### Q: Can I delete the first variant?
**A**: Yes, the next product in the group becomes the parent. Or if it's the last one, the group disappears.

### Q: How do I convert back to simple product?
**A**: Just rename it to remove the " - attribute" part. It will show as a single product.

## Summary

This is the **cleanest variant system** possible:
- ✅ No templates in database
- ✅ Virtual grouping based on name patterns
- ✅ All products fully sellable
- ✅ No data loss when adding variants
- ✅ Flexible and user-friendly
- ✅ Easy to understand and maintain

The system is production-ready and follows best practices for simplicity and maintainability.
