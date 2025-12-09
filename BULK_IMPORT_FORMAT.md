# Bulk Import CSV Format - Updated

## Required Columns
- `name` - Product name
- `description` - Product description
- `price` - Product price (decimal)
- `category` - Product category (shirts, tshirts, jeans, jackets)
- `colors` - Space-separated color names
- `sizeStock` - Space-separated size:quantity pairs

## Optional Columns
- `originalPrice` - Original price before discount
- `discount` - Discount percentage (integer)
- `colorStock` - Space-separated color:quantity pairs
- `images` - Pipe-separated image URLs
- `features` - Pipe-separated product highlights
- `specifications` - Pipe-separated key:value pairs

## Sample CSV (Without Rating/Review):

```csv
name,description,price,originalPrice,discount,category,colors,colorStock,sizeStock,images,features,specifications
Premium White Shirt,"Classic formal white shirt made from 100% premium cotton. Perfect for office wear and formal occasions.",59.99,79.99,25,shirts,White Blue Pink,White:30 Blue:25 Pink:20,XS:5 S:15 M:20 L:10 XL:5,https://i.imgur.com/example1.jpg|https://i.imgur.com/example1b.jpg,"Premium Quality Cotton|Wrinkle Resistant|Easy Care|Comfortable Fit","Material:100% Cotton|Fit:Regular|Care:Machine Wash|Origin:Made in USA"
Casual Blue T-Shirt,"Comfortable cotton t-shirt for everyday wear. Soft fabric with modern fit.",29.99,39.99,25,tshirts,Blue Red Green Black,Blue:40 Red:30 Green:25 Black:50,S:25 M:30 L:25 XL:15 XXL:5,https://i.imgur.com/example2.jpg,"100% Cotton|Breathable Fabric|Durable Construction|Modern Fit","Material:Cotton Blend|Fit:Slim|Care:Machine Wash Cold|Weight:180 GSM"
Classic Blue Jeans,"Premium denim jeans with stretch comfort. Perfect fit for all-day wear.",89.99,119.99,25,jeans,Blue Black,Blue:45 Black:35,28:10 30:15 32:20 34:15 36:10,https://i.imgur.com/example3.jpg|https://i.imgur.com/example3b.jpg|https://i.imgur.com/example3c.jpg,"Stretch Denim|5-Pocket Design|Reinforced Stitching|Fade Resistant","Material:98% Cotton 2% Elastane|Fit:Straight|Rise:Mid|Wash:Dark Blue"
```

## Column Format Details:

- **sizeStock**: `XS:5 S:15 M:20 L:10 XL:5` (space-separated size:quantity)
- **colors**: `White Blue Black Red` (space-separated names)
- **colorStock**: `White:30 Blue:25 Black:20` (space-separated color:quantity)
- **images**: `url1.jpg|url2.jpg|url3.jpg` (pipe-separated URLs)
- **features**: `Premium Cotton|Wrinkle Resistant|Easy Care` (pipe-separated)
- **specifications**: `Material:Cotton|Fit:Regular|Care:Machine Wash` (pipe-separated key:value)

## Notes:
- Rating and review fields have been removed
- Focus on product details, highlights, and specifications
- All products will start with no reviews (can be added later by customers)
- Use quotes around descriptions if they contain commas
