# Email/Password Authentication Setup ✅

Your ConvenientStore app now uses **email/password authentication** instead of anonymous login.

## What Changed:

1. ✅ Login page created at `/login`
2. ✅ AuthGuard added - redirects to login if not authenticated
3. ✅ Logout button added to user menu (top right)
4. ✅ Anonymous auth disabled
5. ✅ `saleTransactions` rule added to Firestore
6. ✅ Missing Firestore rules fixed

---

## Next Steps:

### Step 1: Create Your Account (FIRST TIME ONLY)

1. **Stop the dev server** if it's running (Ctrl+C in terminal)
2. **Start the dev server:**
   ```powershell
   npm run dev
   ```

3. **Open your browser:** http://localhost:9002

4. **You'll see the login page**. Click "Don't have an account? Sign up"

5. **Create your account with:**
   - Email: `Caotri999@yahoo.com`
   - Password: `@Abcde12345`

6. **After signup, check the browser console (F12 → Console tab)**
   - You'll see a message like:
   ```
   ============================================================
   YOUR USER ID (copy this for firestore rules):
   abc123def456ghi789jkl...
   ============================================================
   ```

7. **Copy that User ID!**

---

### Step 2: Update Firestore Rules

1. **Open `firestore.rules` file**

2. **Find line 219** (or search for `"YOUR_OWNER_USER_ID"`)

3. **Replace `"YOUR_OWNER_USER_ID"`** with your actual User ID:
   ```javascript
   function isOwner() {
     return request.auth.uid == "abc123def456ghi789jkl..."; // Your actual UID
   }
   ```

4. **Save the file**

---

### Step 3: Deploy Firestore Rules

Run this command in terminal:

```powershell
firebase deploy --only firestore:rules
```

If you get an error about Firebase CLI not found:
```powershell
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

---

### Step 4: Test Everything

1. **Reload the app** - you should be logged in
2. **Try accessing different pages** - everything should work
3. **Click your avatar** (top right) → **Log out**
4. **Login again** with your email/password

---

## Your Login Credentials:

- **Email:** `Caotri999@yahoo.com`
- **Password:** `@Abcde12345`

**IMPORTANT:** Keep these credentials safe! Anyone with these can access your store data.

---

## How to Change Password (Later):

1. Go to Firebase Console: https://console.firebase.google.com/project/studio-5302783866-e8cbe/authentication/users
2. Click on your user
3. Click "Reset password"
4. Or add a "Change Password" feature in Settings page

---

## Troubleshooting:

### "Permission Denied" errors:
- Make sure you deployed firestore rules with your actual User ID
- Check that you're logged in (not on /login page)

### Can't login:
- Make sure email/password are correct
- Check browser console (F12) for errors

### Still seeing anonymous users in Firebase Console:
- Those are old sessions, you can delete them
- Your new email account will be the active one

---

## Summary:

✅ **More secure** - requires password to access
✅ **Easy to remember** - use your email to login  
✅ **Multi-device** - login from any computer
✅ **Professional** - better for business use
✅ **Customer privacy protected** - only you can see customer data

Done! Your app is now secure with email/password authentication! 🎉
