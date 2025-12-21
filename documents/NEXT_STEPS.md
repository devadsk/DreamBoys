# Quick Setup - Next Steps

## ✅ What's Done
- Firebase initialized
- Cloud Functions code restored (with v2 API)
- Razorpay dependency added

## 🚀 What You Need To Do Now

### Step 1: Install Dependencies
```bash
cd functions
npm install
cd ..
```

### Step 2: Create .env file for Razorpay credentials
```bash
cd functions
copy .env.example .env
```

Then edit `functions/.env` and replace `YOUR_KEY_SECRET_HERE` with your actual Razorpay Key Secret.

**Get your Key Secret from**: https://dashboard.razorpay.com/app/keys

### Step 3: Deploy Functions
```bash
firebase deploy --only functions
```

### Step 4: Test
Run your app and try placing an order!

```bash
npm run dev
```

---

## ⚠️ Important Notes

1. **Firebase Blaze Plan Required**
   - Go to Firebase Console
   - Upgrade to Blaze (pay-as-you-go) plan
   - Don't worry - free tier is very generous (2M invocations/month)

2. **Environment Variables**
   - The `.env` file is for local testing
   - For production, Firebase will use the deployed environment
   - The functions will automatically use the env variables

3. **If Deploy Fails**
   - Make sure you're on Blaze plan
   - Make sure you ran `npm install` in the functions folder
   - Check that `.env` file has your actual key secret

---

## 🎉 After Deployment

Your payment flow will work like this:

1. User selects payment method (e.g., GPay)
2. Frontend calls Cloud Function to create Razorpay order
3. Cloud Function returns order_id
4. Razorpay opens with method-specific routing
5. User completes payment
6. Payment verified via Cloud Function
7. Order saved to Firestore

**True method-specific routing achieved!** 🚀
