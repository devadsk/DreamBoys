# Testing Guide - Wishlist Functionality Update

## Test Scenarios

### 1. Adding to Wishlist from Product Detail Page
**Steps:**
1. Navigate to any product detail page
2. Click the wishlist button (heart icon)
3. Verify the item appears in wishlist (check header count)
4. Navigate to wishlist page
5. Verify product is listed WITHOUT any size/color badges

**Expected Result:**
- Product added to wishlist
- No size or color information displayed on wishlist card
- Wishlist count increases by 1

---

### 2. Moving from Wishlist to Cart
**Steps:**
1. Go to Wishlist page
2. Click "Move to Cart" button on any item
3. Verify modal appears with:
   - Product image and name
   - Color selection (if product has colors)
   - Size selection
   - Quantity selector
   - Stock information

**Expected Result:**
- Modal opens with all selection options
- Default selections are pre-populated
- Stock levels are displayed correctly

---

### 3. Variant Selection in Modal
**Steps:**
1. Open the variant selection modal
2. Select a color
3. Verify available sizes update based on color
4. Select a size
5. Verify stock level is displayed
6. Adjust quantity using +/- buttons
7. Verify quantity cannot exceed stock

**Expected Result:**
- Size options change when color changes
- Stock information updates when size changes
- Quantity is limited by available stock
- Low stock warning appears when stock ≤ 5

---

### 4. Confirming Move to Cart
**Steps:**
1. In the modal, select size, color, and quantity
2. Click "Add to Cart"
3. Verify navigation to cart page
4. Verify item appears in cart with selected variants
5. Go back to wishlist
6. Verify item is removed from wishlist

**Expected Result:**
- Item moves to cart with correct size, color, quantity
- Item is removed from wishlist
- Cart count increases
- Wishlist count decreases

---

### 5. Canceling Modal
**Steps:**
1. Click "Move to Cart" to open modal
2. Click "Cancel" or click outside modal
3. Verify modal closes
4. Verify item remains in wishlist
5. Verify cart is unchanged

**Expected Result:**
- Modal closes without action
- Wishlist unchanged
- Cart unchanged

---

### 6. Moving from Cart to Wishlist
**Steps:**
1. Go to Cart page
2. Click "Move to Wishlist" on any item
3. Verify item is removed from cart
4. Go to Wishlist page
5. Verify item appears in wishlist WITHOUT size/color

**Expected Result:**
- Item removed from cart
- Item added to wishlist
- Size and color information NOT stored
- Can select new variants when moving back to cart

---

### 7. Out of Stock Handling
**Steps:**
1. Add a product to wishlist
2. (Admin) Set all stock to 0 for that product
3. Try to move to cart
4. Verify "Add to Cart" button is disabled
5. Verify appropriate message is shown

**Expected Result:**
- Cannot add out-of-stock items to cart
- Clear messaging about stock status

---

### 8. Color-Specific Stock
**Steps:**
1. Open modal for product with multiple colors
2. Select a color with available stock
3. Note available sizes
4. Select a color with limited/no stock
5. Verify size options change

**Expected Result:**
- Available sizes change based on color selection
- Out of stock colors show appropriate message
- Cannot select unavailable size/color combinations

---

### 9. Multiple Wishlist Items
**Steps:**
1. Add 3-5 different products to wishlist
2. Move each to cart one by one
3. Verify each shows the modal
4. Verify each can have different selections
5. Verify all appear in cart correctly

**Expected Result:**
- Each item can be customized independently
- All items move to cart with correct variants
- Wishlist empties as items move

---

### 10. Mobile Responsiveness
**Steps:**
1. Open on mobile device or resize browser
2. Add item to wishlist
3. Open move to cart modal
4. Verify modal is readable and usable
5. Test all interactions

**Expected Result:**
- Modal is responsive and fits screen
- All buttons are tappable
- Text is readable
- Scrolling works if needed

---

## Edge Cases to Test

### A. Product Without Colors
- Should only show size selection
- Should work without color parameter

### B. Product Without Sizes
- Should only show color selection
- Should work without size parameter

### C. Product With Neither
- Should only show quantity
- Should still work correctly

### D. Rapid Clicking
- Click "Move to Cart" multiple times quickly
- Verify only one modal opens
- Verify no duplicate actions

### E. Network Issues
- Test with slow connection
- Verify loading states
- Verify error handling

---

## Validation Checklist

- [ ] Wishlist stores only product data (no variants)
- [ ] Modal appears when moving to cart
- [ ] Color selection works correctly
- [ ] Size selection updates based on color
- [ ] Stock validation prevents over-ordering
- [ ] Quantity selector respects stock limits
- [ ] Confirm button adds to cart correctly
- [ ] Cancel button closes modal without action
- [ ] Item removed from wishlist after move
- [ ] Cart receives item with correct variants
- [ ] Mobile layout is responsive
- [ ] All animations are smooth
- [ ] No console errors
- [ ] Firestore data structure is correct

---

## Known Limitations

1. **Stock Updates**: Stock levels are checked at modal open time. If stock changes while modal is open, it won't update until modal is reopened.

2. **Cart Conflicts**: If the same product with same size/color is already in cart, quantities will be combined.

3. **Session Persistence**: Modal state is not persisted. Refreshing page will close modal.

---

## Debugging Tips

### If modal doesn't appear:
1. Check browser console for errors
2. Verify `VariantSelectionModal` is imported
3. Check `showModal` state in React DevTools

### If variants don't update:
1. Verify product has `colorSizeStock` data
2. Check `getAvailableSizes()` logic
3. Verify useEffect dependencies

### If stock validation fails:
1. Check `getStockLevel()` function
2. Verify `colorSizeStock` structure in Firestore
3. Check quantity state updates

---

## Success Criteria

✅ All test scenarios pass
✅ No console errors
✅ Smooth user experience
✅ Data persists correctly in Firestore
✅ Mobile and desktop work equally well
