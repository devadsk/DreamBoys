# Quick Start Guide for DreamBoys E-Commerce

## ⚠️ PowerShell Execution Policy Issue

If you're seeing an error about scripts being disabled, you need to enable script execution in PowerShell.

### Option 1: Run Commands Manually (Recommended)

Open PowerShell or Command Prompt in the project directory and run:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Option 2: Enable PowerShell Scripts (One-time setup)

1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Type 'Y' and press Enter
4. Close and reopen PowerShell
5. Navigate to the project folder
6. Run: `.\setup.ps1`

## 🚀 Quick Start Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Go to https://console.firebase.google.com/
2. Create a new project
3. Enable Authentication (Email/Password and Google)
4. Enable Firestore Database
5. Copy your Firebase config
6. Update `src/firebase/config.js` with your credentials

### 3. Run the Application

```bash
npm run dev
```

The app will open at http://localhost:3000

### 4. Create an Admin User

1. Register a new account through the website
2. Go to Firebase Console > Firestore Database
3. Find your user in the `users` collection
4. Change `role` from `"customer"` to `"admin"`
5. Refresh the website to see the Admin menu

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎯 Test the Application

### As a Customer:
1. Browse products on the home page
2. Click "Shop" to see all products
3. Filter by category
4. Click on a product to see details
5. Add items to cart
6. Go through checkout process
7. View orders in "My Orders"

### As an Admin:
1. Change your user role to "admin" in Firestore
2. Access the Admin Dashboard from the header
3. View statistics and manage the store

## 🔧 Troubleshooting

### npm command not found
- Install Node.js from https://nodejs.org/

### Firebase errors
- Make sure you've configured Firebase in `src/firebase/config.js`
- Check that Authentication and Firestore are enabled in Firebase Console

### Port 3000 already in use
- The dev server will automatically try port 3001, 3002, etc.
- Or stop the process using port 3000

## 📞 Need Help?

Check the full README.md for detailed documentation.

---

**Happy Coding! 🎉**
