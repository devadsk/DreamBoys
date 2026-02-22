# How to Initialize Categories in Firebase

Since you need existing categories to edit, here's how to add them to your Firebase database:

## Option 1: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Click **Start Collection**
5. Collection ID: `categories`
6. Add these documents:

### Category 1 - Premium Shirts
```
name: "Premium Shirts"
image: "👔"
link: "/products?category=shirts"
color: "#667eea"
visible: true
createdAt: (current timestamp)
```

### Category 2 - Designer T-Shirts
```
name: "Designer T-Shirts"
image: "👕"
link: "/products?category=tshirts"
color: "#764ba2"
visible: true
createdAt: (current timestamp)
```

### Category 3 - Luxury Jeans
```
name: "Luxury Jeans"
image: "👖"
link: "/products?category=jeans"
color: "#d4af37"
visible: true
createdAt: (current timestamp)
```

### Category 4 - Exclusive Jackets
```
name: "Exclusive Jackets"
image: "🧥"
link: "/products?category=jackets"
color: "#b76e79"
visible: true
createdAt: (current timestamp)
```

### Category 5 - Casual Wear
```
name: "Casual Wear"
image: "👟"
link: "/products?category=casual"
color: "#10b981"
visible: false
createdAt: (current timestamp)
```

### Category 6 - Formal Wear
```
name: "Formal Wear"
image: "🎩"
link: "/products?category=formal"
color: "#8b5cf6"
visible: false
createdAt: (current timestamp)
```

## Option 2: Browser Console Script

1. Open your app at `http://localhost:3001`
2. Log in as admin
3. Open browser console (F12)
4. Paste and run this script:

```javascript
// Import Firebase functions (they should already be available in your app)
const { collection, addDoc, getFirestore } = window;

const categories = [
    { name: "Premium Shirts", image: "👔", link: "/products?category=shirts", color: "#667eea", visible: true },
    { name: "Designer T-Shirts", image: "👕", link: "/products?category=tshirts", color: "#764ba2", visible: true },
    { name: "Luxury Jeans", image: "👖", link: "/products?category=jeans", color: "#d4af37", visible: true },
    { name: "Exclusive Jackets", image: "🧥", link: "/products?category=jackets", color: "#b76e79", visible: true },
    { name: "Casual Wear", image: "👟", link: "/products?category=casual", color: "#10b981", visible: false },
    { name: "Formal Wear", image: "🎩", link: "/products?category=formal", color: "#8b5cf6", visible: false }
];

// Note: This requires Firebase to be initialized in your app
// Run this from your app's console after logging in
```

## After Adding Categories

Once categories are in the database:
1. Go to `/admin/content`
2. Click "Categories" tab
3. You'll see all 6 categories
4. Click "Edit" to upload images or change details
5. Click "Show/Hide" to control visibility on home page
6. Only visible categories (max 6) will appear on the home page

## For Testimonials

Testimonials work differently - you can add them directly from the admin panel:
1. Go to `/admin/content`
2. Stay on "Testimonials" tab
3. Click "Add Testimonial"
4. Fill in the form
5. Click "Add Testimonial"
6. It will be saved to Firebase and appear on the home page immediately

The testimonials should work perfectly now with the error handling I added!
