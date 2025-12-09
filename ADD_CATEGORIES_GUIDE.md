# 🎯 Quick Guide: Add Categories to Firebase

## Super Easy Method - Use the HTML Tool

I've created a simple tool for you! Just follow these steps:

### Step 1: Open the Tool
1. Open `add-categories.html` in your browser
2. You can double-click it or drag it into your browser

### Step 2: Get Your Firebase Config
1. Open `src/firebase/config.js` in your code editor
2. Copy the entire `firebaseConfig` object (everything between the `{` and `}`)
3. It should look like this:
```javascript
{
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123..."
}
```

### Step 3: Add Categories
1. Paste your Firebase config into the text area in the HTML tool
2. Click "🚀 Add Categories to Firebase"
3. Wait for success message!

### Step 4: Manage in Admin Panel
Once categories are added:
1. Go to `http://localhost:3001/admin/content`
2. Click "Categories" tab
3. You'll see 6 categories (3 visible, 3 hidden by default)
4. Click "Edit" to upload custom images
5. Click "Show/Hide" to control which appear on home page
6. Home page will show up to 6 visible categories

## What Categories Will Be Added?

✅ **Visible by default (will show on home page):**
1. 👔 Premium Shirts
2. 👕 Designer T-Shirts  
3. 👖 Luxury Jeans

❌ **Hidden by default (won't show until you toggle them):**
4. 🧥 Exclusive Jackets
5. 👟 Casual Wear
6. 🎩 Formal Wear

## After Adding Categories

You can:
- ✅ Upload custom images to replace emojis
- ✅ Toggle visibility (show/hide on home page)
- ✅ Edit category names, links, and colors
- ✅ Choose any 3-6 categories to display on home page

**Note:** You cannot add NEW categories from the admin panel (by design). You can only edit these 6 existing ones.

---

## Troubleshooting

**If you get an error:**
1. Make sure you've updated Firebase security rules (see `FIX_FIREBASE_PERMISSIONS.md`)
2. Make sure your user has `role: "admin"` in Firebase
3. Check that you pasted the correct Firebase config

**Need to add more categories?**
- Open `add-categories.html` in a code editor
- Find the `categories` array
- Add more category objects
- Save and run again

---

**That's it! Super simple!** 🎉
