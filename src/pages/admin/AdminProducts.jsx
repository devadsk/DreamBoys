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
    const [importFolderFiles, setImportFolderFiles] = useState([]); // Array of files from folder upload

    const sampleCSV = `handle,title,category,sku,size,color,price,stock,image1,image2,image3,image4
shirt-men,Men Shirt,Shirt,SHIRT-S-BLACK,S,Black,1299,4,products/shirt/SHIRT-S-BLACK-1.jpg,products/shirt/SHIRT-S-BLACK-2.jpg,products/shirt/SHIRT-S-BLACK-3.jpg,products/shirt/SHIRT-S-BLACK-4.jpg
shirt-men,Men Shirt,Shirt,SHIRT-M-BLACK,M,Black,1299,10,products/shirt/SHIRT-M-BLACK-1.jpg,products/shirt/SHIRT-M-BLACK-2.jpg,products/shirt/SHIRT-M-BLACK-3.jpg,products/shirt/SHIRT-M-BLACK-4.jpg
shirt-men,Men Shirt,Shirt,SHIRT-M-BLUE,M,Blue,1299,6,products/shirt/SHIRT-M-BLUE-1.jpg,products/shirt/SHIRT-M-BLUE-2.jpg,products/shirt/SHIRT-M-BLUE-3.jpg,products/shirt/SHIRT-M-BLUE-4.jpg
shirt-men,Men Shirt,Shirt,SHIRT-L-BLUE,L,Blue,1299,2,products/shirt/SHIRT-L-BLUE-1.jpg,products/shirt/SHIRT-L-BLUE-2.jpg,products/shirt/SHIRT-L-BLUE-3.jpg,products/shirt/SHIRT-L-BLUE-4.jpg`;

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

    // Folder Helper
    const handleFolderSelect = (e) => {
        const files = Array.from(e.target.files);
        setImportFolderFiles(files);
    };

    // Helper to upload a single file
    const uploadSingleImage = async (file) => {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
    };

    // CSV Parser for New Format
    const parseNewCSV = (csv) => {
        // Remove BOM if present
        const content = csv.startsWith('\uFEFF') ? csv.slice(1) : csv;
        const lines = content.trim().split(/\r?\n/);

        // Header: handle,title,category,sku,size,color,price,stock,image1,image2,image3,image4
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        console.log("CSV Headers found:", headers);

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = [];
            let current = '';
            let inQuotes = false;
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes from values too
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim().replace(/^"|"$/g, ''));

            const row = {};
            headers.forEach((h, index) => {
                row[h] = values[index];
            });
            data.push(row);
        }
        return data;
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
        console.log("Starting Bulk Import...");
        console.log("CSV Data Length:", csvData ? csvData.length : 0);
        console.log("Files Selected:", importFolderFiles.length);

        if (!csvData.trim()) {
            console.error("CSV Data is empty");
            setImportResult({ success: false, error: 'Please upload a CSV file' });
            return;
        }

        if (importFolderFiles.length === 0) {
            console.error("No files in folder");
            setImportResult({ success: false, error: 'Please upload the products folder containing images' });
            return;
        }

        setImporting(true);
        setImportResult(null);

        try {
            console.log("Parsing CSV...");
            const rows = parseNewCSV(csvData);
            console.log("Parsed Rows:", rows.length, rows);

            // Group rows by 'handle' (Product)
            const groups = {};
            rows.forEach(row => {
                if (!row.handle) return;
                if (!groups[row.handle]) groups[row.handle] = [];
                groups[row.handle].push(row);
            });

            console.log("Product Groups:", Object.keys(groups));

            let successCount = 0;
            let errorCount = 0;
            const errors = [];
            const warnings = [];

            // Map relative path -> File object for quick lookup
            // normalize path: replace backslashes (if any) with forward slashes
            const fileMap = new Map();
            importFolderFiles.forEach(file => {
                const normalizedPath = file.webkitRelativePath.replace(/\\/g, '/');
                fileMap.set(normalizedPath, file);
                // Also map just the filename in case user uploaded flat structure or path mismatch
                fileMap.set(file.name, file);
            });
            console.log("File Map Size:", fileMap.size);

            for (const handle of Object.keys(groups)) {
                try {
                    const productRows = groups[handle];
                    const first = productRows[0];

                    // Process Variants & Stock
                    const colorSizeStock = {};
                    const colorImages = {};
                    const allSizes = new Set();

                    // Iterate variants
                    // We need to async upload images here

                    // We track which colors we've already processed images for to avoid duplicates
                    const processedColorsForImages = new Set();

                    for (const row of productRows) {
                        const color = row.color || 'Default';
                        const size = row.size;
                        const stock = parseInt(row.stock) || 0;

                        // Stock Logic
                        if (!colorSizeStock[color]) colorSizeStock[color] = {};
                        colorSizeStock[color][size] = stock;
                        allSizes.add(size);

                        // Image Logic
                        // Only upload images for a color once (assuming all rows for same color have same images)
                        if (!processedColorsForImages.has(color)) {
                            // Extract image columns
                            // Support up to 4 images
                            const imagePaths = [row.image1, row.image2, row.image3, row.image4].filter(p => p && p.trim());

                            const imageUrls = [];

                            for (const path of imagePaths) {
                                // Try to find the file
                                // The CSV path: "products/shirt/SHIRT-S-BLACK-1.jpg"
                                // The file.webkitRelativePath: "products/shirt/SHIRT-S-BLACK-1.jpg" (if "products" folder uploaded)

                                // We try exact match first
                                let file = fileMap.get(path.trim());
                                // If not found, try to match by filename if path structure differs
                                if (!file) {
                                    const filename = path.split('/').pop();
                                    file = fileMap.get(filename);
                                }

                                if (file) {
                                    const url = await uploadSingleImage(file);
                                    imageUrls.push(url);
                                } else {
                                    warnings.push(`${handle}: Image not found: ${path}`);
                                }
                            }

                            if (imageUrls.length > 0) {
                                colorImages[color] = imageUrls;
                                processedColorsForImages.add(color);
                            }
                        }
                    }

                    // Constuct Product Data
                    // Assume 'title', 'category', 'price' are consistent across rows for the handle
                    const productData = {
                        name: first.title,
                        category: first.category ? first.category.toLowerCase() : 'other',
                        price: parseFloat(first.price) || 0,
                        description: first.title, // Default description to title as it's not in CSV
                        colors: Object.keys(colorSizeStock),
                        sizes: Array.from(allSizes),
                        colorSizeStock,
                        colorImages,
                        stock: Object.values(colorSizeStock).reduce((acc, sizes) =>
                            acc + Object.values(sizes).reduce((s, q) => s + q, 0), 0
                        ),
                        // Primary image
                        image: Object.values(colorImages)[0]?.[0] || '',
                        images: Object.values(colorImages)[0] || [], // Default images
                        rating: 0,
                        reviewCount: 0,
                        createdAt: new Date().toISOString()
                    };

                    await addProduct(productData);
                    successCount++;

                } catch (err) {
                    console.error(`Error processing product ${handle}:`, err);
                    errorCount++;
                    errors.push(`${handle}: ${err.message}`);
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
            console.error("Bulk Import Fatal Error:", error);
            setImportResult({ success: false, error: error.message || "Unknown error occurred" });
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



    return (
        <div className="admin-dashboard">
            <div className="container">
                <div className="admin-header">
                    <h1>Manage Products</h1>
                    <div className="header-actions">
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



                {showBulkImport && (
                    <div className="modal-backdrop" onClick={() => { setShowBulkImport(false); setCsvData(''); setImportResult(null); setImportFolderFiles([]); }}>
                        <div className="modal-content bulk-import-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>📦 Bulk Import Products</h2>
                                <button className="modal-close" onClick={() => { setShowBulkImport(false); setCsvData(''); setImportResult(null); setImportFolderFiles([]); }}>
                                    ✕
                                </button>
                            </div>

                            <div className="bulk-import-content">
                                <div className="info-section">
                                    <h3>📋 Instructions:</h3>
                                    <ol style={{ marginLeft: '1.5rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                                        <li>Prepare your CSV file with columns: <code>handle, title, category, sku, size, color, price, stock, image1, image2...</code></li>
                                        <li>Prepare a folder containing all your product images.</li>
                                        <li>Ensure image paths in CSV match the files in the folder (e.g., <code>products/shirt/img1.jpg</code>).</li>
                                    </ol>

                                    <button className="btn btn-sm btn-outline" onClick={downloadSample}>
                                        📥 Download Sample CSV
                                    </button>
                                </div>

                                <div className="upload-section">
                                    {/* 1. CSV Upload */}
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label className="form-label">1. Upload CSV File</label>
                                        <label className="file-upload-label">
                                            <input
                                                type="file"
                                                accept=".csv"
                                                onChange={handleFileUpload}
                                                className="file-input-hidden"
                                            />
                                            <span>
                                                {csvData ? '✅ CSV Loaded' : '📄 Choose CSV File'}
                                            </span>
                                        </label>
                                    </div>

                                    {/* 2. Folder Upload */}
                                    <div className="form-group">
                                        <label className="form-label">2. Upload Images Folder</label>
                                        <label className="file-upload-label">
                                            <input
                                                type="file"
                                                webkitdirectory=""
                                                directory=""
                                                multiple
                                                onChange={handleFolderSelect}
                                                className="file-input-hidden"
                                            />
                                            <span>
                                                {importFolderFiles.length > 0
                                                    ? `✅ ${importFolderFiles.length} files selected`
                                                    : '📁 Choose Images Folder'}
                                            </span>
                                        </label>
                                    </div>

                                </div>

                                <button
                                    className="btn btn-primary btn-full"
                                    onClick={handleBulkImport}
                                    disabled={importing || !csvData.trim() || importFolderFiles.length === 0}
                                    style={{ marginTop: '1.5rem' }}
                                >
                                    {importing ? '⏳ Importing & Uploading...' : '🚀 Start Import'}
                                </button>

                                {importResult && (
                                    <div className={`import-result ${importResult.success ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
                                        {importResult.success ? (
                                            <>
                                                <h4>✅ {importResult.message}</h4>
                                                {importResult.warnings && (
                                                    <ul className="error-list" style={{ color: '#ea580c' }}>
                                                        {importResult.warnings.map((warn, i) => <li key={i}>⚠️ {warn}</li>)}
                                                    </ul>
                                                )}
                                                {importResult.errorCount > 0 && (
                                                    <ul className="error-list">
                                                        {importResult.errors.map((err, i) => <li key={i}>❌ {err}</li>)}
                                                    </ul>
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
