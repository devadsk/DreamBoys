# Admin Content Management - Feature Documentation

## Overview
The admin can now manage testimonials and product categories directly from the admin panel, including uploading custom images.

## Features Added

### 1. **Content Management Page** (`/admin/content`)
A new admin page accessible from the Admin Dashboard that allows managing:
- **Testimonials**: Customer reviews displayed on the home page
- **Product Categories**: Featured categories shown on the home page

### 2. **Testimonials Management**
Admins can:
- ✅ Add new testimonials
- ✅ Edit existing testimonials
- ✅ Delete testimonials
- ✅ Set customer name, role, review text, and rating (1-5 stars)

### 3. **Categories Management**
Admins can:
- ✅ Add new product categories
- ✅ Edit existing categories
- ✅ Delete categories
- ✅ Upload custom images OR use emojis
- ✅ Set category name, link, and color theme
- ✅ Preview categories before saving

### 4. **Image Upload Support**
- Upload custom images for categories (stored as base64 in Firebase)
- Alternative: Use emoji icons (👔, 👕, 👖, 🧥, etc.)
- Image preview before submission
- Supports both uploaded images and emoji display on the home page

## How to Use

### Accessing Content Management
1. Log in as an admin
2. Go to Admin Dashboard
3. Click "Manage Content" in the Quick Actions section
4. Or navigate directly to `/admin/content`

### Adding a Testimonial
1. Click the "Testimonials" tab
2. Click "Add Testimonial" button
3. Fill in:
   - Customer Name
   - Role/Title (e.g., "Fashion Enthusiast")
   - Testimonial Text
   - Rating (1-5 stars)
4. Click "Add Testimonial"

### Adding a Category
1. Click the "Categories" tab
2. Click "Add Category" button
3. Fill in:
   - Category Name (e.g., "Premium Shirts")
   - Category Link (e.g., "/products?category=shirts")
   - Color (use color picker or enter hex code)
   - Image: Either upload an image OR enter an emoji
4. Click "Add Category"

### Editing Content
- Click the "Edit" button on any testimonial or category card
- Modify the fields
- Click "Update"

### Deleting Content
- Click the "Delete" button on any testimonial or category card
- Confirm the deletion

## Technical Details

### Firebase Collections
- **testimonials**: Stores all testimonials
  - Fields: `name`, `role`, `text`, `rating`, `createdAt`
- **categories**: Stores all product categories
  - Fields: `name`, `link`, `color`, `image`, `createdAt`

### Dynamic Loading
- The home page automatically loads testimonials and categories from Firebase
- Falls back to default content if no data exists in the database
- Real-time updates when content is added/edited/deleted

### Image Storage
- Images are converted to base64 and stored directly in Firestore
- For production, consider using Firebase Storage for better performance
- Current implementation supports images up to ~1MB

## Files Modified/Created

### New Files:
- `src/pages/admin/AdminContent.jsx` - Main content management component
- `src/pages/admin/AdminContent.css` - Styling for content management

### Modified Files:
- `src/firebase/firebaseService.js` - Added CRUD functions for testimonials and categories
- `src/pages/Home.jsx` - Updated to load dynamic content from Firebase
- `src/App.jsx` - Added route for `/admin/content`
- `src/pages/admin/AdminDashboard.jsx` - Added "Manage Content" quick action

## Future Enhancements
- [ ] Use Firebase Storage for image uploads (better for large images)
- [ ] Add image compression before upload
- [ ] Add drag-and-drop for category ordering
- [ ] Add bulk import/export functionality
- [ ] Add rich text editor for testimonial text
- [ ] Add image cropping tool

## Security Notes
- Only users with `role: "admin"` can access `/admin/content`
- Update Firestore security rules to restrict write access to testimonials and categories collections to admin users only

### Recommended Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Testimonials - Admin only write, public read
    match /testimonials/{testimonialId} {
      allow read: if true;
      allow write: if request.auth != null && 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Categories - Admin only write, public read
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null && 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Support
For issues or questions, please refer to the main project documentation or contact the development team.
