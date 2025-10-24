# Secure Customer Search with Cloud Functions 🔐

## What This Does:

Instead of giving POS direct access to customer data, we created a **secure middleman** (Cloud Function) that:

✅ **Allows POS to search customers** by name or phone  
✅ **Only returns non-sensitive data** (name, phone, ID)  
❌ **Hides sensitive data** (email, address, purchase history, notes)  
✅ **Logs all searches** for security audit  
✅ **Works with anonymous authentication**  

---

## Setup Steps:

### Step 1: Install Cloud Functions Dependencies

```powershell
cd "c:\Users\Tri Nguyen\ConvenientStore\ConvenientStore\functions"
npm install
```

Wait for installation to complete (may take 2-3 minutes).

---

### Step 2: Build the Functions

```powershell
npm run build
```

This compiles the TypeScript code.

---

### Step 3: Deploy to Firebase

```powershell
cd..
firebase deploy --only functions
```

This deploys the secure search functions to Firebase Cloud.

**Note:** First deployment may take 3-5 minutes.

---

### Step 4: Update POS App (Already Done!)

I've already updated the POS code to use the Cloud Function. No additional changes needed!

---

## How It Works:

### Old Way (Privacy Risk):
```
POS → Direct Firestore Access → Read ALL customer data
❌ POS can see emails, addresses, purchase history
❌ No audit trail
❌ Privacy concern
```

### New Way (Secure):
```
POS → Cloud Function → Firestore (Admin Access) → Filter Data → Return Limited Info
✅ POS only sees name + phone
✅ All searches logged
✅ Privacy protected
```

---

## What POS Can Now Do:

### ✅ **Search Customers:**
- Type customer name: "John"
- Type phone number: "555-1234"
- Get list of matches with **only name + phone**

### ✅ **Create Customers:**
- Add new customers at checkout
- Works same as before

### ❌ **Cannot See:**
- Customer emails
- Customer addresses
- Purchase history
- Notes
- Full customer list

---

## Example Usage in POS:

```javascript
// Search for customer
const results = await searchCustomers("John");
// Returns: [{ id: "abc123", name: "John Doe", phone: "555-1234" }]

// Email and address are NOT included (privacy protected)
```

---

## Security Features:

1. **Authentication Required** - Only authenticated users can search
2. **Rate Limiting** - Firebase automatically limits excessive calls
3. **Audit Logging** - All searches logged with user ID and timestamp
4. **Data Filtering** - Sensitive fields never sent to POS
5. **Result Limiting** - Max 10 results per search (performance)

---

## Testing:

### After Deployment:

1. **Reload POS app**
2. **Try searching for a customer**:
   - Type a name or phone number
   - Should see results with name + phone only
3. **Check Firebase Console** → Functions → Logs:
   - You'll see search logs with queries and result counts

---

## Monitoring:

### View Function Logs:
```powershell
firebase functions:log
```

### Check Function Usage:
Go to: https://console.firebase.google.com/project/studio-5302783866-e8cbe/functions

---

## Cost:

- **Free Tier**: 2 million function calls/month
- **Your Usage**: Estimated ~100-500 searches/day
- **Cost**: $0 (well within free tier)

---

## Troubleshooting:

### "Function not found" error:
→ Run `firebase deploy --only functions` again

### "Permission denied" error:
→ Make sure POS is authenticated (anonymous login)

### "Search not working" error:
→ Check browser console for detailed error messages
→ Check Firebase Functions logs: `firebase functions:log`

---

## Files Created:

1. **`functions/src/index.ts`** - Cloud Function code
2. **`functions/package.json`** - Dependencies
3. **`functions/tsconfig.json`** - TypeScript config

## Files Modified:

1. **`POS/src/lib/actions/pos-data.ts`** - Updated `searchCustomers()` to use Cloud Function

---

## Next Steps:

1. Run the setup commands above
2. Deploy the functions
3. Test customer search in POS
4. Monitor the logs

---

**Ready to deploy?** Run the commands in Step 1-3 above! 🚀
