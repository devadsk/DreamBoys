# 📸 SKU-Based Bulk Image Upload Guide

## 🎯 Overview

The SKU-based image upload system allows you to:
1. Upload all product images at once
2. Automatically link images to products using SKU codes
3. Never upload the same image twice
4. Update product info without re-uploading images

---

## 🚀 Quick Start Guide

### Step 1: Prepare Your Images

**Naming Convention:** `SKU-ImageNumber.extension`

**Examples:**
```
001-1.jpg    ← Product SKU: 001, Image 1
001-2.jpg    ← Product SKU: 001, Image 2
001-3.jpg    ← Product SKU: 001, Image 3
001-4.jpg    ← Product SKU: 001, Image 4
002-1.jpg    ← Product SKU: 002, Image 1
002-2.jpg    ← Product SKU: 002, Image 2
...
```

**Supported SKU Formats:**
- Simple numbers: `001-1.jpg`, `002-1.jpg`
- Category-based: `SHIRT-001-1.jpg`, `JEAN-002-1.jpg`
- Descriptive: `DBS-SHIRT-WHT-001-1.jpg`

**Requirements:**
- ✅ 4 images per product (recommended)
- ✅ Supported formats: JPG, PNG, WEBP
- ✅ File size: Up to 5MB per image
- ✅ Sequential numbering: -1, -2, -3, -4

---

## 📋 Step-by-Step Workflow

### **Step 1: Upload Images**

1. Go to **Admin Dashboard** → **Manage Products**
2. Click **"📤 Upload Images"** button
3. Click **"📁 Select Images (Multiple)"**
4. Select all your product images (e.g., 80 images for 20 products)
5. Click **"🚀 Upload Images"**

**What Happens:**
- All images are uploaded to Firebase Storage
- System groups images by SKU automatically
- You'll see a summary:
  ```
  ✅ Uploaded 80 images for 20 products
  
  📦 Product Summary:
  ✅ SKU 001: 4/4 images
  ✅ SKU 002: 4/4 images
  ⚠️ SKU 003: 2/4 images (Incomplete)
  ✅ SKU 004: 4/4 images
  ...
  ```

### **Step 2: Prepare Your CSV**

**CSV Format:**
```csv
sku,name,description,price,originalPrice,discount,category,colors,colorStock,sizeStock,features,specifications
001,Premium White Shirt,"Classic formal shirt",59.99,79.99,25,shirts,White Blue,White:30 Blue:25,S:15 M:20 L:10,"Premium Cotton|Wrinkle Resistant","Material:100% Cotton|Fit:Regular"
002,Blue Denim Jeans,"Classic blue jeans",89.99,119.99,25,jeans,Blue Black,Blue:45 Black:35,30:10 32:15 34:20,"Stretch Denim|5-Pocket","Material:98% Cotton 2% Elastane|Fit:Straight"
003,Black T-Shirt,"Casual cotton tee",29.99,39.99,25,tshirts,Black White,Black:50 White:40,S:25 M:30 L:25,"100% Cotton|Breathable","Material:Cotton|Fit:Slim"
```

**Important:**
- ✅ **First column MUST be `sku`**
- ✅ SKU values must match your image filenames
- ✅ No need for `images` column - auto-linked!

### **Step 3: Import Products**

1. Click **"📥 Bulk Import"** button
2. Click **"📥 Download Sample CSV"** (optional - to see format)
3. Upload your CSV file or paste CSV data
4. Click **"🚀 Import Products"**

**What Happens:**
- System reads each product's SKU
- Automatically finds matching images
- Links images to products
- Shows you the results:
  ```
  ✅ Imported 20 products successfully
  
  ℹ️ Image Linking Info:
  Premium White Shirt: Auto-linked 4 images from SKU 001
  Blue Denim Jeans: Auto-linked 4 images from SKU 002
  Black T-Shirt: SKU 003 has no uploaded images
  ...
  ```

---

## 💡 Example Scenarios

### **Scenario 1: New Store Setup (20 Products)**

**Your Files:**
```
📁 product-images/
   📷 001-1.jpg, 001-2.jpg, 001-3.jpg, 001-4.jpg
   📷 002-1.jpg, 002-2.jpg, 002-3.jpg, 002-4.jpg
   ...
   📷 020-1.jpg, 020-2.jpg, 020-3.jpg, 020-4.jpg
```

**Steps:**
1. Upload all 80 images → Firebase Storage
2. Create CSV with 20 products (SKUs: 001-020)
3. Import CSV → Products auto-linked to images ✅

**Time Saved:** Instead of uploading images 20 times (once per product), you upload once!

---

### **Scenario 2: Update Product Prices**

**Situation:** Need to change prices for 10 products

**Steps:**
1. Update your CSV with new prices
2. Import CSV again
3. Products update with new prices
4. **Images remain the same** - no re-upload needed! ✅

**CSV:**
```csv
sku,name,price
001,Premium White Shirt,499  ← Price changed from 599
002,Blue Denim Jeans,1099    ← Price changed from 1299
```

---

### **Scenario 3: Replace Product Photos**

**Situation:** Got better photos for Product 001

**Steps:**
1. Upload new images with same names:
   - `001-1.jpg` (new photo - replaces old)
   - `001-2.jpg` (new photo - replaces old)
   - `001-3.jpg` (new photo - replaces old)
   - `001-4.jpg` (new photo - replaces old)
2. Re-import product CSV (or just wait)
3. Product automatically uses new images ✅

---

### **Scenario 4: Add New Products**

**Situation:** Adding 5 new products to existing store

**Steps:**
1. Upload images for new products:
   - `021-1.jpg` through `021-4.jpg`
   - `022-1.jpg` through `022-4.jpg`
   - ...
   - `025-1.jpg` through `025-4.jpg`
2. Create CSV with SKUs 021-025
3. Import CSV → New products auto-linked ✅

---

## 🔍 Troubleshooting

### ❌ "Invalid filename format"

**Problem:** Image name doesn't match pattern

**Solution:**
- ✅ Correct: `001-1.jpg`, `SHIRT-001-2.jpg`
- ❌ Wrong: `product1.jpg`, `image-1.jpg`, `001_1.jpg`

**Fix:** Rename files to `SKU-Number.jpg` format

---

### ⚠️ "SKU has no uploaded images"

**Problem:** CSV has SKU but no images uploaded

**Solution:**
1. Check if images were uploaded successfully
2. Verify image filenames match SKU in CSV
3. Re-upload images if needed

---

### ⚠️ "Incomplete" (2/4 images)

**Problem:** Not all 4 images found for SKU

**Solution:**
1. Check if all 4 images were uploaded
2. Verify filenames: `SKU-1.jpg`, `SKU-2.jpg`, `SKU-3.jpg`, `SKU-4.jpg`
3. Upload missing images

---

## 📊 CSV Column Reference

### **Required Columns:**
- `sku` - Unique product identifier (matches image filenames)
- `name` - Product name
- `description` - Product description
- `price` - Selling price (decimal)
- `category` - Product category (shirts, tshirts, jeans, jackets)

### **Optional Columns:**
- `originalPrice` - Original price before discount
- `discount` - Discount percentage (integer)
- `colors` - Space-separated color names
- `colorStock` - Color inventory (Color:Qty Color:Qty)
- `sizeStock` - Size inventory (Size:Qty Size:Qty)
- `features` - Pipe-separated features (Feature1|Feature2)
- `specifications` - Pipe-separated specs (Key:Value|Key:Value)

### **Auto-Generated (Don't Include):**
- `images` - Auto-linked from uploaded images
- `rating` - Only from customer reviews
- `reviewCount` - Only from customer reviews

---

## 🎨 Best Practices

### **1. Consistent SKU Format**
Choose one format and stick to it:
- ✅ All numbers: `001`, `002`, `003`
- ✅ All category-based: `SHIRT-001`, `JEAN-001`
- ❌ Mixed: `001`, `SHIRT-002`, `DBS-JEAN-003`

### **2. Image Quality**
- Resolution: 1000x1000px or higher
- Format: JPG (best compression)
- Size: Under 500KB per image (faster loading)

### **3. Image Order**
- Image 1: Front view
- Image 2: Back view
- Image 3: Side view / Detail
- Image 4: Lifestyle / Model wearing

### **4. Backup**
- Keep original images in a safe location
- Firebase Storage is reliable but always backup locally

---

## 🚀 Advanced Tips

### **Bulk Rename Images**

**Windows PowerShell:**
```powershell
# Rename all images in folder to SKU format
$i = 1
Get-ChildItem *.jpg | ForEach-Object {
    $sku = [math]::Floor(($i-1)/4) + 1
    $num = (($i-1) % 4) + 1
    Rename-Item $_ -NewName ("{0:D3}-{1}.jpg" -f $sku, $num)
    $i++
}
```

**Mac/Linux:**
```bash
# Rename images to SKU format
i=1
for file in *.jpg; do
    sku=$(printf "%03d" $(((i-1)/4+1)))
    num=$(((i-1)%4+1))
    mv "$file" "${sku}-${num}.jpg"
    ((i++))
done
```

---

## ✅ Checklist

Before importing products:

- [ ] All images named correctly (`SKU-1.jpg`, `SKU-2.jpg`, etc.)
- [ ] 4 images per product
- [ ] Images uploaded via "Upload Images" button
- [ ] Upload successful (check summary)
- [ ] CSV has `sku` column as first column
- [ ] SKUs in CSV match image filenames
- [ ] CSV downloaded sample for reference

---

## 🎯 Summary

**Old Way (Without SKU):**
1. Add product manually
2. Upload 4 images
3. Repeat 20 times
4. Update product → Upload images again
⏱️ Time: ~2 hours

**New Way (With SKU):**
1. Upload all 80 images once
2. Import CSV with 20 products
3. Auto-linked instantly
4. Update product → No re-upload needed
⏱️ Time: ~10 minutes

**Time Saved: 92%!** 🚀

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify image naming format
3. Check Firebase Storage (images uploaded?)
4. Review CSV format (SKU column present?)
5. Check browser console for errors

---

**Happy Selling! 🛍️**
