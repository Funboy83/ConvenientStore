# Daily Operations Guide - Two-Collection Security Model

## 📋 Quick Reference for Daily Tasks

---

## For Store Owner/Admin

### Morning Routine

#### 1. Check Pending Transactions
```
URL: http://localhost:9002/pending-transactions
```

**What to look for**:
- Number of pending transactions from previous day
- Total sales amount
- Any unusual transactions (very high or very low amounts)

**Action**: Review each transaction before finalizing

#### 2. Review Transaction Details
- Click on each transaction to expand details
- Verify:
  - ✅ Items sold make sense
  - ✅ Quantities are reasonable
  - ✅ Payment method matches cash register
  - ✅ Employee ID is correct
  - ✅ Total amount is accurate

#### 3. Finalize Approved Transactions

**Option A: Finalize All** (if everything looks good)
```
1. Click "Finalize All" button
2. Confirm in popup
3. ✅ All transactions moved to final_invoices
```

**Option B: Finalize One-by-One** (if need to review individually)
```
1. Review transaction details
2. Click "Finalize" button on individual transaction
3. Repeat for each transaction
```

### End of Day Routine

#### 1. Final Check
```
URL: http://localhost:9002/pending-transactions
```
- Ensure all transactions are finalized
- Should see: "No pending transactions. All caught up! 🎉"

#### 2. View Daily Summary
```
URL: http://localhost:9002/final-invoices
```
- See total revenue for the day
- Count of transactions finalized
- Total items sold

---

## For Employees (POS)

### Daily Operations

#### Making a Sale
```
1. Scan/add products to cart
2. Add customer (optional)
3. Select payment method
4. Complete sale
5. ✅ Transaction automatically saved to pending
```

**Important Notes**:
- You cannot view previous sales (security feature)
- You cannot modify sales after completion (audit trail)
- Admin will review and approve all sales
- Focus on accurate data entry!

---

## Common Scenarios

### Scenario 1: Employee Made a Mistake

**Problem**: Employee entered wrong quantity or product

**Solution**:
```
1. Employee: Cannot fix themselves (security feature)
2. Employee: Notify admin immediately
3. Admin: Go to /pending-transactions
4. Admin: Review the incorrect transaction
5. Admin: DO NOT finalize incorrect transaction
6. Admin: Contact employee to make correcting transaction
7. Admin: Finalize both transactions with notes
```

**Future Enhancement**: Add rejection workflow

### Scenario 2: High-Value Transaction

**Problem**: Transaction seems unusually high

**Solution**:
```
1. Admin: Review transaction in /pending-transactions
2. Admin: Check items and quantities
3. Admin: Verify with employee who made the sale
4. Admin: Check security camera if available
5. Admin: Finalize if legitimate
6. Admin: Investigate if suspicious
```

### Scenario 3: Missing Transaction

**Problem**: Employee says they made a sale but it's not showing

**Solution**:
```
1. Admin: Check /pending-transactions
2. Admin: Refresh the page
3. If still missing:
   - Check employee's POS app is online
   - Check Firebase Console > Firestore > pending_transactions
   - Check browser console for errors on POS
   - Verify employee authentication
4. If found: Finalize normally
5. If not found: Check logs and investigate
```

### Scenario 4: Power Outage During Sale

**Problem**: Power went out while processing sale

**Solution**:
```
1. POS: Transaction may or may not have saved
2. Employee: Check if sale completed (invoice ID shown)
3. Admin: Check /pending-transactions for transaction
4. If found: Finalize normally
5. If not found: Re-enter transaction manually in POS
```

---

## Weekly Tasks

### Monday Morning
- [ ] Review all final invoices from previous week
- [ ] Export to accounting software (if applicable)
- [ ] Check for any unusual patterns
- [ ] Calculate weekly revenue

### Friday Afternoon
- [ ] Ensure all pending transactions are finalized
- [ ] Review employee performance (transaction counts)
- [ ] Plan for weekend staffing based on data

---

## Monthly Tasks

### First Day of Month
- [ ] Generate monthly revenue report from final_invoices
- [ ] Review employee transaction statistics
- [ ] Archive old invoices if needed
- [ ] Check system performance

### Last Day of Month
- [ ] Finalize all pending transactions
- [ ] Reconcile with bank statements
- [ ] Generate tax reports
- [ ] Backup data

---

## Troubleshooting

### "Permission Denied" Error

**Symptoms**: Cannot access pending transactions or final invoices

**Solution**:
```
1. Go to /roles page
2. Click "Check My Role"
3. If role is not "admin":
   - Copy your User ID
   - Paste in "Set User Role" section
   - Select "Admin"
   - Click "Set Role"
4. Refresh page
5. Try again
```

### POS Cannot Create Transactions

**Symptoms**: POS shows error when completing sale

**Solution**:
```
1. Check POS is online (internet connection)
2. Check Firebase status (status.firebase.google.com)
3. Check browser console for errors
4. Try refreshing POS app
5. Check Firestore rules are deployed correctly
6. Verify anonymous authentication is enabled
```

### Cloud Functions Not Working

**Symptoms**: Customer search not working in POS

**Solution**:
```
1. Go to Firebase Console
2. Navigate to Functions section
3. Check deployment status
4. Check function logs for errors
5. Redeploy if needed: firebase deploy --only functions
```

### Cannot Finalize Transactions

**Symptoms**: "Finalize" button doesn't work

**Solution**:
```
1. Check browser console for errors
2. Verify you have admin role (/roles page)
3. Check internet connection
4. Refresh page and try again
5. Check Firebase Console > Firestore for rules errors
```

---

## Best Practices

### For Accuracy
✅ Review all transactions before finalizing
✅ Verify high-value transactions
✅ Check transaction details match cash register
✅ Reconcile daily with physical cash/receipts

### For Security
✅ Only give admin access to trusted personnel
✅ Never share owner login credentials
✅ Review employee transaction patterns regularly
✅ Investigate any suspicious activity immediately

### For Efficiency
✅ Finalize transactions daily (don't let them pile up)
✅ Use "Finalize All" when confident
✅ Keep POS app open during business hours
✅ Train employees on accurate data entry

### For Audit Trail
✅ Never delete finalized invoices
✅ Keep detailed notes on unusual transactions
✅ Archive old data regularly
✅ Backup Firebase data monthly

---

## Quick Links

### ConvenientStore App (Admin)
- Dashboard: http://localhost:9002/dashboard
- Pending Transactions: http://localhost:9002/pending-transactions
- Final Invoices: http://localhost:9002/final-invoices
- Role Management: http://localhost:9002/roles
- Products: http://localhost:9002/products
- Customers: http://localhost:9002/customers

### POS App (Employee)
- POS System: http://192.168.1.216:3000

### Firebase Console
- Project Overview: https://console.firebase.google.com/project/studio-5302783866-e8cbe
- Firestore Database: https://console.firebase.google.com/project/studio-5302783866-e8cbe/firestore
- Authentication: https://console.firebase.google.com/project/studio-5302783866-e8cbe/authentication
- Functions: https://console.firebase.google.com/project/studio-5302783866-e8cbe/functions

---

## Emergency Contacts

### Technical Issues
- Firebase Support: https://firebase.google.com/support
- Check Firebase Status: https://status.firebase.google.com

### Business Continuity
1. **If admin cannot access system**:
   - Use Firebase Console directly
   - Access Firestore data manually
   - Export data from Firebase Console

2. **If POS is down**:
   - Use manual receipts
   - Record sales on paper
   - Enter into system when POS is back up

3. **If internet is down**:
   - POS will not work (requires internet)
   - Use manual process
   - Resume digital operations when online

---

## Performance Metrics

### Daily KPIs to Track
- Number of transactions finalized
- Total revenue
- Average transaction value
- Number of items sold
- Employee transaction count

### Weekly KPIs
- Week-over-week revenue growth
- Most popular products
- Peak sales times
- Employee performance comparison

### Monthly KPIs
- Monthly revenue
- Transaction count
- Customer growth (new vs returning)
- Inventory turnover

---

## Training Checklist

### For New Admins
- [ ] Understand two-collection security model
- [ ] Set up admin role
- [ ] Practice reviewing pending transactions
- [ ] Practice finalizing transactions
- [ ] Learn to use search in final invoices
- [ ] Understand troubleshooting steps
- [ ] Know when to escalate issues

### For New Employees (POS)
- [ ] Learn POS basics (add products, checkout)
- [ ] Understand they cannot view transaction history
- [ ] Know to notify admin of mistakes immediately
- [ ] Practice accurate data entry
- [ ] Understand importance of audit trail
- [ ] Know basic troubleshooting (refresh if error)

---

## Audit Trail Documentation

### What Gets Recorded
For each transaction:
- ✅ Employee ID (who made the sale)
- ✅ Employee type (anonymous vs authenticated)
- ✅ Timestamp of sale (createdAt)
- ✅ Timestamp of finalization (finalizedAt)
- ✅ All items sold with quantities and prices
- ✅ Payment method
- ✅ Customer ID (if applicable)
- ✅ Original transaction ID
- ✅ Source (POS)

### How to Use Audit Trail
```
1. Go to /final-invoices
2. Search for specific transaction
3. Click to expand details
4. Review:
   - Original Transaction ID
   - Transaction Created timestamp
   - Finalized timestamp
   - Employee who made sale
   - All items and prices
```

### Audit Trail Benefits
- 🔒 Proves when sale was made
- 🔒 Proves who made the sale
- 🔒 Proves when admin approved it
- 🔒 Cannot be tampered with after finalization
- 🔒 Complete history for accounting/legal purposes

---

## Summary

**Remember the Three Golden Rules**:

1. **Employees Write, Admin Reads** - Employees create sales, admin reviews them
2. **Review Daily** - Don't let pending transactions pile up
3. **Audit Trail is Sacred** - Never delete or tamper with finalized invoices

**Benefits You Get**:
- 🛡️ Protection against employee fraud
- 📊 Complete transaction history
- ✅ Easy daily review process
- 🔍 Searchable invoice archive
- 📈 Business insights from data

---

*Last Updated: October 21, 2025*
*For Questions: Check troubleshooting section or consult technical documentation*
