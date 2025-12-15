# Color-Size Stock System Update

## New Structure

Instead of separate `colorStock` and `sizeStock`, we'll use a combined structure:

```javascript
colorSizeStock: {
  "Blue": {
    "S": 10,
    "M": 5,
    "L": 8,
    "XL": 3
  },
  "Red": {
    "S": 8,
    "M": 12,
    "L": 6,
    "XL": 2
  }
}
```

## CSV Format

```csv
name,description,price,category,colorSizeStock
Premium Shirt,"Description",59.99,shirts,"Blue:S:10 M:5 L:8 XL:3|Red:S:8 M:12 L:6 XL:2"
```

Format: `Color:Size:Qty Size:Qty|Color:Size:Qty Size:Qty`

## Benefits
- More realistic inventory tracking
- Each color can have different size availability
- Better stock management
- Clearer for customers what's actually available
