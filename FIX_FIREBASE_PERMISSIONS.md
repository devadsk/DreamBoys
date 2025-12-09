# 🔒 Fix Firebase Permissions Error

## The Problem
You're getting "Missing or insufficient permissions" because Firebase Firestore security rules don't allow writing to the `testimonials` and `categories` collections yet.

## ✅ Solution: Update Firestore Security Rules

I've already updated the `firestore.rules` file in your project. Now you need to deploy these rules to Firebase.

### **Option 1: Deploy via Firebase Console (Easiest)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **DreamBoys** project
3. Click **Firestore Database** in the left menu
4. Click the **Rules** tab at the top
5. **Copy and paste** the entire content below:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user is the owner
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection rules
    match /users/{userId} {
      // Allow users to read their own data
      allow read: if isOwner(userId);
      
      // Allow users to create their own profile during registration
      allow create: if isSignedIn() && request.auth.uid == userId;
      
      // Allow users to update their own data (except role field)
      allow update: if isOwner(userId) && 
                       (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'uid']));
      
      // Allow admins to read all users
      allow read: if isAdmin();
      
      // Allow admins to update any user
      allow update: if isAdmin();
    }
    
    // Products collection rules
    match /products/{productId} {
      // Anyone can read products
      allow read: if true;
      
      // Only admins can create, update, or delete products
      allow create, update, delete: if isAdmin();
    }
    
    // Orders collection rules
    match /orders/{orderId} {
      // Users can read their own orders
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      
      // Users can create orders with their own userId
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      
      // Admins can read and update all orders
      allow read, update: if isAdmin();
    }
    
    // Testimonials collection rules
    match /testimonials/{testimonialId} {
      // Anyone can read testimonials (for display on home page)
      allow read: if true;
      
      // Only admins can create, update, or delete testimonials
      allow create, update, delete: if isAdmin();
    }
    
    // Categories collection rules
    match /categories/{categoryId} {
      // Anyone can read categories (for display on home page)
      allow read: if true;
      
      // Only admins can create, update, or delete categories
      allow create, update, delete: if isAdmin();
    }
  }
}
```

6. Click **Publish** button
7. Wait for confirmation message

### **Option 2: Deploy via Firebase CLI**

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:rules
```

## ⚠️ Important: Make Sure You're an Admin

The rules require your user to have `role: "admin"` in the database.

### Check Your Role:
1. Go to Firebase Console → Firestore Database
2. Open the `users` collection
3. Find your user document (by your email/UID)
4. Check if `role` field = `"admin"`
5. If not, click Edit and change it to `"admin"`

## 🧪 Test After Deploying Rules

1. Refresh your app at `http://localhost:3001`
2. Go to `/admin/content`
3. Try adding a testimonial again
4. You should see "Testimonial added successfully!" ✅

## What These Rules Do:

- ✅ **Testimonials**: Public read, admin-only write
- ✅ **Categories**: Public read, admin-only write
- ✅ **Products**: Public read, admin-only write
- ✅ **Orders**: Users can see their own, admins can see all
- ✅ **Users**: Users can update their own profile (except role)

---

**After deploying the rules, testimonials and categories will work perfectly!** 🎉
