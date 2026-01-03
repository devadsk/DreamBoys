# 📍 ADD PICKUP LOCATIONS IN SHIPROCKET

## 🎯 PROBLEM IDENTIFIED

Your Shiprocket account only has **"Home"** as a pickup location, but your admin panel has:
- Outpost Branch
- Chavadi Branch
- Pasumalai Branch
- Home
- Default

When you select "Outpost Branch", "Chavadi Branch", or "Pasumalai Branch", Shiprocket rejects it with:
```
"Wrong Pickup location entered. Please choose one location from the data given"
```

---

## ✅ SOLUTION: Add Pickup Locations in Shiprocket

### Step 1: Login to Shiprocket Dashboard

1. Go to: https://app.shiprocket.in/login
2. Login with your credentials

### Step 2: Navigate to Pickup Locations

1. Click on **"Settings"** in the left sidebar
2. Click on **"Pickup Locations"** or **"Warehouse"**
3. You should see your current location: **"Home"**

### Step 3: Add New Pickup Locations

For each location (Outpost Branch, Chavadi Branch, Pasumalai Branch), do the following:

#### Click "Add New Pickup Location" or "Add Warehouse"

#### Fill in the details:

**For Outpost Branch:**
- **Pickup Location Name:** `Outpost Branch` (EXACT name - case sensitive!)
- **Contact Person:** Your name
- **Phone:** Your phone number
- **Email:** Your email
- **Complete Address:** Full address of Outpost Branch
- **City:** City name
- **State:** Tamil Nadu (or your state)
- **PIN Code:** PIN code
- **Country:** India

**For Chavadi Branch:**
- **Pickup Location Name:** `Chavadi Branch` (EXACT name!)
- Fill in all other details for this location

**For Pasumalai Branch:**
- **Pickup Location Name:** `Pasumalai Branch` (EXACT name!)
- Fill in all other details for this location

#### Click "Save" or "Add"

---

## ⚠️ IMPORTANT NOTES

### 1. **Name Must Match EXACTLY**
The pickup location name in Shiprocket must match EXACTLY what's in your dropdown:
- ✅ `Outpost Branch` (correct)
- ❌ `outpost branch` (wrong - lowercase)
- ❌ `Outpost  Branch` (wrong - extra space)
- ❌ `Outpost Branch ` (wrong - trailing space)

### 2. **Verify After Adding**
After adding each location:
1. Go back to Pickup Locations list
2. Verify the name is exactly: `Outpost Branch`, `Chavadi Branch`, `Pasumalai Branch`
3. If not exact, edit and fix the name

### 3. **Phone Number Format**
- Must be 10 digits
- No country code (+91)
- No spaces or dashes
- Example: `8825824170` ✅
- Not: `+91 8825824170` ❌

---

## 🧪 TESTING AFTER ADDING LOCATIONS

### Step 1: Verify Locations Are Added
1. In Shiprocket dashboard, go to Pickup Locations
2. You should now see:
   - Home
   - Outpost Branch
   - Chavadi Branch
   - Pasumalai Branch

### Step 2: Test Shipment Creation
1. Go to your Admin Orders page
2. Select an order (status: 'confirmed')
3. Click "Initiate Shipment"
4. Select **"Outpost Branch"** from dropdown
5. Click "Confirm & Ship"

### Step 3: Check Firebase Logs
Go to Firebase Console logs and you should see:
```
✅ Sending request to Shiprocket API
✅ Shiprocket raw response: {
     "shipment_id": 123456,
     "order_id": 789012,
     "status": "success"
   }
✅ Shipment ID found, assigning AWB
✅ AWB assigned successfully: ABC123456
✅ Shipment successfully created
```

### Step 4: Verify in Shiprocket
1. Go to Shiprocket dashboard
2. Click "Orders"
3. You should see your order listed with:
   - Order ID: Your order number
   - Pickup Location: Outpost Branch (or whichever you selected)
   - Status: Pending pickup or similar

---

## 🎉 EXPECTED RESULT

After adding the pickup locations:
- ✅ You can select any branch from the dropdown
- ✅ Shiprocket will accept the order
- ✅ Shipment will be created successfully
- ✅ AWB will be assigned
- ✅ Order will appear in Shiprocket dashboard

---

## 📋 CHECKLIST

- [ ] Login to Shiprocket dashboard
- [ ] Navigate to Pickup Locations / Warehouse
- [ ] Add "Outpost Branch" with exact name
- [ ] Add "Chavadi Branch" with exact name
- [ ] Add "Pasumalai Branch" with exact name
- [ ] Verify all names match exactly
- [ ] Test shipment creation from Admin Orders
- [ ] Check Firebase logs for success
- [ ] Verify order appears in Shiprocket

---

## 🆘 IF YOU NEED HELP

If you have trouble adding the locations:
1. Take a screenshot of the Shiprocket "Add Pickup Location" form
2. Send it to me
3. I'll guide you through filling it out

---

## 🚀 ONCE DONE

After you've added all the pickup locations in Shiprocket:
1. Try initiating a shipment
2. Send me the Firebase logs
3. We should see success! 🎉

**Let me know when you've added the locations and I'll help you test!**
