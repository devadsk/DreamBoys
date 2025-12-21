# Quick Setup Commands

## Run these commands in order:

### 1. Install Firebase CLI (if needed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Install Functions Dependencies
```bash
cd functions
npm install
cd ..
```

### 4. Set Razorpay Credentials
```bash
firebase functions:config:set razorpay.key_id="rzp_test_RtXru6hrKoNN6y"
firebase functions:config:set razorpay.key_secret="YOUR_RAZORPAY_KEY_SECRET"
```

**⚠️ Replace `YOUR_RAZORPAY_KEY_SECRET` with your actual secret from Razorpay dashboard**

### 5. Deploy Functions
```bash
firebase deploy --only functions
```

### 6. View Logs (optional)
```bash
firebase functions:log
```

---

## That's it! 🎉

Your Cloud Functions are now deployed and ready to use.

The frontend is already configured to use them automatically.
