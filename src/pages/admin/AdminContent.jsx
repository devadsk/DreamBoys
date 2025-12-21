import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getTestimonials,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
    getCategories,
    updateCategory,
    deleteCategory
} from '../../firebase/firebaseService';
import './AdminContent.css';

const AdminContent = () => {
    const [activeTab, setActiveTab] = useState('testimonials');
    const [testimonials, setTestimonials] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        if (activeTab === 'testimonials') {
            const result = await getTestimonials();
            if (result.success) {
                setTestimonials(result.data);
            }
        } else {
            const result = await getCategories();
            if (result.success) {
                setCategories(result.data);
            }
        }
        setLoading(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (activeTab === 'testimonials') {
                if (editingItem) {
                    const result = await updateTestimonial(editingItem.id, formData);
                    if (result.success) {
                        alert('Testimonial updated successfully!');
                    } else {
                        alert('Error updating testimonial: ' + result.error);
                        return;
                    }
                } else {
                    const result = await addTestimonial(formData);
                    if (result.success) {
                        alert('Testimonial added successfully!');
                    } else {
                        alert('Error adding testimonial: ' + result.error);
                        return;
                    }
                }
            } else {
                if (editingItem) {
                    const result = await updateCategory(editingItem.id, formData);
                    if (result.success) {
                        alert('Category updated successfully!');
                    } else {
                        alert('Error updating category: ' + result.error);
                        return;
                    }
                }
            }

            setShowModal(false);
            setEditingItem(null);
            setFormData({});
            loadData();
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            alert('An error occurred: ' + error.message);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            ...item,
            originalImage: item.image // Store original image/emoji for restoration
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            if (activeTab === 'testimonials') {
                await deleteTestimonial(id);
            } else {
                await deleteCategory(id);
            }
            loadData();
        }
    };

    const handleToggleVisibility = async (category) => {
        const newVisibility = category.visible === undefined ? false : !category.visible;
        await updateCategory(category.id, { ...category, visible: newVisibility });
        loadData();
    };

    const openAddModal = () => {
        if (activeTab === 'testimonials') {
            setEditingItem(null);
            setFormData({ name: '', role: '', text: '', rating: 5 });
            setShowModal(true);
        }
    };

    return (
        <div className="admin-content-page">
            <div className="admin-content-header">
                <h1>Content Management</h1>
                <p>Manage testimonials and product categories</p>
            </div>

            <div className="content-tabs">
                <button
                    className={`tab-btn ${activeTab === 'testimonials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('testimonials')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Testimonials
                </button>
                <button
                    className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Categories
                </button>
            </div>

            {activeTab === 'testimonials' && (
                <div className="content-actions">
                    <button className="btn-add-content" onClick={openAddModal}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Testimonial
                    </button>
                </div>
            )}

            {loading ? (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                </div>
            ) : (
                <div className="content-grid">
                    {activeTab === 'testimonials' ? (
                        testimonials.length > 0 ? testimonials.map((testimonial) => (
                            <motion.div
                                key={testimonial.id}
                                className="content-card testimonial-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="testimonial-header">
                                    <div className="testimonial-author">
                                        <div className="author-avatar">{testimonial.name?.charAt(0)}</div>
                                        <div>
                                            <h3>{testimonial.name}</h3>
                                            <p>{testimonial.role}</p>
                                        </div>
                                    </div>
                                    <div className="testimonial-rating">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <span key={i}>⭐</span>
                                        ))}
                                    </div>
                                </div>
                                <p className="testimonial-text">"{testimonial.text}"</p>
                                <div className="card-actions">
                                    <button onClick={() => handleEdit(testimonial)} className="btn-edit">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(testimonial.id)} className="btn-delete">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="empty-state">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                <h3>No testimonials yet</h3>
                                <p>Add your first testimonial to get started</p>
                            </div>
                        )
                    ) : (
                        categories.length > 0 ? categories.map((category) => (
                            <motion.div
                                key={category.id}
                                className="content-card category-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="category-preview" style={{ background: category.color }}>
                                    {category.image?.startsWith('data:') || category.image?.startsWith('http') ? (
                                        <img src={category.image} alt={category.name} />
                                    ) : (
                                        <div className="category-emoji">{category.image}</div>
                                    )}
                                </div>
                                <div className="category-info">
                                    <h3>{category.name}</h3>
                                    <p className="category-link">{category.link}</p>
                                    <p className="category-visibility">
                                        {category.visible !== false ? '✅ Visible on home page' : '❌ Hidden from home page'}
                                    </p>
                                </div>
                                <div className="card-actions">
                                    <button onClick={() => handleEdit(category)} className="btn-edit">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button onClick={() => handleToggleVisibility(category)} className="btn-toggle">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            {category.visible !== false ? (
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            ) : (
                                                <>
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </>
                                            )}
                                        </svg>
                                        {category.visible !== false ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="empty-state">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                </svg>
                                <h3>No categories in database</h3>
                                <p>Categories need to be added to the database first</p>
                            </div>
                        )
                    )}
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>{editingItem ? 'Edit' : 'Add'} {activeTab === 'testimonials' ? 'Testimonial' : 'Category'}</h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                {activeTab === 'testimonials' ? (
                                    <>
                                        <div className="form-group">
                                            <label>Customer Name</label>
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                placeholder="Enter customer name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Role/Title</label>
                                            <input
                                                type="text"
                                                value={formData.role || ''}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                required
                                                placeholder="e.g., Fashion Enthusiast"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Testimonial Text</label>
                                            <textarea
                                                value={formData.text || ''}
                                                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                                required
                                                rows="4"
                                                placeholder="Enter testimonial text"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Rating</label>
                                            <select
                                                value={formData.rating || 5}
                                                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                            >
                                                <option value="5">5 Stars</option>
                                                <option value="4">4 Stars</option>
                                                <option value="3">3 Stars</option>
                                                <option value="2">2 Stars</option>
                                                <option value="1">1 Star</option>
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label>Category Name</label>
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                placeholder="e.g., Premium Shirts"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Category Link</label>
                                            <input
                                                type="text"
                                                value={formData.link || ''}
                                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                                required
                                                placeholder="/products?category=shirts"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Color</label>
                                            <div className="color-picker-group">
                                                <input
                                                    type="color"
                                                    value={formData.color || '#667eea'}
                                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.color || '#667eea'}
                                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                    placeholder="#667eea"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Category Image</label>
                                            <div className="image-upload-area">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    id="image-upload"
                                                />
                                                <label htmlFor="image-upload" className="upload-label">
                                                    {formData.image ? (
                                                        formData.image.startsWith('data:') || formData.image.startsWith('http') ? (
                                                            <div className="image-preview-container">
                                                                <img src={formData.image} alt="Preview" className="image-preview" />
                                                                <button
                                                                    type="button"
                                                                    className="btn-delete-image"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        // Restore original emoji if it exists and wasn't an image
                                                                        const originalEmoji = formData.originalImage &&
                                                                            !formData.originalImage.startsWith('data:') &&
                                                                            !formData.originalImage.startsWith('http')
                                                                            ? formData.originalImage
                                                                            : '📦'; // Default emoji if no original
                                                                        setFormData({ ...formData, image: originalEmoji });
                                                                    }}
                                                                    title="Delete image and restore emoji"
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="3 6 5 6 21 6" />
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="emoji-preview">{formData.image}</div>
                                                        )
                                                    ) : (
                                                        <div className="upload-placeholder">
                                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                                <polyline points="21 15 16 10 5 21" />
                                                            </svg>
                                                            <p>Click to upload image</p>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                            <p className="form-hint">Or use an emoji instead of uploading an image</p>
                                            <input
                                                type="text"
                                                value={formData.image?.startsWith('data:') || formData.image?.startsWith('http') ? '' : formData.image || ''}
                                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                placeholder="👔 or upload an image above"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.visible !== false}
                                                    onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                                                />
                                                {' '}Show on home page
                                            </label>
                                        </div>
                                    </>
                                )}

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        {editingItem ? 'Update' : 'Add'} {activeTab === 'testimonials' ? 'Testimonial' : 'Category'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminContent;
