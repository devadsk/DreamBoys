import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    LayoutGrid,
    Plus,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Image as ImageIcon,
    Smile,
    X,
    Star,
    Check
} from 'lucide-react';
import {
    getTestimonials,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
    getCategories,
    updateCategory,
    deleteCategory
} from '../../firebase/firebaseService';
import { useToast } from '../../context/ToastContext';
import '../admin/AdminDashboard.css'; // Shared
import './AdminContent.css';

const AdminContent = () => {
    const toast = useToast();
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
                    if (result.success) toast.success('Testimonial updated successfully!');
                    else { toast.error(`Error: ${result.error}`); return; }
                } else {
                    const result = await addTestimonial(formData);
                    if (result.success) toast.success('Testimonial added successfully!');
                    else { toast.error(`Error: ${result.error}`); return; }
                }
            } else {
                if (editingItem) {
                    const result = await updateCategory(editingItem.id, formData);
                    if (result.success) toast.success('Category updated successfully!');
                    else { toast.error(`Error: ${result.error}`); return; }
                }
            }

            setShowModal(false);
            setEditingItem(null);
            setFormData({});
            loadData();
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            toast.error(`An error occurred: ${error.message}`);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            ...item,
            originalImage: item.image
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
            toast.success('Item deleted successfully');
        }
    };

    const handleToggleVisibility = async (category) => {
        const newVisibility = category.visible === undefined ? false : !category.visible;
        await updateCategory(category.id, { ...category, visible: newVisibility });
        loadData();
        toast.info(newVisibility ? 'Category visible' : 'Category hidden');
    };

    const openAddModal = () => {
        if (activeTab === 'testimonials') {
            setEditingItem(null);
            setFormData({ name: '', role: '', text: '', rating: 5 });
            setShowModal(true);
        }
    };

    return (
        <div className="admin-page-content">
            <div className="page-header">
                <div>
                    <h1>Content Management</h1>
                    <p className="subtitle">Manage testimonials and product categories</p>
                </div>
                {activeTab === 'testimonials' && (
                    <div className="header-actions">
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <Plus size={18} /> Add Testimonial
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            {/* NEW PILL TABS */}
            <div className="mb-6">
                <div className="filter-tabs-container">
                    <button
                        onClick={() => setActiveTab('testimonials')}
                        className={`filter-tab-pill ${activeTab === 'testimonials' ? 'active' : ''}`}
                    >
                        {activeTab === 'testimonials' && (
                            <motion.div
                                layoutId="activeTabContent"
                                className="active-pill-bg"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <MessageSquare size={16} />
                        <span>Testimonials</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`filter-tab-pill ${activeTab === 'categories' ? 'active' : ''}`}
                    >
                        {activeTab === 'categories' && (
                            <motion.div
                                layoutId="activeTabContent"
                                className="active-pill-bg"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <LayoutGrid size={16} />
                        <span>Categories</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading content...</p>
                </div>
            ) : (
                <div className="content-grid">
                    {activeTab === 'testimonials' ? (
                        testimonials.length > 0 ? (
                            testimonials.map((testimonial) => (
                                <motion.div
                                    key={testimonial.id}
                                    className="content-card testimonial-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="content-card-header">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold">
                                                {testimonial.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                                                <p className="text-xs text-gray-500">{testimonial.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex text-yellow-400">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <Star key={i} size={14} fill="currentColor" />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="content-card-body my-4">
                                        <p className="text-gray-600 text-sm italic">"{testimonial.text}"</p>
                                    </div>
                                    <div className="content-card-actions">
                                        <button onClick={() => handleEdit(testimonial)} className="btn-icon-text">
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(testimonial.id)} className="btn-icon-text text-danger">
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <MessageSquare size={48} className="text-muted mb-2" />
                                <p>No testimonials yet. Add yours!</p>
                            </div>
                        )
                    ) : (
                        categories.length > 0 ? (
                            categories.map((category) => (
                                <motion.div
                                    key={category.id}
                                    className="content-card category-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="category-preview" style={{ background: category.color || '#f3f4f6' }}>
                                        {category.image?.startsWith('data:') || category.image?.startsWith('http') ? (
                                            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-4xl">{category.image}</div>
                                        )}
                                    </div>
                                    <div className="p-4 border-b border-gray-100">
                                        <h3 className="font-semibold text-lg">{category.name}</h3>
                                        <p className="text-xs text-primary truncate">{category.link}</p>
                                        <div className="mt-2 text-xs font-medium flex items-center gap-1">
                                            {category.visible !== false ? (
                                                <span className="text-success flex items-center gap-1"><Check size={12} /> Visible</span>
                                            ) : (
                                                <span className="text-muted flex items-center gap-1"><EyeOff size={12} /> Hidden</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="content-card-actions">
                                        <button onClick={() => handleEdit(category)} className="btn-icon-text">
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={() => handleToggleVisibility(category)} className="btn-icon-text">
                                            {category.visible !== false ? <EyeOff size={14} /> : <Eye size={14} />}
                                            {category.visible !== false ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <LayoutGrid size={48} className="text-muted mb-2" />
                                <p>No categories found.</p>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                        <motion.div
                            className="modal-content"
                            style={{ maxWidth: '500px' }}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>{editingItem ? 'Edit' : 'Add'} {activeTab === 'testimonials' ? 'Testimonial' : 'Category'}</h2>
                                <button className="btn-icon-small" onClick={() => setShowModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 pt-0">
                                {activeTab === 'testimonials' ? (
                                    <>
                                        <div className="form-group mb-4">
                                            <label className="form-label">Customer Name</label>
                                            <input
                                                type="text"
                                                className="form-input w-full"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                placeholder="Enter customer name"
                                            />
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="form-label">Role/Title</label>
                                            <input
                                                type="text"
                                                className="form-input w-full"
                                                value={formData.role || ''}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                required
                                                placeholder="e.g., Verified Buyer"
                                            />
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="form-label">Testimonial</label>
                                            <textarea
                                                className="form-textarea w-full"
                                                value={formData.text || ''}
                                                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                                required
                                                rows="4"
                                                placeholder="What did they say?"
                                            />
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="form-label">Rating</label>
                                            <select
                                                className="form-select w-full"
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
                                        <div className="form-group mb-4">
                                            <label className="form-label">Category Name</label>
                                            <input
                                                type="text"
                                                className="form-input w-full"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="form-label">Link</label>
                                            <input
                                                type="text"
                                                className="form-input w-full"
                                                value={formData.link || ''}
                                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                                required
                                                placeholder="/products/category-name"
                                            />
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="form-label">Accent Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={formData.color || '#667eea'}
                                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                    className="w-10 h-10 p-0 border-0 rounded"
                                                />
                                                <input
                                                    type="text"
                                                    className="form-input flex-1"
                                                    value={formData.color || '#667eea'}
                                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="form-label">Image or Emoji</label>
                                            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    id="cat-image-upload"
                                                    className="hidden"
                                                />
                                                <div className="flex flex-col items-center gap-2">
                                                    {formData.image && (formData.image.startsWith('data:') || formData.image.startsWith('http')) ? (
                                                        <img src={formData.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                                                    ) : formData.image ? (
                                                        <div className="text-4xl">{formData.image}</div>
                                                    ) : (
                                                        <ImageIcon className="text-gray-400" size={32} />
                                                    )}

                                                    <div className="flex gap-2 mt-2">
                                                        <label htmlFor="cat-image-upload" className="btn btn-outline btn-sm cursor-pointer">
                                                            <ImageIcon size={14} /> Upload Image
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => {
                                                                const emoji = prompt('Enter an emoji:', '👕');
                                                                if (emoji) setFormData({ ...formData, image: emoji });
                                                            }}
                                                        >
                                                            <Smile size={14} /> Use Emoji
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                                    checked={formData.visible !== false}
                                                    onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                                                />
                                                <span className="text-sm font-medium text-gray-700">Show on Home Page</span>
                                            </label>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        {editingItem ? 'Update' : 'Add'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminContent;
