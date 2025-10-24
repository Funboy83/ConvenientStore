# Categories and Brands Separation

## Overview
Previously, categories and brands were stored as attributes in the `productAttributes` collection. This has been refactored to use separate dedicated collections, matching the KiotViet settings structure.

## Changes Made

### 1. New Components Created

#### `src/components/add-category-dialog.tsx`
- Modal dialog for creating new product categories
- Fields:
  - **Name** (required): Category name (e.g., "Beverages", "Snacks")
  - **Description** (optional): Description of the category
- Saves to `categories` collection in Firestore

#### `src/components/add-brand-dialog.tsx`
- Modal dialog for creating new brands
- Fields:
  - **Name** (required): Brand name (e.g., "Coca-Cola", "Pepsi")
  - **Description** (optional): Brand description
- Saves to `brands` collection in Firestore

### 2. Settings Page Updates (`src/app/(app)/settings/page.tsx`)

Added two new tabs to match KiotViet structure:

```
Tabs:
├── Units of measure     (existing)
├── Attributes          (existing - for position, etc.)
├── Product categories  (NEW)
└── Brands             (NEW)
```

**Product Categories Tab:**
- Lists all categories from `categories` collection
- Shows: Category Name | Description
- "Add Category" button opens AddCategoryDialog

**Brands Tab:**
- Lists all brands from `brands` collection
- Shows: Brand Name | Description
- "Add Brand" button opens AddBrandDialog

### 3. Product Dialog Updates (`src/components/add-product-dialog.tsx`)

**Before:**
- Categories fetched from `productAttributes/category`
- Brands fetched from `productAttributes/brand`
- "Add" buttons opened AttributeDialog (WRONG)

**After:**
- Categories fetched from `categories` collection
- Brands fetched from `brands` collection
- Category "Add" button opens CategoryDialog (CORRECT)
- Brand "Add" button opens BrandDialog (CORRECT)

**Data Fetching:**
```typescript
// OLD (removed)
const { data: categoryData } = useDoc(doc(firestore, 'productAttributes', 'category'));
const { data: brandData } = useDoc(doc(firestore, 'productAttributes', 'brand'));

// NEW
const { data: categories } = useCollection(collection(firestore, 'categories'));
const { data: brands } = useCollection(collection(firestore, 'brands'));
```

**Display in Dropdowns:**
```typescript
// Categories
{categories && categories.length > 0 ? (
  categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)
) : (
  <div>No categories. Add in Settings.</div>
)}

// Brands
{brands && brands.length > 0 ? (
  brands.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)
) : (
  <div>No brands. Add in Settings.</div>
)}
```

### 4. Firestore Rules Updates (`firestore.rules`)

Added security rules for the new collections:

```plaintext
match /categories/{categoryId} {
  allow get: if true;
  allow list: if true;
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  allow delete: if request.auth != null;
}

match /brands/{brandId} {
  allow get: if true;
  allow list: if true;
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  allow delete: if request.auth != null;
}
```

**Deployed:** ✅ Rules deployed successfully to Firebase

## Database Schema

### `categories` Collection
```typescript
{
  id: string,              // Auto-generated document ID
  name: string,            // Category name (e.g., "Beverages")
  description?: string,    // Optional description
  createdAt: string        // ISO timestamp
}
```

### `brands` Collection
```typescript
{
  id: string,              // Auto-generated document ID
  name: string,            // Brand name (e.g., "Coca-Cola")
  description?: string,    // Optional description
  createdAt: string        // ISO timestamp
}
```

## User Flow

### Adding a Category While Creating a Product

1. User clicks "Add Product"
2. In Category field, clicks "Add" button
3. **AddCategoryDialog** opens (inline modal)
4. User enters:
   - Name: "Beverages"
   - Description: "All drink products"
5. Clicks "Add Category"
6. Category saved to Firestore `categories` collection
7. Modal closes
8. Category dropdown automatically refreshes (Firestore real-time listener)
9. User can now select "Beverages" from dropdown

### Adding a Brand While Creating a Product

1. User clicks "Add Product"
2. In Brand field, clicks "Add" button
3. **AddBrandDialog** opens (inline modal)
4. User enters:
   - Name: "Coca-Cola"
   - Description: "Leading beverage manufacturer"
5. Clicks "Add Brand"
6. Brand saved to Firestore `brands` collection
7. Modal closes
8. Brand dropdown automatically refreshes
9. User can now select "Coca-Cola" from dropdown

### Managing Categories/Brands in Settings

1. Go to Settings page
2. Click "Product categories" tab
3. See all existing categories in table
4. Click "Add Category" to create new ones
5. Same for "Brands" tab

## Benefits of This Architecture

1. **Proper Separation of Concerns**
   - Categories and brands are not attributes - they're entity types
   - Attributes (like "color", "size") remain separate

2. **Better Data Management**
   - Each category/brand is a document with its own metadata
   - Can add more fields later (icon, color, parent category, etc.)
   - Easier to query and filter

3. **Matches Industry Standards**
   - KiotViet uses this same structure
   - Standard e-commerce practice

4. **Scalability**
   - Can add category hierarchies (parent/child)
   - Can add brand logos, websites, etc.
   - Can track which products belong to each category/brand

## Migration Notes

If you have existing products using the old attribute-based system:

1. Old data in `productAttributes/category` and `productAttributes/brand` still exists
2. New products will use the new `categories` and `brands` collections
3. To migrate:
   - Export existing category/brand values from productAttributes
   - Create corresponding documents in new collections
   - Update existing products to reference new structure (optional)

## Future Enhancements

Possible additions to categories/brands:

- **Categories:**
  - Parent category (for hierarchies)
  - Icon/image
  - Display order
  - Active/inactive status

- **Brands:**
  - Logo image
  - Website URL
  - Country of origin
  - Active/inactive status
