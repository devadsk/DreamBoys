# ✅ CANCELLATION CHARGES - UPDATED (2.5% to 10%)

## 💰 **New Charge Structure**:

Since processing costs increase as the order progresses, the cancellation charges now reflect this:

| Status | Charge | Refund Amount (on ₹1000) |
|--------|--------|--------------------------|
| **Pending** | **2.5%** | ₹975 |
| **Confirmed** | **4%** | ₹960 |
| **Processing** | **6%** | ₹940 |
| **Packed** | **8%** | ₹920 |
| **Shipped** | **10%** | ₹900 |
| **Out for Delivery** | **10%** | ₹900 |

---

## 🔍 **Logic**:

1. **Pending (2.5%)**: Minimal processing done, mostly gateway charges + small admin fee.
2. **Confirmed (4%)**: Order verified, stock reserved.
3. **Processing (6%)**: Picking and sorting started.
4. **Packed (8%)**: Packaging materials used, label generated.
5. **Shipped/Out (10%)**: Shipping cost incurred, highest charge.

---

## 🛠️ **Implementation**:

The `getCancellationRefund` function in `Orders.jsx` has been updated:

```javascript
const statusRefundMap = {
    pending: 0.975,      // 97.5% refund (2.5% charge)
    confirmed: 0.96,     // 96% refund (4% charge)
    processing: 0.94,    // 94% refund (6% charge)
    packed: 0.92,        // 92% refund (8% charge)
    shipped: 0.90,       // 90% refund (10% charge)
    'out-for-delivery': 0.90  // 90% refund (10% charge)
};
```

**Default Charge**: 2.5% (for any status not listed or basic case)

---

## ✅ **Next Steps**:

1. **Verify Admin Panel**: Ensure status dropdown has all these statuses.
2. **Test Flow**: Try cancelling orders in different statuses to verify charges.
3. **Update Policy**: Make sure your cancellation policy page (if any) reflects these charges.
