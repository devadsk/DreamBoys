# 🔧 QUICK FIX: Profile Update Permission Error

## The Problem
❌ Error: "insufficient or missing permission" when updating profile

## The Solution
✅ Update Firestore Security Rules in Firebase Console

---

## 3 SIMPLE STEPS:

### Step 1: Open Firebase Console
🌐 Go to: https://console.firebase.google.com/
- Select your project
- Click **Firestore Database** (left sidebar)
- Click **Rules** tab (top)

### Step 2: Copy the Rules
📋 Open the file: `firestore.rules` in your project folder
- Select all the code (Ctrl+A)
- Copy it (Ctrl+C)

### Step 3: Paste & Publish
✅ In Firebase Console:
- Paste the rules into the editor
- Click **Publish** button
- Wait for confirmation

---

## Test It!
1. Go to your Profile page
2. Click "Edit Profile"
3. Update any information
4. Click "Save Changes"
5. ✅ Should work now!

---

## What Changed?
The new rules allow:
- ✅ Users can update their own profile
- ✅ Users can read their own data
- ✅ Users CANNOT change their role
- ✅ Users CANNOT access other users' data
- ✅ Admins have full access

---

## Still Having Issues?

### Check These:
1. ✅ Rules are published (check timestamp in Firebase Console)
2. ✅ You're signed in to the app
3. ✅ Clear browser cache (Ctrl+Shift+R)
4. ✅ Check browser console for errors (F12)

### Need More Help?
📖 Read the full guide: `FIRESTORE_SECURITY_RULES.md`

---

**That's it! Your profile updates should work now! 🎉**
