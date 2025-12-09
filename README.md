# DreamBoys E-Commerce Platform

A modern, full-featured e-commerce website for men's fashion built with React, Firebase, and Node.js.

## 🚀 Features

### Customer Features
- ✅ **Authentication**: Email/Password and Google Sign-in with Firebase
- ✅ **Product Browsing**: Browse products by category with filtering
- ✅ **Product Details**: View detailed product information
- ✅ **Shopping Cart**: Add items to cart and manage quantities
- ✅ **Checkout**: Complete purchase with shipping and payment information
- ✅ **Order History**: View past orders and track deliveries
- ✅ **User Profile**: Manage account information

### Admin Features
- ✅ **Admin Dashboard**: Overview of store statistics
- ✅ **Product Management**: Add, edit, and delete products
- ✅ **Order Management**: View and update order statuses
- ✅ **User Management**: Manage user roles and permissions

### Technical Features
- ⚡ **React** with Vite for fast development
- 🔥 **Firebase** for authentication and database
- 🎨 **Modern UI/UX** with premium design and animations
- 📱 **Fully Responsive** design for all devices
- 🔒 **Protected Routes** for authenticated users
- 👑 **Admin-only Routes** for administrative functions

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- A Firebase account

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable the following services:
   - **Authentication** (Email/Password and Google)
   - **Firestore Database**
   - **Storage** (for product images)

4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll to "Your apps" and click the web icon (</>)
   - Copy the configuration object

5. Update `src/firebase/config.js` with your Firebase credentials:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Firestore Database Structure

Create the following collections in Firestore:

#### Users Collection (`users`)
```javascript
{
  uid: "user_id",
  email: "user@example.com",
  displayName: "User Name",
  role: "customer" | "admin",
  createdAt: "2024-12-02T00:00:00.000Z",
  cart: [],
  wishlist: [],
  addresses: []
}
```

#### Products Collection (`products`)
```javascript
{
  name: "Product Name",
  price: 49.99,
  description: "Product description",
  category: "shirts" | "tshirts" | "jeans" | "jackets",
  sizes: ["S", "M", "L", "XL"],
  image: "image_url",
  stock: 100,
  createdAt: "2024-12-02T00:00:00.000Z"
}
```

#### Orders Collection (`orders`)
```javascript
{
  userId: "user_id",
  items: [...],
  total: 159.97,
  status: "pending" | "processing" | "shipped" | "delivered",
  shippingAddress: {...},
  createdAt: "2024-12-02T00:00:00.000Z"
}
```

### 4. Create an Admin User

To access the admin panel, you need to manually set a user's role to "admin" in Firestore:

1. Register a new account through the website
2. Go to Firestore Database in Firebase Console
3. Find your user document in the `users` collection
4. Change the `role` field from `"customer"` to `"admin"`

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
DreamBoys/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── PrivateRoute.jsx
│   │   └── AdminRoute.jsx
│   ├── context/         # React context providers
│   │   └── AuthContext.jsx
│   ├── firebase/        # Firebase configuration and services
│   │   ├── config.js
│   │   └── firebaseService.js
│   ├── pages/           # Page components
│   │   ├── Home.jsx
│   │   ├── Products.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── Orders.jsx
│   │   ├── Profile.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── admin/       # Admin pages
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminProducts.jsx
│   │       ├── AdminOrders.jsx
│   │       └── AdminUsers.jsx
│   ├── App.jsx          # Main app component with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## 🎨 Design System

The application uses a comprehensive design system with:
- **Color Palette**: Dark theme with gold accents
- **Typography**: Inter (body) and Playfair Display (headings)
- **Components**: Buttons, cards, forms, badges
- **Animations**: Smooth transitions and micro-interactions

## 🔐 Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null;
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🚧 Future Enhancements

- [ ] Payment Integration (Stripe/Razorpay)
- [ ] Delivery Tracking Integration
- [ ] Product Reviews and Ratings
- [ ] Wishlist Functionality
- [ ] Email Notifications
- [ ] Advanced Search and Filters
- [ ] Product Recommendations
- [ ] Multi-currency Support
- [ ] Inventory Management
- [ ] Analytics Dashboard

## 📝 Notes

- This is the initial version with core functionality
- Payment integration is placeholder (needs Stripe/Razorpay setup)
- Delivery tracking is placeholder (needs shipping API integration)
- Some admin features need full implementation
- Mock data is used for demonstration purposes

## 🤝 Contributing

This is a private project for DreamBoys store. For any updates or modifications, contact the development team.

## 📄 License

Proprietary - All rights reserved by DreamBoys

---

**Built with ❤️ for DreamBoys**
