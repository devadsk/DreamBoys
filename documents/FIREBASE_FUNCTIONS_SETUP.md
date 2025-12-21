
# Firebase Cloud Functions Setup Guide

## 🎯 What We've Created

Firebase Cloud Functions for Razorpay integration with **method-specific routing**. This allows users to be directed to their selected payment method (GPay → GPay, NetBanking → NetBanking, etc.)

## 📁 Files Created

1. **`firebase.json`** - Firebase configuration
2. **`functions/package.json`** - Cloud Functions dependencies
3. **`functions/index.js`** - Cloud Functions code
4. **`functions/.gitignore`** - Git ignore for functions
5. **`src/utils/razorpayFunctions.js`** - Frontend helper functions
6. **Updated: `src/pages/Checkout.jsx`** - Uses Cloud Functions

## 🚀 Setup Steps

### Step 1: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase Project (if not done)

```bash
firebase init
```

Select:
- ✅ Functions
- ✅ Hosting (if you want)
- Choose your existing Firebase project

### Step 4: Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

### Step 5: Set Razorpay Credentials

You need to set your Razorpay API credentials in Firebase Functions config:

```bash
firebase functions:config:set razorpay.key_id="rzp_test_RtXru6hrKoNN6y"
firebase functions:config:set razorpay.key_secret="YOUR_RAZORPAY_KEY_SECRET"
```

**⚠️ IMPORTANT**: Replace `YOUR_RAZORPAY_KEY_SECRET` with your actual Razorpay key secret from the Razorpay dashboard.

### Step 6: Upgrade to Firebase Blaze Plan

Cloud Functions require the **Blaze (Pay as you go)** plan:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Upgrade" in the left sidebar
4. Choose "Blaze Plan"

**Don't worry**: 
- Free tier includes 2 million function invocations/month
- You'll only pay if you exceed free limits
- For a small e-commerce site, you'll likely stay within free tier

### Step 7: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This will deploy two functions:
- `createRazorpayOrder` - Creates Razorpay orders
- `verifyRazorpayPayment` - Verifies payment signatures

### Step 8: Update Frontend Razorpay Key

In `src/pages/Checkout.jsx`, line ~270, replace the test key:

```javascript
key: "rzp_test_RtlhgJ14PsoRoN"  // Replace with your actual key
```

### Step 9: Test the Integration

1. Run your React app: `npm run dev`
2. Go to checkout
3. Select a payment method (e.g., GPay)
4. Click "Place Order"
5. Razorpay should open with method-specific routing

## 🔍 How It Works

### Flow Diagram

```
User selects payment method (GPay)
        ↓
Clicks "Place Order"
        ↓
Frontend calls Cloud Function: createRazorpayOrder()
        ↓
Cloud Function creates Razorpay order with method restriction
        ↓
Returns order_id to frontend
        ↓
Frontend opens Razorpay with order_id
        ↓
Razorpay shows ONLY GPay (method-specific)
        ↓
User completes payment
        ↓
Frontend verifies payment via Cloud Function
        ↓
Order saved to Firestore
        ↓
Success!
```

## 🛠️ Troubleshooting

### Error: "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### Error: "Functions require Blaze plan"
Upgrade to Blaze plan in Firebase Console (still has generous free tier)

### Error: "Razorpay key_secret not found"
Set the config:
```bash
firebase functions:config:set razorpay.key_secret="YOUR_SECRET"
```

### Error: "Function not found"
Make sure you deployed:
```bash
firebase deploy --only functions
```

### Error: "CORS error"
Cloud Functions are automatically configured for CORS with Firebase Auth

## 📊 Monitoring

### View Function Logs

```bash
firebase functions:log
```

### View in Firebase Console

1. Go to Firebase Console
2. Select "Functions" from left menu
3. See invocations, errors, and performance

## 💰 Cost Estimate

**Free Tier (Blaze Plan)**:
- 2,000,000 invocations/month
- 400,000 GB-seconds/month
- 200,000 CPU-seconds/month

**Typical E-commerce Site**:
- ~2 function calls per order (create + verify)
- 1000 orders/month = 2000 invocations
- **Well within free tier!**

## 🔐 Security

### Best Practices

1. **Never expose Razorpay key_secret** in frontend
   - ✅ Stored in Cloud Functions config
   - ✅ Only accessible server-side

2. **Always verify payment signatures**
   - ✅ Done in Cloud Function
   - ✅ Prevents payment tampering

3. **Use Firebase Auth**
   - ✅ Functions check authentication
   - ✅ Only authenticated users can create orders

## 🎉 Benefits

### What You Get

✅ **True method-specific routing**
- GPay → Opens only GPay
- NetBanking → Opens only NetBanking
- Card → Opens only card form

✅ **Better security**
- API secrets on server
- Payment verification server-side

✅ **No separate backend**
- Serverless architecture
- Auto-scaling
- Integrated with Firebase

✅ **Cost-effective**
- Generous free tier
- Pay only for what you use

## 📝 Next Steps

After deployment:

1. **Test all payment methods**
   - GPay
   - PhonePe
   - Paytm
   - Cards
   - NetBanking

2. **Monitor function logs**
   - Check for errors
   - Monitor performance

3. **Update to production keys**
   - Replace test keys with live keys
   - Update both frontend and Cloud Functions config

4. **Set up alerts**
   - Firebase Console → Functions → Set up alerts
   - Get notified of errors

## 🆘 Support

### Firebase Documentation
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [Callable Functions](https://firebase.google.com/docs/functions/callable)

### Razorpay Documentation
- [Server Integration](https://razorpay.com/docs/payments/server-integration/)
- [Payment Methods](https://razorpay.com/docs/payments/payment-methods/)

## ✅ Checklist

Before going live:

- [ ] Firebase CLI installed
- [ ] Logged into Firebase
- [ ] Functions dependencies installed
- [ ] Razorpay credentials set in config
- [ ] Upgraded to Blaze plan
- [ ] Functions deployed successfully
- [ ] Frontend Razorpay key updated
- [ ] Tested all payment methods
- [ ] Verified payment verification works
- [ ] Checked function logs for errors
- [ ] Updated to production keys

---

**You're all set!** 🚀 Your payment integration now has true method-specific routing via Firebase Cloud Functions!
