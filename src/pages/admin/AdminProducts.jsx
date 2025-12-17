import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../firebase/firebaseService';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../firebase/config';
import '../admin/AdminDashboard.css';
import './AdminProducts.css';

// Initialize Firebase Storage
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Default sizes for all products
    const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        price: '',
        description: '',
        category: 'shirts',
        colors: [],
        colorSizeStock: {}, // New: { "Blue": { "S": 10, "M": 15 }, "Red": { "S": 8 } }
        image: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [newSize, setNewSize] = useState('');
    const [newSizeQty, setNewSizeQty] = useState('');
    const [colorsInput, setColorsInput] = useState('');

    // Bulk import states
    const [csvData, setCsvData] = useState('');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // Bulk image upload states
    const [showBulkImageUpload, setShowBulkImageUpload] = useState(false);
    const [bulkImages, setBulkImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [imageUploadProgress, setImageUploadProgress] = useState(0);
    const [uploadedImageMap, setUploadedImageMap] = useState({}); // { SKU: [url1, url2, url3, url4] }
    const [imageUploadResult, setImageUploadResult] = useState(null);

    const sampleCSV = `sku,name,description,price,originalPrice,discount,category,colors,colorStock,sizeStock,features,specifications
001,Premium White Shirt,"Classic formal white shirt made from 100% premium cotton. Perfect for office wear and formal occasions.",59.99,79.99,25,shirts,White Blue Pink,White:30 Blue:25 Pink:20,XS:5 S:15 M:20 L:10 XL:5,"Premium Quality Cotton|Wrinkle Resistant|Easy Care|Comfortable Fit","Material:100% Cotton|Fit:Regular|Care:Machine Wash|Origin:Made in USA"
002,Casual Blue T-Shirt,"Comfortable cotton t-shirt for everyday wear. Soft fabric with modern fit.",29.99,39.99,25,tshirts,Blue Red Green Black,Blue:40 Red:30 Green:25 Black:50,S:25 M:30 L:25 XL:15 XXL:5,"100% Cotton|Breathable Fabric|Durable Construction|Modern Fit","Material:Cotton Blend|Fit:Slim|Care:Machine Wash Cold|Weight:180 GSM"
003,Classic Blue Jeans,"Premium denim jeans with stretch comfort. Perfect fit for all-day wear.",89.99,119.99,25,jeans,Blue Black,Blue:45 Black:35,28:10 30:15 32:20 34:15 36:10,"Stretch Denim|5-Pocket Design|Reinforced Stitching|Fade Resistant","Material:98% Cotton 2% Elastane|Fit:Straight|Rise:Mid|Wash:Dark Blue"`;

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const result = await getProducts();
        if (result.success) {
            setProducts(result.data);
        }
        setLoading(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file) => {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            let imageUrl = formData.image;

            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            // Calculate total stock and get sizes from colorSizeStock
            let totalStock = 0;
            const allSizes = new Set();

            Object.values(formData.colorSizeStock).forEach(sizeObj => {
                Object.entries(sizeObj).forEach(([size, qty]) => {
                    totalStock += parseInt(qty) || 0;
                    if (qty > 0) allSizes.add(size);
                });
            });

            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                sizes: Array.from(allSizes),
                stock: totalStock,
                colorSizeStock: formData.colorSizeStock,
                image: imageUrl,
                images: [imageUrl]
            };

            // Check if SKU is provided and if we have uploaded images for it
            if (formData.sku && uploadedImageMap[formData.sku]) {
                const skuImages = uploadedImageMap[formData.sku];

                // Check if product has color variants
                if (formData.colors && formData.colors.length > 0) {
                    // Product has colors - map color-specific images
                    const colorImages = {};

                    formData.colors.forEach(color => {
                        const colorKey = color;
                        const colorKeyLower = color.toLowerCase();

                        // Try exact match first, then case-insensitive
                        if (skuImages[colorKey]) {
                            colorImages[color] = skuImages[colorKey];
                        } else if (skuImages[colorKeyLower]) {
                            colorImages[color] = skuImages[colorKeyLower];
                        } else {
                            // Check case-insensitive in all uploaded colors
                            const foundColor = Object.keys(skuImages).find(
                                key => key.toLowerCase() === colorKeyLower
                            );
                            if (foundColor) {
                                colorImages[color] = skuImages[foundColor];
                            }
                        }
                    });

                    if (Object.keys(colorImages).length > 0) {
                        productData.colorImages = colorImages;
                        // Set primary images to first color's images
                        const firstColor = formData.colors[0];
                        productData.images = colorImages[firstColor] || [imageUrl];
                        productData.image = productData.images[0] || imageUrl;
                    }
                } else {
                    // No color variants - use default images
                    if (skuImages['default']) {
                        productData.images = skuImages['default'];
                        productData.image = skuImages['default'][0];
                    } else {
                        // Fallback: use first available color's images
                        const firstColorKey = Object.keys(skuImages)[0];
                        if (firstColorKey) {
                            productData.images = skuImages[firstColorKey];
                            productData.image = skuImages[firstColorKey][0];
                        }
                    }
                }
            }

            if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
            } else {
                await addProduct(productData);
            }

            setShowModal(false);
            resetForm();
            loadProducts();
        } catch (error) {
            alert('Error saving product: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);

        // Load colorSizeStock or convert from old format
        let colorSizeStock = {};
        if (product.colorSizeStock) {
            colorSizeStock = product.colorSizeStock;
        } else if (product.colors && product.sizeStock) {
            // Convert old format: distribute sizeStock across colors
            product.colors.forEach(color => {
                colorSizeStock[color] = { ...product.sizeStock };
            });
        }

        setFormData({
            sku: product.sku || '',
            name: product.name,
            price: product.price,
            description: product.description,
            category: product.category,
            colors: product.colors || [],
            colorSizeStock: colorSizeStock,
            image: product.image || ''
        });
        setColorsInput((product.colors || []).join(' '));
        setImagePreview(product.image || '');
        setShowModal(true);
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            await deleteProduct(productId);
            loadProducts();
        }
    };

    const resetForm = () => {
        setFormData({
            sku: '',
            name: '',
            price: '',
            description: '',
            category: 'shirts',
            colors: [],
            colorSizeStock: {},
            image: ''
        });
        setColorsInput('');
        setImageFile(null);
        setImagePreview('');
        setEditingProduct(null);
        setNewSize('');
        setNewSizeQty('');
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSizeStockChange = (size, value) => {
        setFormData({
            ...formData,
            sizeStock: {
                ...formData.sizeStock,
                [size]: parseInt(value) || 0
            }
        });
    };

    const handleAddSize = () => {
        if (newSize && newSizeQty) {
            setFormData({
                ...formData,
                sizeStock: {
                    ...formData.sizeStock,
                    [newSize.toUpperCase()]: parseInt(newSizeQty) || 0
                }
            });
            setNewSize('');
            setNewSizeQty('');
        }
    };

    const handleRemoveSize = (size) => {
        const newSizeStock = { ...formData.sizeStock };
        delete newSizeStock[size];
        setFormData({
            ...formData,
            sizeStock: newSizeStock
        });
    };

    const handleColorsChange = (e) => {
        const value = e.target.value;
        setColorsInput(value);
        const colorsArray = value.split(' ').map(c => c.trim()).filter(c => c);
        setFormData({
            ...formData,
            colors: colorsArray
        });
    };

    const getTotalStock = () => {
        let total = 0;
        Object.values(formData.colorSizeStock).forEach(sizeObj => {
            Object.values(sizeObj).forEach(qty => {
                total += parseInt(qty) || 0;
            });
        });
        return total;
    };

    // CSV Parser
    const parseCSV = (csv) => {
        const parseCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];

                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };

        const lines = csv.trim().split(/\r?\n/);
        const headers = parseCSVLine(lines[0]);
        const products = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = parseCSVLine(lines[i]);
            if (values.length !== headers.length) {
                console.warn(`Line ${i + 1}: Expected ${headers.length} values, got ${values.length}. Skipping.`);
                continue;
            }

            const product = {};
            headers.forEach((header, index) => {
                const value = values[index];

                // Skip rating and reviewCount - these should only come from users
                if (header === 'rating' || header === 'reviewCount') {
                    return; // Ignore these columns completely
                }

                if (header === 'price' || header === 'originalPrice') {
                    product[header] = parseFloat(value) || 0;
                } else if (header === 'discount') {
                    product[header] = parseInt(value) || 0;
                } else if (header === 'colorSizeStock') {
                    // New combined color-size stock format
                    // Format: "Blue:S:10 M:5 L:8|Red:S:8 M:12 L:6"
                    const colorSizeStock = {};
                    let totalStock = 0;
                    const allSizes = new Set();
                    const allColors = [];

                    const colorGroups = value.split('|').filter(g => g.trim());
                    colorGroups.forEach(group => {
                        const parts = group.trim().split(':');
                        if (parts.length < 2) return;

                        const color = parts[0].trim();
                        allColors.push(color);
                        colorSizeStock[color] = {};

                        // Parse size:quantity pairs for this color
                        for (let i = 1; i < parts.length; i += 2) {
                            if (i + 1 < parts.length) {
                                const size = parts[i].trim();
                                const qty = parseInt(parts[i + 1]) || 0;
                                colorSizeStock[color][size] = qty;
                                allSizes.add(size);
                                totalStock += qty;
                            }
                        }
                    });

                    product.colorSizeStock = colorSizeStock;
                    product.colors = allColors;
                    product.sizes = Array.from(allSizes);
                    product.stock = totalStock;
                } else if (header === 'sizeStock') {
                    // Convert simple sizeStock to colorSizeStock format with 'default' key
                    const sizeStock = {};
                    const pairs = value.split(' ').filter(p => p.trim());
                    pairs.forEach(pair => {
                        const [size, stock] = pair.split(':');
                        if (size && stock) {
                            sizeStock[size.trim()] = parseInt(stock) || 0;
                        }
                    });
                    // Store as colorSizeStock with 'default' key for products without colors
                    product.colorSizeStock = { 'default': sizeStock };
                    product.stock = Object.values(sizeStock).reduce((sum, qty) => sum + qty, 0);
                    product.sizes = Object.keys(sizeStock);
                    product.colors = []; // No colors for simple stock

                } else if (header === 'colorStock') {
                    const colorStock = {};
                    const pairs = value.split(' ').filter(p => p.trim());
                    pairs.forEach(pair => {
                        const [color, stock] = pair.split(':');
                        if (color && stock) {
                            colorStock[color.trim()] = parseInt(stock) || 0;
                        }
                    });
                    product.colorStock = colorStock;
                } else if (header === 'colors') {
                    product[header] = value.split(' ').map(v => v.trim()).filter(v => v);
                } else if (header === 'images') {
                    const imageUrls = value.split('|').map(v => v.trim()).filter(v => v);
                    product[header] = imageUrls;
                    product.image = imageUrls[0] || '';
                } else if (header === 'features') {
                    // Features are pipe-separated
                    product[header] = value.split('|').map(v => v.trim()).filter(v => v);
                } else if (header === 'specifications') {
                    // Specifications are pipe-separated key:value pairs
                    const specs = {};
                    const pairs = value.split('|').filter(p => p.trim());
                    pairs.forEach(pair => {
                        const [key, val] = pair.split(':');
                        if (key && val) {
                            specs[key.trim()] = val.trim();
                        }
                    });
                    product[header] = specs;
                } else {
                    product[header] = value;
                }
            });

            product.createdAt = new Date().toISOString();
            product.featured = false;

            if (product.name && product.description && product.price && product.category) {
                products.push(product);
            } else {
                console.warn(`Line ${i + 1}: Missing required fields. Skipping.`);
            }
        }

        return products;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCsvData(event.target.result);
            };
            reader.readAsText(file);
        }
    };

    const handleBulkImport = async () => {
        if (!csvData.trim()) {
            setImportResult({ success: false, error: 'Please upload a CSV file or paste CSV data' });
            return;
        }

        setImporting(true);
        setImportResult(null);

        try {
            const products = parseCSV(csvData);
            let successCount = 0;
            let errorCount = 0;
            const errors = [];
            const warnings = [];

            for (const product of products) {
                try {
                    // Check if product has SKU and if we have uploaded images for it
                    if (product.sku && uploadedImageMap[product.sku]) {
                        const skuImages = uploadedImageMap[product.sku];

                        // Check if product has color variants
                        if (product.colors && product.colors.length > 0) {
                            // Product has colors - map color-specific images
                            const colorImages = {};
                            let totalImagesLinked = 0;

                            product.colors.forEach(color => {
                                const colorKey = color; // Exact match
                                const colorKeyLower = color.toLowerCase(); // Case-insensitive fallback

                                // Try exact match first, then case-insensitive
                                if (skuImages[colorKey]) {
                                    colorImages[color] = skuImages[colorKey];
                                    totalImagesLinked += skuImages[colorKey].length;
                                } else if (skuImages[colorKeyLower]) {
                                    colorImages[color] = skuImages[colorKeyLower];
                                    totalImagesLinked += skuImages[colorKeyLower].length;
                                } else {
                                    // Check case-insensitive in all uploaded colors
                                    const foundColor = Object.keys(skuImages).find(
                                        key => key.toLowerCase() === colorKeyLower
                                    );
                                    if (foundColor) {
                                        colorImages[color] = skuImages[foundColor];
                                        totalImagesLinked += skuImages[foundColor].length;
                                    } else {
                                        warnings.push(`${product.name}: No images found for color "${color}"`);
                                    }
                                }
                            });

                            if (Object.keys(colorImages).length > 0) {
                                product.colorImages = colorImages;
                                // Set primary images to first color's images
                                const firstColor = product.colors[0];
                                product.images = colorImages[firstColor] || [];
                                product.image = product.images[0] || '';
                                warnings.push(`${product.name}: Auto-linked ${totalImagesLinked} images for ${Object.keys(colorImages).length} colors`);
                            } else {
                                warnings.push(`${product.name}: SKU ${product.sku} has no matching color images`);
                            }
                        } else {
                            // No color variants - use default images
                            if (skuImages['default']) {
                                product.images = skuImages['default'];
                                product.image = skuImages['default'][0];
                                warnings.push(`${product.name}: Auto-linked ${skuImages['default'].length} images from SKU ${product.sku}`);
                            } else {
                                // Fallback: use first available color's images
                                const firstColorKey = Object.keys(skuImages)[0];
                                if (firstColorKey) {
                                    product.images = skuImages[firstColorKey];
                                    product.image = skuImages[firstColorKey][0];
                                    warnings.push(`${product.name}: Auto-linked ${skuImages[firstColorKey].length} images from SKU ${product.sku}`);
                                }
                            }
                        }
                    } else if (product.sku && !uploadedImageMap[product.sku]) {
                        warnings.push(`${product.name}: SKU ${product.sku} has no uploaded images`);
                    }

                    const result = await addProduct(product);
                    if (result.success) {
                        successCount++;
                    } else {
                        errorCount++;
                        errors.push(`${product.name}: ${result.error}`);
                    }
                } catch (error) {
                    errorCount++;
                    errors.push(`${product.name}: ${error.message}`);
                }
            }

            setImportResult({
                success: successCount > 0,
                message: `Imported ${successCount} products successfully`,
                errors: errorCount > 0 ? errors : null,
                warnings: warnings.length > 0 ? warnings : null,
                successCount,
                errorCount
            });

            if (successCount > 0) {
                loadProducts();
            }

        } catch (error) {
            setImportResult({ success: false, error: error.message });
        } finally {
            setImporting(false);
        }
    };

    const downloadSample = () => {
        const blob = new Blob([sampleCSV], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products_sample.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Handle bulk image file selection
    const handleBulkImageSelect = (e) => {
        const files = Array.from(e.target.files);
        setBulkImages(files);
        setImageUploadResult(null);
    };

    // Extract SKU and color from filename
    // Supports: 001-1.jpg, 001-Blue-1.jpg, SHIRT-001-White-1.jpg
    const extractSKUAndColorFromFilename = (filename) => {
        // Remove extension
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

        // Try to match: SKU-COLOR-Number (e.g., 001-Blue-1, SHIRT-001-White-1)
        const colorMatch = nameWithoutExt.match(/^(.+)-([A-Za-z]+)-(\d+)$/);
        if (colorMatch) {
            return {
                sku: colorMatch[1],
                color: colorMatch[2],
                imageNumber: parseInt(colorMatch[3])
            };
        }

        // Fallback: SKU-Number (e.g., 001-1) - no color variant
        const simpleMatch = nameWithoutExt.match(/^(.+)-(\d+)$/);
        if (simpleMatch) {
            return {
                sku: simpleMatch[1],
                color: null,
                imageNumber: parseInt(simpleMatch[2])
            };
        }

        return null;
    };

    // Upload bulk images to Firebase Storage
    const handleBulkImageUpload = async () => {
        if (bulkImages.length === 0) {
            setImageUploadResult({ success: false, error: 'Please select images to upload' });
            return;
        }

        setUploadingImages(true);
        setImageUploadProgress(0);
        setImageUploadResult(null);

        try {
            const imageMap = {}; // { SKU: { color: [url1, url2, url3, url4] } } or { SKU: [url1, url2, url3, url4] }
            const uploadedUrls = [];
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (let i = 0; i < bulkImages.length; i++) {
                const file = bulkImages[i];
                const parsed = extractSKUAndColorFromFilename(file.name);

                if (!parsed || !parsed.sku) {
                    errorCount++;
                    errors.push(`${file.name}: Invalid filename format. Use SKU-Number.jpg or SKU-COLOR-Number.jpg`);
                    continue;
                }

                try {
                    // Upload to Firebase Storage with original filename
                    const storageRef = ref(storage, `products/${file.name}`);
                    await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(storageRef);

                    const { sku, color, imageNumber } = parsed;

                    // Initialize SKU entry if doesn't exist
                    if (!imageMap[sku]) {
                        imageMap[sku] = {};
                    }

                    if (color) {
                        // Color variant: group by color
                        if (!imageMap[sku][color]) {
                            imageMap[sku][color] = [];
                        }
                        imageMap[sku][color].push({ url, imageNumber });
                    } else {
                        // No color variant: store directly
                        if (!imageMap[sku]['default']) {
                            imageMap[sku]['default'] = [];
                        }
                        imageMap[sku]['default'].push({ url, imageNumber });
                    }

                    uploadedUrls.push({ sku, color: color || 'default', filename: file.name, url });
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`${file.name}: ${error.message}`);
                }

                // Update progress
                setImageUploadProgress(Math.round(((i + 1) / bulkImages.length) * 100));
            }

            // Sort images within each SKU/color group by image number
            Object.keys(imageMap).forEach(sku => {
                Object.keys(imageMap[sku]).forEach(color => {
                    imageMap[sku][color].sort((a, b) => a.imageNumber - b.imageNumber);
                    // Extract just URLs
                    imageMap[sku][color] = imageMap[sku][color].map(item => item.url);
                });
            });

            setUploadedImageMap(imageMap);

            // Generate result summary
            const skuCount = Object.keys(imageMap).length;
            const skuDetails = [];

            Object.entries(imageMap).forEach(([sku, colorData]) => {
                Object.entries(colorData).forEach(([color, urls]) => {
                    skuDetails.push({
                        sku,
                        color: color === 'default' ? 'No color variant' : color,
                        imageCount: urls.length,
                        complete: urls.length === 4
                    });
                });
            });

            setImageUploadResult({
                success: successCount > 0,
                message: `Uploaded ${successCount} images for ${skuCount} products`,
                successCount,
                errorCount,
                errors: errorCount > 0 ? errors : null,
                skuDetails,
                imageMap
            });

        } catch (error) {
            setImageUploadResult({ success: false, error: error.message });
        } finally {
            setUploadingImages(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="container">
                <div className="admin-header">
                    <h1>Manage Products</h1>
                    <div className="header-actions">
                        <button className="btn btn-outline" onClick={() => setShowBulkImageUpload(true)}>
                            📤 Upload Images
                        </button>
                        <button className="btn btn-outline" onClick={() => setShowBulkImport(true)}>
                            📥 Bulk Import
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            ➕ Add New Product
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Loading products...</div>
                ) : (
                    <div className="products-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="no-products">
                                            No products found. Add your first product!
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id}>
                                            <td>
                                                <div className="product-image-thumb">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} />
                                                    ) : (
                                                        <div className="image-placeholder">📦</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{product.name}</td>
                                            <td><span className="category-badge">{product.category}</span></td>
                                            <td>₹{product.price}</td>
                                            <td>{product.stock || 0}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-icon btn-edit" onClick={() => handleEdit(product)}>
                                                        ✏️
                                                    </button>
                                                    <button className="btn-icon btn-delete" onClick={() => handleDelete(product.id)}>
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add/Edit Product Modal */}
                {showModal && (
                    <div className="modal-backdrop" onClick={() => { setShowModal(false); resetForm(); }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                                <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="product-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">SKU (Stock Keeping Unit)</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            className="form-input"
                                            value={formData.sku}
                                            onChange={handleChange}
                                            placeholder="e.g., 001, SHIRT-001, DBS-JEAN-01"
                                        />
                                        <small style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                            💡 Used to link bulk-uploaded images (e.g., 001-Blue-1.jpg)
                                        </small>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Category *</label>
                                        <select
                                            name="category"
                                            className="form-select"
                                            value={formData.category}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="shirts">Shirts</option>
                                            <option value="tshirts">T-Shirts</option>
                                            <option value="jeans">Jeans</option>
                                            <option value="jackets">Jackets</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Price (₹) *</label>
                                    <input
                                        type="number"
                                        name="price"
                                        className="form-input"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description *</label>
                                    <textarea
                                        name="description"
                                        className="form-textarea"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        rows="4"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Colors</label>
                                    <div className="color-management">
                                        {/* Predefined Color Palette */}
                                        <div className="color-palette">
                                            <label className="palette-label">Quick Select:</label>
                                            <div className="color-palette-grid">
                                                {['Black', 'White', 'Red', 'Blue', 'Navy', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Gray', 'Brown', 'Beige', 'Khaki'].map((color) => {
                                                    const colorMap = {
                                                        'Black': '#000000',
                                                        'White': '#FFFFFF',
                                                        'Red': '#DC2626',
                                                        'Blue': '#2563EB',
                                                        'Navy': '#1E3A8A',
                                                        'Green': '#16A34A',
                                                        'Yellow': '#EAB308',
                                                        'Orange': '#EA580C',
                                                        'Purple': '#9333EA',
                                                        'Pink': '#EC4899',
                                                        'Gray': '#6B7280',
                                                        'Brown': '#92400E',
                                                        'Beige': '#D4C5B9',
                                                        'Khaki': '#C3B091'
                                                    };
                                                    const isSelected = formData.colors.includes(color);
                                                    return (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            className={`color-palette-btn ${isSelected ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                const newColors = isSelected
                                                                    ? formData.colors.filter(c => c !== color)
                                                                    : [...formData.colors, color];
                                                                setFormData({ ...formData, colors: newColors });
                                                                setColorsInput(newColors.join(' '));
                                                            }}
                                                            title={color}
                                                        >
                                                            <span
                                                                className="color-swatch-admin"
                                                                style={{
                                                                    backgroundColor: colorMap[color],
                                                                    border: color === 'White' ? '2px solid #E5E7EB' : 'none'
                                                                }}
                                                            ></span>
                                                            <span className="color-name-admin">{color}</span>
                                                            {isSelected && <span className="check-icon">✓</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Custom Color Input */}
                                        <div className="custom-color-input">
                                            <label className="palette-label">Or enter custom colors (space-separated):</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={colorsInput}
                                                onChange={handleColorsChange}
                                                placeholder="e.g., Maroon Teal Olive"
                                            />
                                        </div>

                                        {/* Selected Colors Preview */}
                                        {formData.colors.length > 0 && (
                                            <div className="selected-colors-preview">
                                                <label className="palette-label">Selected Colors ({formData.colors.length}):</label>
                                                <div className="colors-preview-list">
                                                    {formData.colors.map((color, idx) => (
                                                        <span key={idx} className="color-tag-admin">
                                                            {color}
                                                            <button
                                                                type="button"
                                                                className="remove-color-btn"
                                                                onClick={() => {
                                                                    const removedColor = formData.colors[idx];
                                                                    const newColors = formData.colors.filter((_, i) => i !== idx);
                                                                    const newColorSizeStock = { ...formData.colorSizeStock };
                                                                    delete newColorSizeStock[removedColor];
                                                                    setFormData({ ...formData, colors: newColors, colorSizeStock: newColorSizeStock });
                                                                    setColorsInput(newColors.join(' '));
                                                                }}
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>


                                <div className="form-group">
                                    <label className="form-label">Stock Management *</label>
                                    <div className="size-stock-container">
                                        {formData.colors.length === 0 ? (
                                            /* Simple Size Stock - No Colors */
                                            <div className="simple-stock-section">
                                                <p className="stock-mode-info">📦 Simple stock mode (no color variants)</p>
                                                <div className="size-grid-simple">
                                                    {defaultSizes.map(size => (
                                                        <div key={size} className="size-card">
                                                            <label className="size-card-label">{size}</label>
                                                            <input
                                                                type="number"
                                                                className="size-card-input"
                                                                value={formData.colorSizeStock['default']?.[size] || 0}
                                                                onChange={(e) => {
                                                                    const newColorSizeStock = { ...formData.colorSizeStock };
                                                                    if (!newColorSizeStock['default']) {
                                                                        newColorSizeStock['default'] = {};
                                                                    }
                                                                    newColorSizeStock['default'][size] = parseInt(e.target.value) || 0;
                                                                    setFormData({ ...formData, colorSizeStock: newColorSizeStock });
                                                                }}
                                                                min="0"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="total-stock-display">
                                                    <span className="total-label">Total Stock:</span>
                                                    <span className="total-value">{getTotalStock()}</span>
                                                    <span className="total-units">units</span>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Color-Size Matrix - With Colors */
                                            <div className="matrix-stock-section">
                                                <p className="stock-mode-info">🎨 Color-size matrix mode</p>
                                                <div className="color-size-matrix-wrapper">
                                                    {formData.colors.map(color => (
                                                        <div key={color} className="color-stock-card">
                                                            <div className="color-stock-header">
                                                                <span className="color-name">{color}</span>
                                                                <span className="color-total">
                                                                    {Object.values(formData.colorSizeStock[color] || {}).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0)} units
                                                                </span>
                                                            </div>
                                                            <div className="size-grid">
                                                                {defaultSizes.map(size => (
                                                                    <div key={size} className="size-card">
                                                                        <label className="size-card-label">{size}</label>
                                                                        <input
                                                                            type="number"
                                                                            className="size-card-input"
                                                                            value={formData.colorSizeStock[color]?.[size] || 0}
                                                                            onChange={(e) => {
                                                                                const newColorSizeStock = { ...formData.colorSizeStock };
                                                                                if (!newColorSizeStock[color]) {
                                                                                    newColorSizeStock[color] = {};
                                                                                }
                                                                                newColorSizeStock[color][size] = parseInt(e.target.value) || 0;
                                                                                setFormData({ ...formData, colorSizeStock: newColorSizeStock });
                                                                            }}
                                                                            min="0"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="total-stock-display">
                                                    <span className="total-label">Total Stock:</span>
                                                    <span className="total-value">{getTotalStock()}</span>
                                                    <span className="total-units">units</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Product Image</label>
                                    <div className="image-upload-area">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="image-input"
                                            id="image-upload"
                                        />
                                        <label htmlFor="image-upload" className="image-upload-label">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="image-preview" />
                                            ) : (
                                                <div className="upload-placeholder">
                                                    <p>📷 Click to upload image</p>
                                                    <span>PNG, JPG up to 5MB</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); resetForm(); }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={uploading || getTotalStock() === 0}>
                                        {uploading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Bulk Import Modal */}

                {/* Bulk Image Upload Modal */}
                {showBulkImageUpload && (
                    <div className="modal-backdrop" onClick={() => { setShowBulkImageUpload(false); setBulkImages([]); setImageUploadResult(null); }}>
                        <div className="modal-content bulk-import-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>📤 Bulk Image Upload</h2>
                                <button className="modal-close" onClick={() => { setShowBulkImageUpload(false); setBulkImages([]); setImageUploadResult(null); }}>
                                    ✕
                                </button>
                            </div>

                            <div className="bulk-import-content">
                                <div className="info-section">
                                    <h3>📋 Image Naming Guide:</h3>
                                    <p><strong>Format:</strong> SKU-ImageNumber.jpg or SKU-COLOR-ImageNumber.jpg</p>
                                    <p><strong>Examples:</strong></p>
                                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                                        <li><strong>Simple (No colors):</strong></li>
                                        <li style={{ marginLeft: '1rem' }}><code>001-1.jpg, 001-2.jpg, 001-3.jpg, 001-4.jpg</code> → Product SKU: 001</li>
                                        <li style={{ marginTop: '0.5rem' }}><strong>With Color Variants:</strong></li>
                                        <li style={{ marginLeft: '1rem' }}><code>001-Blue-1.jpg, 001-Blue-2.jpg, 001-Blue-3.jpg, 001-Blue-4.jpg</code></li>
                                        <li style={{ marginLeft: '1rem' }}><code>001-White-1.jpg, 001-White-2.jpg, 001-White-3.jpg, 001-White-4.jpg</code></li>
                                        <li style={{ marginLeft: '1rem' }}><code>001-Black-1.jpg, 001-Black-2.jpg, 001-Black-3.jpg, 001-Black-4.jpg</code></li>
                                        <li style={{ marginTop: '0.5rem' }}><strong>Advanced:</strong></li>
                                        <li style={{ marginLeft: '1rem' }}><code>SHIRT-001-Red-1.jpg, SHIRT-001-Red-2.jpg, ...</code></li>
                                    </ul>
                                    <p style={{ color: '#2563eb', fontWeight: 600 }}>💡 Tip: Upload 4 images per color variant for best results</p>
                                    <p style={{ color: '#dc2626', fontWeight: 600, marginTop: '0.5rem' }}>⚠️ Images will be linked to products during CSV import using the SKU field</p>
                                </div>

                                <div className="upload-section">
                                    <label className="file-upload-label">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleBulkImageSelect}
                                            className="file-input-hidden"
                                        />
                                        <span>📁 Select Images (Multiple)</span>
                                    </label>
                                    {bulkImages.length > 0 && (
                                        <p style={{ marginTop: '1rem', color: '#16a34a', fontWeight: 600 }}>
                                            ✅ {bulkImages.length} images selected
                                        </p>
                                    )}
                                </div>

                                {uploadingImages && (
                                    <div className="progress-section">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${imageUploadProgress}%` }}></div>
                                        </div>
                                        <p>{imageUploadProgress}% Complete</p>
                                    </div>
                                )}

                                <button
                                    className="btn btn-primary btn-full"
                                    onClick={handleBulkImageUpload}
                                    disabled={uploadingImages || bulkImages.length === 0}
                                >
                                    {uploadingImages ? '⏳ Uploading...' : '🚀 Upload Images'}
                                </button>

                                {imageUploadResult && (
                                    <div className={`import-result ${imageUploadResult.success ? 'success' : 'error'}`}>
                                        {imageUploadResult.success ? (
                                            <>
                                                <h4>✅ {imageUploadResult.message}</h4>
                                                {imageUploadResult.skuDetails && (
                                                    <>
                                                        <p><strong>📦 Product Summary:</strong></p>
                                                        <ul className="error-list">
                                                            {imageUploadResult.skuDetails.map((item, i) => (
                                                                <li key={i} style={{ color: item.complete ? '#16a34a' : '#ea580c' }}>
                                                                    {item.complete ? '✅' : '⚠️'} SKU {item.sku} - {item.color}: {item.imageCount}/4 images
                                                                    {!item.complete && ' (Incomplete)'}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        <p style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
                                                            💡 <strong>Next Step:</strong> Go to "Bulk Import" and upload your CSV with the <code>sku</code> column.
                                                            Products will automatically link to these images!
                                                        </p>
                                                    </>
                                                )}
                                                {imageUploadResult.errorCount > 0 && (
                                                    <>
                                                        <p><strong>⚠️ {imageUploadResult.errorCount} errors:</strong></p>
                                                        <ul className="error-list">
                                                            {imageUploadResult.errors.slice(0, 5).map((err, i) => (
                                                                <li key={i}>{err}</li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <h4>❌ Upload Failed</h4>
                                                <p>{imageUploadResult.error}</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showBulkImport && (
                    <div className="modal-backdrop" onClick={() => { setShowBulkImport(false); setCsvData(''); setImportResult(null); }}>
                        <div className="modal-content bulk-import-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>📦 Bulk Import Products</h2>
                                <button className="modal-close" onClick={() => { setShowBulkImport(false); setCsvData(''); setImportResult(null); }}>
                                    ✕
                                </button>
                            </div>

                            <div className="bulk-import-content">
                                <div className="info-section">
                                    <h3>📋 CSV Format Guide:</h3>
                                    <p><strong>Required Columns:</strong> name, description, price, category</p>
                                    <p><strong>Stock Options (choose ONE):</strong></p>
                                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                                        <li><strong>colorSizeStock</strong> - Combined color-size inventory (RECOMMENDED)</li>
                                        <li><strong>colors + sizeStock</strong> - Separate color list and size inventory</li>
                                    </ul>
                                    <p><strong>Optional Columns:</strong> originalPrice, discount, colorStock, images, features, specifications</p>
                                    <p style={{ color: '#dc2626', fontWeight: 600, marginTop: '0.5rem' }}>⚠️ Note: Rating and reviews are NOT included in bulk import - they can only be added by customers.</p>

                                    <div className="format-details">
                                        <h4>Column Formats:</h4>
                                        <ul>
                                            <li><strong>name:</strong> Product name (e.g., Premium White Shirt)</li>
                                            <li><strong>description:</strong> Product description (use quotes if contains commas)</li>
                                            <li><strong>price:</strong> Decimal number (e.g., 59.99)</li>
                                            <li><strong>category:</strong> Product category (shirts, tshirts, jeans, jackets)</li>
                                            <li style={{ background: '#f0f4ff', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                                                <strong>colorSizeStock (RECOMMENDED):</strong> Combined color-size inventory<br />
                                                Format: <code>Color:Size:Qty Size:Qty|Color:Size:Qty Size:Qty</code><br />
                                                Example: <code>"Blue:S:10 M:15 L:20 XL:8|Red:S:8 M:12 L:15 XL:5"</code><br />
                                                <em>This format links each color to its specific size availability</em>
                                            </li>
                                            <li><strong>colors:</strong> Space-separated color names (e.g., White Blue Black Red)</li>
                                            <li><strong>colorStock:</strong> Space-separated color:quantity pairs (e.g., White:30 Blue:25 Black:20)</li>
                                            <li><strong>sizeStock:</strong> Space-separated size:quantity pairs (e.g., XS:5 S:15 M:20 L:10 XL:5)</li>
                                            <li><strong>images:</strong> Pipe-separated URLs (e.g., url1.jpg|url2.jpg|url3.jpg)</li>
                                            <li><strong>features:</strong> Pipe-separated product highlights (e.g., Premium Cotton|Wrinkle Resistant)</li>
                                            <li><strong>specifications:</strong> Pipe-separated key:value pairs (e.g., Material:Cotton|Fit:Regular)</li>
                                            <li><strong>originalPrice:</strong> Original price before discount (e.g., 79.99)</li>
                                            <li><strong>discount:</strong> Discount percentage as integer (e.g., 25 for 25% off)</li>
                                        </ul>
                                    </div>

                                    <button className="btn btn-sm btn-outline" onClick={downloadSample}>
                                        📥 Download Sample CSV
                                    </button>
                                </div>

                                <div className="upload-section">
                                    <label className="file-upload-label">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileUpload}
                                            className="file-input-hidden"
                                        />
                                        <span>📁 Choose CSV File</span>
                                    </label>
                                    <p className="or-text">Or paste CSV data below:</p>
                                    <textarea
                                        className="csv-textarea"
                                        value={csvData}
                                        onChange={(e) => setCsvData(e.target.value)}
                                        placeholder="Paste CSV data here..."
                                        rows="8"
                                    />
                                </div>

                                <button
                                    className="btn btn-primary btn-full"
                                    onClick={handleBulkImport}
                                    disabled={importing || !csvData.trim()}
                                >
                                    {importing ? '⏳ Importing...' : '🚀 Import Products'}
                                </button>

                                {importResult && (
                                    <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
                                        {importResult.success ? (
                                            <>
                                                <h4>✅ {importResult.message}</h4>
                                                {importResult.warnings && (
                                                    <>
                                                        <p><strong>ℹ️ Image Linking Info:</strong></p>
                                                        <ul className="error-list" style={{ color: '#2563eb' }}>
                                                            {importResult.warnings.slice(0, 10).map((warn, i) => (
                                                                <li key={i}>{warn}</li>
                                                            ))}
                                                            {importResult.warnings.length > 10 && (
                                                                <li>... and {importResult.warnings.length - 10} more</li>
                                                            )}
                                                        </ul>
                                                    </>
                                                )}
                                                {importResult.errorCount > 0 && (
                                                    <>
                                                        <p><strong>⚠️ {importResult.errorCount} failed:</strong></p>
                                                        <ul className="error-list">
                                                            {importResult.errors.slice(0, 5).map((err, i) => (
                                                                <li key={i}>{err}</li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <h4>❌ Import Failed</h4>
                                                <p>{importResult.error}</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProducts;
