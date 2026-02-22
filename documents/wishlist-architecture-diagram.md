# Wishlist to Cart Flow - Updated Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCT DETAIL PAGE                         │
│                                                                 │
│  User clicks "Add to Wishlist" button                          │
│  ↓                                                              │
│  addToWishlist(product) ← NO size/color passed                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    WISHLIST CONTEXT                             │
│                                                                 │
│  Stores in Firestore:                                          │
│  {                                                              │
│    id, name, price, image, category,                           │
│    sizes: [...], colors: [...],                                │
│    colorSizeStock: {...},                                      │
│    addedAt: timestamp                                          │
│  }                                                              │
│  ⚠️ NO selectedSize or selectedColor stored                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      WISHLIST PAGE                              │
│                                                                 │
│  User clicks "Move to Cart" button                             │
│  ↓                                                              │
│  handleMoveToCart(product)                                      │
│  ↓                                                              │
│  setShowModal(true) ← Opens modal                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              VARIANT SELECTION MODAL                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │  Product: [Product Name]                          │         │
│  │  Price: ₹[Price]                                  │         │
│  │                                                    │         │
│  │  Color: [Color Swatches]                          │         │
│  │  Size: [S] [M] [L] [XL]                          │         │
│  │  Stock: X items available                         │         │
│  │  Quantity: [-] 1 [+]                              │         │
│  │                                                    │         │
│  │  [Cancel]  [Add to Cart]                          │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  User selects: size, color, quantity                           │
│  ↓                                                              │
│  handleModalConfirm(size, color, quantity)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    WISHLIST CONTEXT                             │
│                                                                 │
│  moveToCart(product, size, color, quantity, addToCartFn)       │
│  ↓                                                              │
│  addToCartFn(productData, size, color, quantity)               │
│  removeFromWishlist(product.id)                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CART CONTEXT                               │
│                                                                 │
│  Stores in Firestore:                                          │
│  {                                                              │
│    id, name, price, image, category,                           │
│    selectedSize: "M",    ← User selected                       │
│    selectedColor: "Blue", ← User selected                      │
│    quantity: 2           ← User selected                       │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        CART PAGE                                │
│                                                                 │
│  Item added with user-selected variants ✓                      │
└─────────────────────────────────────────────────────────────────┘
```

## Key Changes Summary

### ❌ OLD BEHAVIOR:
- Wishlist stored: `selectedSize` and `selectedColor`
- Moving to cart: Used stored values directly
- No user choice when moving to cart

### ✅ NEW BEHAVIOR:
- Wishlist stores: Only product info (no variants)
- Moving to cart: Shows modal for user selection
- User chooses size, color, quantity in modal

## Component Responsibilities

### WishlistContext
- `addToWishlist(product)` - Stores product without variants
- `moveToCart(item, size, color, quantity, addToCartFn)` - Handles transfer

### VariantSelectionModal
- Displays product information
- Provides color selection UI
- Provides size selection UI (filtered by color availability)
- Provides quantity selector (limited by stock)
- Validates selections before confirming

### Wishlist Page
- Displays wishlist items
- Opens modal on "Move to Cart" click
- Handles modal confirmation/cancellation
- Navigates to cart after successful move

## Stock Validation Flow

```
User selects color → Filter available sizes → Update size options
                                                      ↓
User selects size → Get stock level → Update quantity limits
                                              ↓
User adjusts quantity → Validate against stock → Enable/disable confirm
```
