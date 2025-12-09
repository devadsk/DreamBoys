# Firestore Security Rules for DreamBoys E-Commerce

## 🔒 Required Security Rules

To enable the review system and all other features, you need to update your Firestore Security Rules in the Firebase Console.

### How to Update Security Rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the rules below
5. Click **Publish**

---

## 📋 Complete Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // ===== USERS COLLECTION =====
    match /users/{userId} {
      // Anyone can read user profiles (for displaying names, etc.)
      allow read: if true;
      
      // Users can create their own profile during registration
      allow create: if isSignedIn() && request.auth.uid == userId;
      
      // Users can update their own profile
      allow update: if isOwner(userId);
      
      // Only admins can delete users
      allow delete: if isAdmin();
    }
    
    // ===== PRODUCTS COLLECTION =====
    match /products/{productId} {
      // Anyone can read products (public catalog)
      allow read: if true;
      
      // Only admins can create, update, or delete products
      allow create, update, delete: if isAdmin();
    }
    
    // ===== REVIEWS COLLECTION =====
    match /reviews/{reviewId} {
      // Anyone can read reviews (public)
      allow read: if true;
      
      // Authenticated users can create reviews
      allow create: if isSignedIn() && 
                      request.resource.data.userId == request.auth.uid;
      
      // Users can update their own reviews
      allow update: if isSignedIn() && 
                      resource.data.userId == request.auth.uid;
      
      // Users can delete their own reviews, admins can delete any
      allow delete: if isSignedIn() && 
                      (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // ===== ORDERS COLLECTION =====
    match /orders/{orderId} {
      // Users can read their own orders, admins can read all
      allow read: if isSignedIn() && 
                    (resource.data.userId == request.auth.uid || isAdmin());
      
      // Authenticated users can create orders
      allow create: if isSignedIn() && 
                      request.resource.data.userId == request.auth.uid;
      
      // Only admins can update orders (for status changes)
      allow update: if isAdmin();
      
      // Only admins can delete orders
      allow delete: if isAdmin();
    }
    
    // ===== CATEGORIES COLLECTION =====
    match /categories/{categoryId} {
      // Anyone can read categories
      allow read: if true;
      
      // Only admins can manage categories
      allow create, update, delete: if isAdmin();
    }
    
    // ===== TESTIMONIALS COLLECTION =====
    match /testimonials/{testimonialId} {
      // Anyone can read testimonials
      allow read: if true;
      
      // Only admins can manage testimonials
      allow create, update, delete: if isAdmin();
    }
    
    // ===== CART ITEMS (if stored separately) =====
    match /carts/{userId}/items/{itemId} {
      // Users can only access their own cart
      allow read, write: if isOwner(userId);
    }
    
    // ===== WISHLIST ITEMS (if stored separately) =====
    match /wishlists/{userId}/items/{itemId} {
      // Users can only access their own wishlist
      allow read, write: if isOwner(userId);
    }
  }
}
```

---

## 🎯 What These Rules Allow:

### Public Access (No Login Required):
- ✅ Read all products
- ✅ Read all reviews
- ✅ Read all categories
- ✅ Read all testimonials
- ✅ Read user profiles (names for reviews, etc.)

### Authenticated Users Can:
- ✅ Create their own user profile
- ✅ Update their own profile
- ✅ **Write reviews for products**
- ✅ Update their own reviews
- ✅ Delete their own reviews
- ✅ Create orders
- ✅ Read their own orders
- ✅ Manage their own cart
- ✅ Manage their own wishlist

### Admin Users Can:
- ✅ All of the above, plus:
- ✅ Create, update, delete products
- ✅ Update order status
- ✅ Delete any orders
- ✅ Manage categories
- ✅ Manage testimonials
- ✅ Delete any user
- ✅ Delete any review

---

## 🔧 How to Make a User an Admin:

Since the rules check for `role == 'admin'`, you need to manually set a user's role in Firestore:

1. Go to **Firestore Database** in Firebase Console
2. Navigate to the `users` collection
3. Find your user document (by UID)
4. Edit the document
5. Set the `role` field to `"admin"`
6. Save

---

## ⚠️ Important Notes:

1. **These rules are for development/production** - They provide good security while allowing necessary operations

2. **Review Permissions** - The key rule for reviews is:
   ```javascript
   allow create: if isSignedIn() && 
                   request.resource.data.userId == request.auth.uid;
   ```
   This ensures:
   - User must be logged in
   - User can only create reviews with their own userId

3. **Testing** - After updating rules:
   - Wait a few seconds for rules to propagate
   - Try submitting a review again
   - Check browser console for any errors

4. **Debugging** - If you still get permission errors:
   - Check if `currentUser` is not null
   - Verify the user is actually logged in
   - Check browser console for the exact error
   - Use Firebase Console → Firestore → Rules → Simulator to test

---

## 🧪 Testing the Rules:

You can test these rules in the Firebase Console:

1. Go to **Firestore Database** → **Rules**
2. Click on **Rules Playground** (simulator)
3. Test different scenarios:
   - **Location**: `reviews/testReview123`
   - **Operation**: `create`
   - **Authenticated**: Yes
   - **Auth UID**: (your test user ID)

---

## 📝 Example Review Document Structure:

When a review is created, it should have this structure:

```json
{
  "productId": "product123",
  "userId": "user123",
  "userName": "John Doe",
  "rating": 5,
  "comment": "Great product!",
  "verified": false,
  "createdAt": "2024-12-05T13:11:52.000Z",
  "helpful": 0
}
```

The security rules will check that `userId` matches the authenticated user's UID.

---

## 🚀 Quick Fix Steps:

1. **Copy the security rules above**
2. **Go to Firebase Console** → Your Project → Firestore Database → Rules
3. **Paste the rules**
4. **Click "Publish"**
5. **Wait 10-30 seconds** for rules to propagate
6. **Try submitting a review again**

---

## ✅ Verification:

After updating the rules, you should be able to:
- ✅ Submit reviews when logged in
- ✅ See your reviews appear immediately
- ✅ See the product rating update automatically
- ❌ Get an error if trying to submit without logging in

---

**Last Updated**: December 5, 2024
**Status**: Ready for Production
