# Customer Data Collection System

## Overview
The DreamBoys e-commerce application now collects comprehensive customer information during sign-up and allows customers to manage their profile data.

## Data Collected During Registration

### Required Fields
- **Full Name** - Customer's complete name
- **Email Address** - Primary contact and login credential
- **Password** - Account security (minimum 6 characters)

### Optional Fields
- **Phone Number** - Contact number with validation
- **Date of Birth** - For age verification and personalized offers
- **Street Address** - Complete street address including apartment/unit
- **City** - City of residence
- **State/Province** - State or province
- **Postal Code** - ZIP or postal code
- **Country** - Country of residence

## Database Structure

### User Document in Firestore
```javascript
{
  uid: string,                    // Firebase user ID
  email: string,                  // Email address
  displayName: string,            // Full name
  phone: string,                  // Phone number
  dateOfBirth: string,            // Date of birth (YYYY-MM-DD)
  address: {
    street: string,               // Street address
    city: string,                 // City
    state: string,                // State/Province
    postalCode: string,           // Postal/ZIP code
    country: string               // Country
  },
  role: string,                   // 'customer' or 'admin'
  photoURL: string,               // Profile picture (Google sign-in)
  createdAt: string,              // Account creation timestamp
  updatedAt: string,              // Last update timestamp
  cart: array,                    // Shopping cart items
  wishlist: array,                // Wishlist items
  addresses: array                // Multiple shipping addresses
}
```

## Features

### 1. Enhanced Registration Form
**File:** `src/pages/Register.jsx`

- Multi-step form with all customer fields
- Phone number validation
- Password confirmation
- Responsive two-column layout for better UX
- Clear required vs optional field indicators

### 2. Google Sign-In Integration
**File:** `src/firebase/firebaseService.js`

- Automatically creates user profile with data structure
- Extracts available information from Google account
- Allows users to complete profile later

### 3. Profile Management
**File:** `src/pages/Profile.jsx`

Features:
- View all customer information
- Edit mode to update details
- Real-time validation
- Success/error messaging
- Automatic data refresh after updates

### 4. Data Security
- All customer data stored in Firebase Firestore
- Secure authentication via Firebase Auth
- Password encryption handled by Firebase
- Role-based access control

## User Flow

### New Customer Registration
1. User navigates to `/register`
2. Fills in required fields (name, email, password)
3. Optionally provides phone, DOB, and address
4. Submits form
5. Account created with all provided data
6. Redirected to home page

### Google Sign-In
1. User clicks "Continue with Google"
2. Authenticates with Google
3. Profile created with Google data
4. Can complete additional fields in Profile page

### Profile Updates
1. User navigates to `/profile`
2. Views current information
3. Clicks "Edit Profile"
4. Updates desired fields
5. Saves changes
6. Data updated in Firestore

## Admin Access to Customer Data

Administrators can access all customer data through:
- Firebase Console → Firestore Database → `users` collection
- Future admin dashboard features (to be implemented)

## Data Usage

Customer data is used for:
- **Order Processing** - Shipping and billing
- **Communication** - Order updates and support
- **Personalization** - Tailored shopping experience
- **Analytics** - Business insights (anonymized)
- **Marketing** - Promotional offers (with consent)

## Privacy & Compliance

### Best Practices Implemented
✅ Collect only necessary data
✅ Secure storage in Firebase
✅ User control over their data
✅ Clear indication of required vs optional fields
✅ Data validation and sanitization

### Recommended Next Steps
- [ ] Add privacy policy page
- [ ] Implement GDPR compliance features
- [ ] Add data export functionality
- [ ] Implement account deletion
- [ ] Add email verification
- [ ] Implement two-factor authentication

## Files Modified/Created

### Modified Files
1. `src/pages/Register.jsx` - Enhanced registration form
2. `src/pages/Profile.jsx` - Complete profile management
3. `src/firebase/firebaseService.js` - Updated auth functions
4. `src/pages/Auth.css` - Added form-row styling
5. `src/pages/Profile.css` - Enhanced profile styling

### Key Functions

#### `registerWithEmail(email, password, displayName, additionalData)`
Creates new user account with comprehensive data.

**Parameters:**
- `email` - User's email address
- `password` - Account password
- `displayName` - Full name
- `additionalData` - Object containing phone, dateOfBirth, and address

#### `updateUserData(uid, data)`
Updates existing user profile information.

**Parameters:**
- `uid` - User ID
- `data` - Object with fields to update

## Testing the System

### Test New Registration
1. Navigate to http://localhost:3000/register
2. Fill in all fields
3. Submit form
4. Check Firebase Console to verify data saved

### Test Profile Update
1. Sign in to account
2. Navigate to Profile page
3. Click "Edit Profile"
4. Modify information
5. Save changes
6. Verify updates in Firebase Console

### Test Google Sign-In
1. Click "Continue with Google"
2. Authenticate
3. Navigate to Profile
4. Complete additional information
5. Save and verify

## Support

For issues or questions:
- Check Firebase Console for data verification
- Review browser console for errors
- Ensure Firebase configuration is correct
- Verify Firestore security rules allow read/write

## Future Enhancements

### Planned Features
- Multiple shipping addresses
- Address autocomplete
- Phone number formatting
- Email verification
- Profile picture upload
- Account activity log
- Data export (JSON/CSV)
- Account deletion with confirmation

### Advanced Features
- Social media integration
- Loyalty program integration
- Referral tracking
- Purchase history analysis
- Personalized recommendations
- Newsletter subscription management
