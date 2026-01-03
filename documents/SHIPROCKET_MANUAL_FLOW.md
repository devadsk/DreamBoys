# Shiprocket Integration - Manual Control Flow

## Summary of Changes

The Shiprocket integration has been updated to ensure **manual control** over order shipment creation. Orders are now **ONLY** sent to Shiprocket when an admin explicitly clicks the "Initiate Shipment" button and selects the proper pickup location.

---

## How It Works Now

### 1. **Order Placement**
- Customer places an order (COD or Prepaid)
- Order is created in Firestore with status:
  - `'placed'` for COD orders
  - `'confirmed'` for verified prepaid orders
- **NO automatic Shiprocket order creation happens**

### 2. **Admin Workflow**

#### Step 1: Confirm Order (if needed)
- Admin views order in Admin Orders page
- If order status is `'pending'` or `'placed'`, admin clicks **"Confirm Order"**
- Order status changes to `'confirmed'`
- **Still NO Shiprocket order created**

#### Step 2: Mark as Packed (optional)
- Admin can click **"Mark Packed"** to change status to `'packed'`
- This is optional - admin can skip directly to shipment initiation
- **Still NO Shiprocket order created**

#### Step 3: Initiate Shipment (REQUIRED)
- Admin clicks **"Initiate Shipment"** button
- A modal appears with pickup location options:
  - Outpost Branch
  - Chavadi Branch
  - Pasumalai Branch
  - Home
  - Default
  - Custom (manual entry)
- Admin selects the appropriate pickup location
- Admin clicks **"Confirm & Ship"**
- **NOW the order is sent to Shiprocket** with:
  - Complete order details
  - Customer shipping address
  - Selected pickup location
  - Payment method (COD/Prepaid)

### 3. **Shiprocket Processing**
- Order is created in Shiprocket
- AWB (tracking number) is automatically assigned
- Order data is updated in Firestore with:
  - `shipmentId`
  - `shiprocketOrderId`
  - `trackingId` (AWB code)
  - `trackingUrl`
  - `courier` name
  - Order status changes to `'shipped'`

---

## Key Features

✅ **Manual Control**: Admin has full control over when orders are sent to Shiprocket

✅ **Pickup Location Selection**: Admin can choose the correct pickup location for each order

✅ **Flexible Workflow**: Admin can confirm → pack → ship, or skip directly to shipping

✅ **Status Flexibility**: "Initiate Shipment" button is available for both `'confirmed'` and `'packed'` statuses

✅ **Cancellation Support**: Orders can be cancelled even after being marked as `'packed'` (before shipment initiation)

✅ **Proper Address Handling**: Customer shipping address is correctly sent to Shiprocket from the order's `delivery.snapshot`

---

## Disabled Features

❌ **Auto-shipment on order creation**: Disabled
❌ **Auto-shipment on order confirmation**: Disabled

These automatic triggers have been commented out in `functions/index.js` to ensure manual control.

---

## Return & Cancellation Flow

The following automatic triggers remain **ACTIVE** for handling returns and cancellations:

### Active Triggers:
1. **`onRefundRequestAccepted`**: Automatically cancels Shiprocket order or creates return shipment when admin approves a refund/return/replacement request
2. **`onOrderCancelled`**: Automatically cancels the Shiprocket order when order status is changed to `'cancelled'`
3. **`shiprocketWebhook`**: Receives status updates from Shiprocket and updates order status accordingly

---

## Testing Checklist

To verify everything works correctly:

1. ✅ Place a test order (COD or Prepaid)
2. ✅ Confirm the order in Admin Orders page
3. ✅ Click "Initiate Shipment"
4. ✅ Select pickup location (e.g., "Outpost Branch")
5. ✅ Click "Confirm & Ship"
6. ✅ Verify order appears in Shiprocket dashboard with correct:
   - Order details
   - Customer address
   - Pickup location
   - Payment method
7. ✅ Verify tracking ID is assigned
8. ✅ Test cancellation flow
9. ✅ Test return/refund flow

---

## Files Modified

1. **`functions/index.js`**
   - Disabled `onOrderCreated` trigger
   - Disabled `onOrderConfirmed` trigger
   - Kept `initiateShipment` callable function active

2. **`src/pages/admin/AdminOrders.jsx`**
   - Updated "Initiate Shipment" button to show for both `'confirmed'` and `'packed'` statuses
   - Added "Home" and "Default" pickup location options
   - Extended cancellation capability to `'packed'` status

3. **`functions/shiprocket.js`**
   - Already properly configured to use `pickupLocation` parameter
   - Sends complete order data to Shiprocket API

---

## Important Notes

⚠️ **Deploy Functions**: After making these changes, deploy the Firebase functions:
```bash
firebase deploy --only functions
```

⚠️ **Pickup Locations**: Ensure the pickup location names match exactly with what's configured in your Shiprocket account

⚠️ **Testing**: Test with a real order to ensure Shiprocket receives all data correctly
