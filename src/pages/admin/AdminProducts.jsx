import React, { useState, useEffect } from 'react';
import {
    Plus,
    Upload,
    Edit,
    Trash2,
    X,
    Package,
    Search,
    Filter,
    Check,
    AlertCircle,
    FileText,
    Image as ImageIcon,
    Download,
    Minus
} from 'lucide-react';
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories, addCategory } from '../../firebase/firebaseService';
import { useToast } from '../../context/ToastContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../firebase/config';
import '../admin/AdminDashboard.css';
import './AdminProducts.css';

// Initialize Firebase Storage
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const AdminProducts = () => {
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Default sizes for all products
    const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: 'shirts',
        colors: [],
        colorSizeStock: {}, // New: { "Blue": { "S": 10, "M": 15 }, "Red": { "S": 8 } }
        image: ''
    });

    // Manual upload image slots: { color__slotIdx: File | string }
    const [manualImageSlots, setManualImageSlots] = useState({});

    const [imageFile, setImageFile] = useState(null); // Keep for legacy/fallback single image
    const [imagePreview, setImagePreview] = useState('');
    const [newSize, setNewSize] = useState('');
    const [newSizeQty, setNewSizeQty] = useState('');
    const [colorsInput, setColorsInput] = useState('');

    const [categories, setCategories] = useState([
        { name: 'Shirts', value: 'shirts' },
        { name: 'T-Shirts', value: 'tshirts' },
        { name: 'Jeans', value: 'jeans' },
        { name: 'Jackets', value: 'jackets' }
    ]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Bulk import states - NEW WORKFLOW
    const [importStep, setImportStep] = useState(1); // 1: CSV, 2: Images, 3: Assignment, 4: Processing
    const [csvData, setCsvData] = useState('');
    const [parsedProducts, setParsedProducts] = useState([]); // Grouped by handle
    const [uploadedImages, setUploadedImages] = useState([]); // File objects
    const [imageAssignments, setImageAssignments] = useState({}); // { variantKey: [file1, file2, file3, file4] }
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [importProgress, setImportProgress] = useState(0);

    const sampleCSV = `handle,title,category,price,description,size,color,stock
shirt-men,Men Shirt,shirts,1299,Premium cotton shirt,S,Black,4
shirt-men,Men Shirt,shirts,1299,Premium cotton shirt,M,Black,10
shirt-men,Men Shirt,shirts,1299,Premium cotton shirt,M,Blue,6
shirt-men,Men Shirt,shirts,1299,Premium cotton shirt,L,Blue,2
jean-women,Women Jean,jeans,1899,Slim fit denim,28,Black,5
jean-women,Women Jean,jeans,1899,Slim fit denim,30,Black,8
jean-women,Women Jean,jeans,1899,Slim fit denim,30,Blue,3`;

    useEffect(() => {
        loadProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const res = await getCategories();
        if (res.success && res.data.length > 0) {
            setCategories(prev => {
                const existing = new Set(prev.map(c => c.value));
                const newOnes = res.data.filter(c => !existing.has(c.value));
                return [...prev, ...newOnes];
            });
        }
    };

    const handleSaveCategory = async () => {
        if (!newCategoryName.trim()) return;
        const value = newCategoryName.toLowerCase().replace(/\s+/g, '-');

        // Optimistic update
        const newCat = { name: newCategoryName, value };
        setCategories(prev => [...prev, newCat]);
        setFormData({ ...formData, category: value });
        setIsAddingCategory(false);
        setNewCategoryName('');

        // Persist
        await addCategory(newCat);
        toast.showSuccess('New category added!');
    };

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
            // Process and upload all images in manualImageSlots
            const colorImages = {};
            const allSizeStock = formData.colorSizeStock;
            const activeColors = formData.colors.length > 0 ? formData.colors : ['default'];

            // Iterate through active colors and their slots (1-4)
            for (const color of activeColors) {
                const urls = [];
                for (let i = 1; i <= 4; i++) {
                    const slotKey = `${color}__${i}`;
                    const slotValue = manualImageSlots[slotKey];

                    if (slotValue) {
                        if (slotValue instanceof File) {
                            // Upload new file
                            const url = await uploadImage(slotValue);
                            urls.push(url);
                        } else if (typeof slotValue === 'string') {
                            // Existing URL
                            urls.push(slotValue);
                        }
                    }
                }
                if (urls.length > 0) {
                    colorImages[color] = urls;
                }
            }

            // Calculate total stock and get sizes from colorSizeStock
            let totalStock = 0;
            const allSizes = new Set();

            Object.values(allSizeStock).forEach(sizeObj => {
                Object.entries(sizeObj).forEach(([size, qty]) => {
                    totalStock += parseInt(qty) || 0;
                    if (qty > 0) allSizes.add(size);
                });
            });

            // Construct final product data
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                sizes: Array.from(allSizes),
                stock: totalStock,
                colorSizeStock: allSizeStock,
                colorImages: colorImages,
                // Primary image used for thumbnails/display
                image: Object.values(colorImages)[0]?.[0] || '',
                images: Object.values(colorImages)[0] || []
            };

            if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
            } else {
                await addProduct(productData);
            }

            setShowModal(false);
            resetForm();
            loadProducts();
        } catch (error) {
            toast.error(`Error saving product: ${error.message}`);
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

        // Populate manualImageSlots from colorImages or images
        const initialSlots = {};
        if (product.colorImages) {
            Object.entries(product.colorImages).forEach(([color, urls]) => {
                urls.forEach((url, idx) => {
                    if (idx < 4) {
                        initialSlots[`${color}__${idx + 1}`] = url;
                    }
                });
            });
        } else if (product.images) {
            // Fallback for products without color-specific images
            product.images.forEach((url, idx) => {
                if (idx < 4) {
                    initialSlots[`default__${idx + 1}`] = url;
                }
            });
        }
        setManualImageSlots(initialSlots);

        setFormData({
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
            name: '',
            price: '',
            description: '',
            category: 'shirts',
            colors: [],
            colorSizeStock: {},
            image: ''
        });
        setManualImageSlots({});
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

    // ========== NEW BULK IMPORT WORKFLOW ==========

    // Step 1: Parse CSV and group by handle + color
    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csv = event.target.result;
            setCsvData(csv);

            try {
                const parsed = parseCSVToProducts(csv);
                setParsedProducts(parsed);
                setImportStep(2); // Move to image upload
                setImportResult(null);
            } catch (error) {
                setImportResult({ success: false, error: `CSV Parse Error: ${error.message}` });
            }
        };
        reader.readAsText(file);
    };

    const parseCSVToProducts = (csv) => {
        // Remove BOM if present
        const content = csv.startsWith('\uFEFF') ? csv.slice(1) : csv;
        const lines = content.trim().split(/\r?\n/);

        if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');

        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        console.log("CSV Headers:", headers);

        // Required fields
        const required = ['handle', 'title', 'category', 'price', 'size', 'color', 'stock'];
        const missing = required.filter(field => !headers.includes(field));
        if (missing.length > 0) {
            throw new Error(`Missing required columns: ${missing.join(', ')}`);
        }

        // Parse rows
        const rows = [];
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
                    values.push(current.trim().replace(/^"|"$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim().replace(/^"|"$/g, ''));

            const row = {};
            headers.forEach((h, index) => {
                row[h] = values[index] || '';
            });
            rows.push(row);
        }

        // Group by handle, then by color within each handle
        const productGroups = [];
        const handleMap = {};

        rows.forEach(row => {
            if (!row.handle) return;

            if (!handleMap[row.handle]) {
                handleMap[row.handle] = {
                    handle: row.handle,
                    title: row.title,
                    category: row.category,
                    price: row.price,
                    description: row.description || row.title,
                    variants: {} // { color: [sizes] }
                };
                productGroups.push(handleMap[row.handle]);
            }

            const product = handleMap[row.handle];
            const color = row.color || 'Default';

            if (!product.variants[color]) {
                product.variants[color] = [];
            }

            product.variants[color].push({
                size: row.size,
                stock: parseInt(row.stock) || 0
            });
        });

        console.log("Parsed Products:", productGroups);
        return productGroups;
    };

    // Step 2: Handle image upload
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedImages(files);
        setImportStep(3); // Move to assignment
    };

    // Step 3: Image assignment helpers
    const getVariantKey = (handle, color) => `${handle}__${color}`;

    const assignImageToSlot = (variantKey, slotIndex, imageFile) => {
        setImageAssignments(prev => {
            const current = prev[variantKey] || [null, null, null, null];
            const updated = [...current];
            updated[slotIndex] = imageFile;
            return { ...prev, [variantKey]: updated };
        });
    };

    const removeImageFromSlot = (variantKey, slotIndex) => {
        setImageAssignments(prev => {
            const current = prev[variantKey] || [null, null, null, null];
            const updated = [...current];
            updated[slotIndex] = null;
            return { ...prev, [variantKey]: updated };
        });
    };

    const getUnassignedImages = () => {
        const assigned = new Set();
        Object.values(imageAssignments).forEach(slots => {
            slots.forEach(img => {
                if (img) assigned.add(img);
            });
        });
        return uploadedImages.filter(img => !assigned.has(img));
    };

    const validateAssignments = () => {
        const errors = [];
        parsedProducts.forEach(product => {
            Object.keys(product.variants).forEach(color => {
                const key = getVariantKey(product.handle, color);
                const slots = imageAssignments[key] || [];
                const filledSlots = slots.filter(s => s !== null).length;
                if (filledSlots === 0) {
                    errors.push(`${product.title} - ${color}: No images assigned`);
                }
            });
        });
        return errors;
    };

    // Step 4: Process and create products
    const handleCreateProducts = async () => {
        const errors = validateAssignments();
        if (errors.length > 0) {
            setImportResult({
                success: false,
                error: 'Please assign images to all variants',
                errors
            });
            return;
        }

        setImportStep(4); // Processing
        setImporting(true);
        setImportProgress(0);

        try {
            let successCount = 0;
            let errorCount = 0;
            const errorDetails = [];

            for (let i = 0; i < parsedProducts.length; i++) {
                const product = parsedProducts[i];

                try {
                    // Upload images and build product data
                    const colorSizeStock = {};
                    const colorImages = {};
                    const allSizes = new Set();

                    for (const [color, sizeData] of Object.entries(product.variants)) {
                        const variantKey = getVariantKey(product.handle, color);
                        const imageSlots = imageAssignments[variantKey] || [];

                        // Upload images for this color
                        const imageUrls = [];
                        for (let j = 0; j < imageSlots.length; j++) {
                            const file = imageSlots[j];
                            if (file) {
                                const filename = `${Date.now()}_${product.handle}_${color}_${j + 1}.jpg`;
                                const storageRef = ref(storage, `products/${filename}`);
                                await uploadBytes(storageRef, file);
                                const url = await getDownloadURL(storageRef);
                                imageUrls.push(url);
                            }
                        }

                        colorImages[color] = imageUrls;

                        // Build stock data
                        colorSizeStock[color] = {};
                        sizeData.forEach(({ size, stock }) => {
                            colorSizeStock[color][size] = stock;
                            allSizes.add(size);
                        });
                    }

                    // Create product
                    const productData = {
                        name: product.title,
                        category: product.category.toLowerCase(),
                        price: parseFloat(product.price),
                        description: product.description,
                        colors: Object.keys(colorSizeStock),
                        sizes: Array.from(allSizes),
                        colorSizeStock,
                        colorImages,
                        image: Object.values(colorImages)[0]?.[0] || '',
                        images: Object.values(colorImages)[0] || [],
                        stock: Object.values(colorSizeStock).reduce((acc, sizes) =>
                            acc + Object.values(sizes).reduce((s, q) => s + q, 0), 0
                        ),
                        rating: 0,
                        reviewCount: 0,
                        createdAt: new Date().toISOString()
                    };

                    await addProduct(productData);
                    successCount++;
                } catch (err) {
                    errorCount++;
                    errorDetails.push(`${product.title}: ${err.message}`);
                }

                setImportProgress(Math.round(((i + 1) / parsedProducts.length) * 100));
            }

            setImportResult({
                success: successCount > 0,
                message: `Created ${successCount} products successfully`,
                successCount,
                errorCount,
                errors: errorCount > 0 ? errorDetails : null
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

    // Reset workflow
    const resetBulkImport = () => {
        setImportStep(1);
        setCsvData('');
        setParsedProducts([]);
        setUploadedImages([]);
        setImageAssignments({});
        setImportResult(null);
        setImportProgress(0);
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
        <div className="admin-page-content">
            <div className="page-header">
                <div>
                    <h1>Products</h1>
                    <p className="subtitle">Manage your inventory and products</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={() => setShowBulkImport(true)}>
                        <Upload size={18} /> Bulk Import
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Add Product
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading products...</p>
                </div>
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
                                    <td colSpan="6" className="no-data">
                                        <Package size={48} className="text-muted mb-2" />
                                        <p>No products found. Add your first product!</p>
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
                                                    <div className="image-placeholder">
                                                        <ImageIcon size={20} className="text-muted" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="font-medium">{product.name}</td>
                                        <td><span className="badge badge-primary">{product.category}</span></td>
                                        <td className="font-mono">₹{product.price}</td>
                                        <td>
                                            <span className={`status-text ${product.stock < 10 ? 'text-danger' : 'text-success'}`}>
                                                {product.stock || 0} units
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon btn-edit" onClick={() => handleEdit(product)} title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="btn-icon btn-delete" onClick={() => handleDelete(product.id)} title="Delete">
                                                    <Trash2 size={16} />
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
                            <button className="btn-icon-small" onClick={() => { setShowModal(false); resetForm(); }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="product-form">
                            <div className="form-row three-col-layout">
                                <div className="form-group" style={{ flex: '2' }}>
                                    <label className="form-label">Product Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Premium Cotton Shirt"
                                    />
                                </div>

                                <div className="form-group" style={{ flex: '1' }}>
                                    <label className="form-label">Category *</label>
                                    {isAddingCategory ? (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="New Category Name"
                                                autoFocus
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                type="button"
                                                className="btn-icon-small"
                                                onClick={handleSaveCategory}
                                                style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
                                                title="Save Category"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-icon-small"
                                                onClick={() => setIsAddingCategory(false)}
                                                style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                                                title="Cancel"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            name="category"
                                            className="form-select"
                                            value={formData.category}
                                            onChange={(e) => {
                                                if (e.target.value === '_add_new_') {
                                                    setIsAddingCategory(true);
                                                    setNewCategoryName('');
                                                } else {
                                                    handleChange(e);
                                                }
                                            }}
                                            required
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.name}</option>
                                            ))}
                                            <option value="_add_new_" style={{ fontWeight: 'bold', color: 'var(--admin-primary)' }}>+ Add New Category</option>
                                        </select>
                                    )}
                                </div>

                                <div className="form-group" style={{ flex: '1' }}>
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
                                        placeholder="0.00"
                                    />
                                </div>
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
                                                        {isSelected && <span className="check-icon"><Check size={12} /></span>}
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
                                                            <X size={12} />
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
                                            <p className="stock-mode-info"><Package size={16} /> Simple stock mode (no color variants)</p>
                                            <div className="size-grid-simple">
                                                {defaultSizes.map(size => (
                                                    <div key={size} className="size-card">
                                                        <label className="size-card-label">{size}</label>
                                                        <div className="qty-control">
                                                            <button
                                                                type="button"
                                                                className="qty-btn"
                                                                onClick={() => {
                                                                    const currentVal = formData.colorSizeStock['default']?.[size] || 0;
                                                                    const newVal = Math.max(0, currentVal - 1);
                                                                    const newColorSizeStock = { ...formData.colorSizeStock };
                                                                    if (!newColorSizeStock['default']) newColorSizeStock['default'] = {};
                                                                    newColorSizeStock['default'][size] = newVal;
                                                                    setFormData({ ...formData, colorSizeStock: newColorSizeStock });
                                                                }}
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                className="size-card-input"
                                                                value={formData.colorSizeStock['default']?.[size] || 0}
                                                                onChange={(e) => {
                                                                    const newColorSizeStock = { ...formData.colorSizeStock };
                                                                    if (!newColorSizeStock['default']) newColorSizeStock['default'] = {};
                                                                    newColorSizeStock['default'][size] = parseInt(e.target.value) || 0;
                                                                    setFormData({ ...formData, colorSizeStock: newColorSizeStock });
                                                                }}
                                                                min="0"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="qty-btn"
                                                                onClick={() => {
                                                                    const currentVal = formData.colorSizeStock['default']?.[size] || 0;
                                                                    const newVal = currentVal + 1;
                                                                    const newColorSizeStock = { ...formData.colorSizeStock };
                                                                    if (!newColorSizeStock['default']) newColorSizeStock['default'] = {};
                                                                    newColorSizeStock['default'][size] = newVal;
                                                                    setFormData({ ...formData, colorSizeStock: newColorSizeStock });
                                                                }}
                                                            >
                                                                <Plus size={14} />
                                                            </button>
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
                                    ) : (
                                        /* Color-Size Matrix - With Colors */
                                        <div className="matrix-stock-section">
                                            <p className="stock-mode-info"><Package size={16} /> Color-size matrix mode</p>
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
                                                                    <div className="qty-control">
                                                                        <button
                                                                            type="button"
                                                                            className="qty-btn"
                                                                            onClick={() => {
                                                                                const currentVal = formData.colorSizeStock[color]?.[size] || 0;
                                                                                const newVal = Math.max(0, currentVal - 1);
                                                                                const newColorSizeStock = { ...formData.colorSizeStock };
                                                                                if (!newColorSizeStock[color]) newColorSizeStock[color] = {};
                                                                                newColorSizeStock[color][size] = newVal;
                                                                                setFormData({ ...formData, colorSizeStock: newColorSizeStock });
                                                                            }}
                                                                        >
                                                                            <Minus size={14} />
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            className="size-card-input"
                                                                            value={formData.colorSizeStock[color]?.[size] || 0}
                                                                            onChange={(e) => {
                                                                                const newColorSizeStock = { ...formData.colorSizeStock };
                                                                                if (!newColorSizeStock[color]) newColorSizeStock[color] = {};
                                                                                newColorSizeStock[color][size] = parseInt(e.target.value) || 0;
                                                                                setFormData({ ...formData, colorSizeStock: newColorSizeStock });
                                                                            }}
                                                                            min="0"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            className="qty-btn"
                                                                            onClick={() => {
                                                                                const currentVal = formData.colorSizeStock[color]?.[size] || 0;
                                                                                const newVal = currentVal + 1;
                                                                                const newColorSizeStock = { ...formData.colorSizeStock };
                                                                                if (!newColorSizeStock[color]) newColorSizeStock[color] = {};
                                                                                newColorSizeStock[color][size] = newVal;
                                                                                setFormData({ ...formData, colorSizeStock: newColorSizeStock });
                                                                            }}
                                                                        >
                                                                            <Plus size={14} />
                                                                        </button>
                                                                    </div>
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
                                <label className="form-label">Variant Images (Max 4 per color)</label>
                                <div className="variant-images-management">
                                    {(formData.colors.length > 0 ? formData.colors : ['default']).map(color => (
                                        <div key={color} className="color-image-group">
                                            <label className="color-group-label">{color === 'default' ? 'Default Images' : `${color} Images`}</label>
                                            <div className="image-slots-grid">
                                                {[1, 2, 3, 4].map(slotIdx => {
                                                    const slotKey = `${color}__${slotIdx}`;
                                                    const slotValue = manualImageSlots[slotKey];
                                                    const previewUrl = slotValue instanceof File ? URL.createObjectURL(slotValue) : slotValue;

                                                    return (
                                                        <div key={slotIdx} className="image-slot">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        setManualImageSlots(prev => ({
                                                                            ...prev,
                                                                            [slotKey]: file
                                                                        }));
                                                                    }
                                                                }}
                                                                className="slot-input-hidden"
                                                                id={`manual-slot-${slotKey}`}
                                                            />
                                                            <label htmlFor={`manual-slot-${slotKey}`} className="slot-upload-btn">
                                                                {previewUrl ? (
                                                                    <div className="slot-preview-wrapper">
                                                                        <img src={previewUrl} alt="Preview" className="slot-img-preview" />
                                                                        <button
                                                                            type="button"
                                                                            className="remove-slot-img"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                const newSlots = { ...manualImageSlots };
                                                                                delete newSlots[slotKey];
                                                                                setManualImageSlots(newSlots);
                                                                            }}
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="slot-placeholder">
                                                                        <Plus size={16} />
                                                                    </div>
                                                                )}
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
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
                <div className="modal-backdrop" onClick={() => { setShowBulkImport(false); resetBulkImport(); }}>
                    <div className="modal-content bulk-import-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h2> Bulk Import Products - Step {importStep} of 4</h2>
                            <button className="btn-icon-small" onClick={() => { setShowBulkImport(false); resetBulkImport(); }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bulk-import-content">
                            {/* Step 1: CSV Upload */}
                            {importStep === 1 && (
                                <>
                                    <div className="info-section">
                                        <h3><FileText size={18} /> Step 1: Upload Product CSV</h3>
                                        <p>Upload a CSV file with your product data. Required columns:</p>
                                        <code className="code-block">
                                            handle, title, category, price, size, color, stock
                                        </code>
                                        <button className="btn btn-sm btn-outline mt-2" onClick={downloadSample}>
                                            <Download size={14} /> Download Sample CSV
                                        </button>
                                    </div>

                                    <div className="upload-section mt-4">
                                        <label className="file-upload-label">
                                            <input
                                                type="file"
                                                accept=".csv"
                                                onChange={handleCSVUpload}
                                                className="file-input-hidden"
                                            />
                                            <span><FileText size={18} /> Choose CSV File</span>
                                        </label>
                                    </div>

                                    {csvData && parsedProducts.length > 0 && (
                                        <div className="success-box">
                                            <h4><Check size={16} /> CSV Loaded Successfully</h4>
                                            <p className="my-2">
                                                Found <strong>{parsedProducts.length} products</strong> with{' '}
                                                <strong>{parsedProducts.reduce((acc, p) => acc + Object.keys(p.variants).length, 0)} variants</strong>
                                            </p>
                                            <div className="csv-preview">
                                                {parsedProducts.map((product, i) => (
                                                    <div key={i} className="csv-preview-item">
                                                        <strong>{product.title}</strong> ({product.category}) - ₹{product.price}
                                                        <div className="text-secondary text-sm ml-4">
                                                            Colors: {Object.keys(product.variants).join(', ')}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {importResult && !importResult.success && (
                                        <div className="import-result error mt-4">
                                            <h4><AlertCircle size={16} /> Error</h4>
                                            <p>{importResult.error}</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Step 2: Image Upload */}
                            {importStep === 2 && (
                                <>
                                    <div className="info-section">
                                        <h3><ImageIcon size={18} /> Step 2: Upload Product Images</h3>
                                        <p>Upload all product images. You can select multiple files at once.</p>
                                        <p className="text-sm text-secondary">
                                            Tip: Upload at least 4 images per color variant for best results.
                                        </p>
                                    </div>

                                    <div className="upload-section mt-4">
                                        <label className="file-upload-label">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                                className="file-input-hidden"
                                            />
                                            <span><Upload size={18} /> Select Images (Multiple)</span>
                                        </label>
                                    </div>

                                    {uploadedImages.length > 0 && (
                                        <div className="mt-4">
                                            <p className="font-bold mb-2"><Check size={16} className="text-success" /> {uploadedImages.length} images uploaded</p>
                                            <button
                                                className="btn btn-outline"
                                                onClick={() => setImportStep(1)}
                                                style={{ marginRight: '10px' }}
                                            >
                                                Back to CSV
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Step 3: Image Assignment */}
                            {importStep === 3 && (
                                <>
                                    <div className="info-section">
                                        <h3>Step 3: Assign Images to Variants</h3>
                                        <p>Click on a slot to assign an image from the pool below.</p>
                                    </div>

                                    <div className="assignment-area">
                                        {parsedProducts.map((product) => (
                                            <div key={product.handle} className="assignment-product-card">
                                                <h4>{product.title}</h4>

                                                {Object.keys(product.variants).map((color) => {
                                                    const variantKey = getVariantKey(product.handle, color);
                                                    const slots = imageAssignments[variantKey] || [null, null, null, null];

                                                    return (
                                                        <div key={color} className="assignment-variant-group">
                                                            <div className="variant-label">
                                                                {color} - {product.variants[color].map(s => s.size).join(', ')}
                                                            </div>

                                                            <div className="assignment-slots">
                                                                {slots.map((assignedImg, slotIdx) => (
                                                                    <div
                                                                        key={slotIdx}
                                                                        className={`assignment-slot ${assignedImg ? 'filled' : 'empty'}`}
                                                                        onClick={() => {
                                                                            if (!assignedImg) {
                                                                                const unassigned = getUnassignedImages();
                                                                                if (unassigned.length > 0) {
                                                                                    assignImageToSlot(variantKey, slotIdx, unassigned[0]);
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        {assignedImg ? (
                                                                            <>
                                                                                <img
                                                                                    src={URL.createObjectURL(assignedImg)}
                                                                                    alt={`Slot ${slotIdx + 1}`}
                                                                                />
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        removeImageFromSlot(variantKey, slotIdx);
                                                                                    }}
                                                                                    className="remove-assignment-btn"
                                                                                >
                                                                                    <X size={12} />
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <div className="empty-slot-content">
                                                                                <Plus size={16} />
                                                                                <span>{slotIdx + 1}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Unassigned Images Pool */}
                                    <div className="unassigned-pool">
                                        <h4>Available Images ({getUnassignedImages().length})</h4>
                                        <div className="pool-grid">
                                            {getUnassignedImages().map((img, idx) => (
                                                <div key={idx} className="pool-item">
                                                    <img
                                                        src={URL.createObjectURL(img)}
                                                        alt={img.name}
                                                        title={img.name}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="modal-actions">
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => setImportStep(2)}
                                        >
                                            Back
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleCreateProducts}
                                            disabled={importing}
                                        >
                                            <Check size={18} /> Create Products
                                        </button>
                                    </div>

                                    {importResult && !importResult.success && (
                                        <div className="import-result error mt-4">
                                            <h4><AlertCircle size={16} /> Error</h4>
                                            <p>{importResult.error}</p>
                                            {importResult.errors && (
                                                <ul className="error-list">
                                                    {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Step 4: Processing */}
                            {importStep === 4 && (
                                <>
                                    <div className="info-section">
                                        <h3>Processing...</h3>
                                        <p>Uploading images and creating products...</p>
                                    </div>

                                    <div className="mt-4">
                                        <div className="progress-bar-container">
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${importProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-center mt-2 font-bold">{importProgress}%</p>
                                    </div>

                                    {importResult && (
                                        <div className={`import-result ${importResult.success ? 'success' : 'error'} mt-4`}>
                                            {importResult.success ? (
                                                <>
                                                    <h4><Check size={16} /> {importResult.message}</h4>
                                                    <p>Products created successfully!</p>
                                                    <div className="modal-actions">
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => { setShowBulkImport(false); resetBulkImport(); }}
                                                        >
                                                            Close
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <h4><AlertCircle size={16} /> Import Failed</h4>
                                                    <p>{importResult.error}</p>
                                                    {importResult.errors && (
                                                        <ul className="error-list">
                                                            {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                                        </ul>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
