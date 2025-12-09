import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, getProducts, getProductReviews, addReview } from '../firebase/firebaseService';
import { useAuth } from '../context/AuthContext';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [activeTab, setActiveTab] = useState('description');
    const [selectedImage, setSelectedImage] = useState(0);

    // Review form states
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        loadProduct();
        window.scrollTo(0, 0);
    }, [id]);

    // Auto-adjust quantity when size or color changes to prevent exceeding available stock
    useEffect(() => {
        if (!product) return;

        let maxStock = product.stock || 99;

        // Check size stock
        if (selectedSize && product.sizeStock && product.sizeStock[selectedSize] !== undefined) {
            maxStock = Math.min(maxStock, product.sizeStock[selectedSize]);
        }

        // Check color stock
        if (selectedColor && product.colorStock && product.colorStock[selectedColor] !== undefined) {
            maxStock = Math.min(maxStock, product.colorStock[selectedColor]);
        }

        // If current quantity exceeds available stock, reduce it
        if (quantity > maxStock) {
            setQuantity(Math.max(1, Math.min(quantity, maxStock)));
        }
    }, [selectedSize, selectedColor, product]);

    const loadProduct = async () => {
        const result = await getProduct(id);
        if (result.success && result.data) {
            const productData = result.data;
            setProduct(productData);

            // Set default selections
            if (productData.sizes && productData.sizes.length > 0) {
                setSelectedSize(productData.sizes[0]);
            }
            if (productData.colors && productData.colors.length > 0) {
                setSelectedColor(productData.colors[0]);
            }

            // Load related products and reviews
            loadRelatedProducts(productData.category);
            loadReviews(id);
        }
    };

    const loadRelatedProducts = async (category) => {
        const result = await getProducts();
        if (result.success) {
            const related = result.data
                .filter(p => p.category === category && p.id !== id)
                .slice(0, 4);
            setRelatedProducts(related);
        }
    };

    const loadReviews = async (productId) => {
        console.log('Loading reviews for product:', productId);
        const result = await getProductReviews(productId);
        console.log('getProductReviews result:', result);

        if (result.success) {
            console.log('Reviews loaded successfully:', result.data);
            console.log('Number of reviews:', result.data.length);
            setReviews(result.data);
        } else {
            console.error('Failed to load reviews:', result.error);
            setReviews([]);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            const { deleteReview } = await import('../firebase/firebaseService');
            const result = await deleteReview(reviewId, id);

            if (result.success) {
                alert('Review deleted successfully');
                await loadReviews(id);
                await loadProduct();
            } else {
                alert('Error deleting review: ' + result.error);
            }
        } catch (error) {
            alert('Error deleting review: ' + error.message);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert('Please login to submit a review');
            return;
        }

        if (!reviewComment.trim()) {
            alert('Please write a review comment');
            return;
        }

        setSubmittingReview(true);

        try {
            const reviewData = {
                productId: id,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                rating: reviewRating,
                comment: reviewComment.trim()
            };

            const result = await addReview(reviewData);

            if (result.success) {
                // Clear form
                setReviewComment('');
                setReviewRating(5);
                setShowReviewForm(false);

                // Show success message
                alert('Review submitted successfully! Thank you for your feedback.');

                // Wait for Firestore to update, then reload
                await new Promise(resolve => setTimeout(resolve, 1000));
                await loadReviews(id);
                await loadProduct();
            } else {
                alert('Error submitting review: ' + result.error);
            }
        } catch (error) {
            alert('Error submitting review: ' + error.message);
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleAddToCart = () => {
        if (!selectedSize && product.sizes && product.sizes.length > 0) {
            alert('Please select a size');
            return;
        }
        alert(`Added ${quantity} ${product.name} to cart!\nSize: ${selectedSize}\nColor: ${selectedColor}`);
    };

    const averageRating = product?.rating || 0;
    const totalReviews = product?.reviewCount || 0;

    // Color mapping
    const colorMap = {
        'black': '#000000',
        'white': '#FFFFFF',
        'red': '#DC2626',
        'blue': '#2563EB',
        'navy': '#1E3A8A',
        'green': '#16A34A',
        'yellow': '#EAB308',
        'orange': '#EA580C',
        'purple': '#9333EA',
        'pink': '#EC4899',
        'gray': '#6B7280',
        'brown': '#92400E',
        'beige': '#D4C5B9',
        'khaki': '#C3B091'
    };

    const getColorHex = (colorName) => {
        return colorMap[colorName?.toLowerCase()] || '#9CA3AF';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (!product) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading product details...</p>
            </div>
        );
    }

    const productImages = product.images || (product.image ? [product.image] : []);
    const features = product.features || [
        'Premium Quality Material',
        'Comfortable Fit',
        'Easy Care Instructions',
        'Durable Construction'
    ];

    return (
        <div className="product-detail-page">
            <div className="container">
                {/* Breadcrumb */}
                <div className="breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/products">Products</Link>
                    <span>/</span>
                    <Link to={`/products?category=${product.category}`}>{product.category}</Link>
                    <span>/</span>
                    <span>{product.name}</span>
                </div>

                {/* Main Product Section */}
                <div className="product-detail-grid">
                    {/* Image Gallery */}
                    <div className="product-gallery">
                        <div className="main-image">
                            {productImages.length > 0 ? (
                                <img src={productImages[selectedImage]} alt={product.name} />
                            ) : (
                                <div className="image-placeholder">📦</div>
                            )}
                            {product.discount && (
                                <span className="discount-badge">-{product.discount}%</span>
                            )}
                        </div>
                        {productImages.length > 1 && (
                            <div className="thumbnail-gallery">
                                {productImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(idx)}
                                    >
                                        <img src={img} alt={`${product.name} ${idx + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="product-info-section">
                        <div className="product-category-badge">{product.category}</div>
                        <h1 className="product-title">{product.name}</h1>

                        {/* Rating */}
                        <div className="product-rating-section">
                            <div className="stars-large">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < Math.floor(averageRating) ? 'star filled' : 'star'}>
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className="rating-text">
                                {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'}
                                {totalReviews > 0 && ` (${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})`}
                            </span>
                        </div>

                        {/* Price */}
                        <div className="price-section">
                            <span className="current-price">₹{product.price}</span>
                            {product.originalPrice && (
                                <>
                                    <span className="original-price">₹{product.originalPrice}</span>
                                    <span className="savings">
                                        Save ₹{(product.originalPrice - product.price).toFixed(2)}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Stock Status */}
                        <div className="stock-status">
                            {product.stock > 0 ? (
                                <span className="in-stock">
                                    ✓ In Stock ({product.stock} available)
                                </span>
                            ) : (
                                <span className="out-of-stock">✗ Out of Stock</span>
                            )}
                        </div>

                        {/* Short Description */}
                        <p className="product-short-description">{product.description}</p>

                        {/* Color Selection */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="option-group">
                                <label>Color: <strong>{selectedColor || 'Select a color'}</strong></label>
                                <div className="color-options">
                                    {product.colors.map((color) => {
                                        // Check if color has stock (if colorStock exists)
                                        const colorStock = product.colorStock?.[color];
                                        const isAvailable = colorStock === undefined || colorStock > 0;
                                        const showStockCount = colorStock !== undefined && colorStock < 100;

                                        return (
                                            <button
                                                key={color}
                                                className={`color-btn ${selectedColor === color ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                                                onClick={() => isAvailable && setSelectedColor(color)}
                                                disabled={!isAvailable}
                                                title={`${color}${colorStock !== undefined ? ` (${colorStock} in stock)` : ''}${!isAvailable ? ' - Out of Stock' : ''}`}
                                            >
                                                <span
                                                    className="color-swatch-large"
                                                    style={{
                                                        backgroundColor: getColorHex(color),
                                                        border: color.toLowerCase() === 'white' ? '2px solid #E5E7EB' : 'none'
                                                    }}
                                                >
                                                    {!isAvailable && <span className="unavailable-overlay">✕</span>}
                                                </span>
                                                <span className="color-label">
                                                    {color}
                                                    {showStockCount && isAvailable && (
                                                        <span className={`stock-count ${colorStock < 10 ? 'low-stock' : ''}`}>
                                                            {colorStock < 10 ? 'Low Stock' : 'Available'}
                                                        </span>
                                                    )}
                                                    {!isAvailable && (
                                                        <span className="stock-count out-of-stock">Out of stock</span>
                                                    )}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Size Selection */}
                        {((product.sizes && product.sizes.length > 0) || product.sizeStock) && (
                            <div className="option-group">
                                <label>Size: <strong>{selectedSize || 'Select a size'}</strong></label>
                                <div className="size-options">
                                    {(product.sizes || Object.keys(product.sizeStock || {})).map((size) => {
                                        // Get stock for this size
                                        const sizeStock = product.sizeStock?.[size];
                                        const isAvailable = sizeStock === undefined || sizeStock > 0;
                                        const showStockCount = sizeStock !== undefined && sizeStock < 100;

                                        return (
                                            <button
                                                key={size}
                                                className={`size-btn ${selectedSize === size ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                                                onClick={() => isAvailable && setSelectedSize(size)}
                                                disabled={!isAvailable}
                                                title={`${size}${sizeStock !== undefined ? ` (${sizeStock} in stock)` : ''}${!isAvailable ? ' - Out of Stock' : ''}`}
                                            >
                                                <span className="size-label">{size}</span>
                                                {showStockCount && isAvailable && (
                                                    <span className={`stock-count ${sizeStock < 10 ? 'low-stock' : sizeStock < 25 ? 'medium-stock' : ''}`}>
                                                        {sizeStock < 10 ? 'Low Stock' : sizeStock < 25 ? 'Limited' : 'Available'}
                                                    </span>
                                                )}
                                                {!isAvailable && (
                                                    <>
                                                        <span className="stock-count out-of-stock">Out</span>
                                                        <span className="unavailable-mark-size">✕</span>
                                                    </>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="option-group">
                            <label>Quantity:</label>
                            <div className="quantity-selector">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    −
                                </button>
                                <input type="number" value={quantity} readOnly />
                                <button
                                    onClick={() => {
                                        // Calculate available stock based on selected size/color
                                        let maxStock = product.stock || 99;

                                        // If size is selected and has stock tracking
                                        if (selectedSize && product.sizeStock && product.sizeStock[selectedSize] !== undefined) {
                                            maxStock = Math.min(maxStock, product.sizeStock[selectedSize]);
                                        }

                                        // If color is selected and has stock tracking
                                        if (selectedColor && product.colorStock && product.colorStock[selectedColor] !== undefined) {
                                            maxStock = Math.min(maxStock, product.colorStock[selectedColor]);
                                        }

                                        setQuantity(Math.min(maxStock, quantity + 1));
                                    }}
                                    disabled={(() => {
                                        let maxStock = product.stock || 99;
                                        if (selectedSize && product.sizeStock && product.sizeStock[selectedSize] !== undefined) {
                                            maxStock = Math.min(maxStock, product.sizeStock[selectedSize]);
                                        }
                                        if (selectedColor && product.colorStock && product.colorStock[selectedColor] !== undefined) {
                                            maxStock = Math.min(maxStock, product.colorStock[selectedColor]);
                                        }
                                        return quantity >= maxStock;
                                    })()}
                                >
                                    +
                                </button>
                            </div>
                            <span className="stock-info-text">
                                {(() => {
                                    let maxStock = product.stock || 99;
                                    if (selectedSize && product.sizeStock && product.sizeStock[selectedSize] !== undefined) {
                                        maxStock = Math.min(maxStock, product.sizeStock[selectedSize]);
                                    }
                                    if (selectedColor && product.colorStock && product.colorStock[selectedColor] !== undefined) {
                                        maxStock = Math.min(maxStock, product.colorStock[selectedColor]);
                                    }

                                    if (maxStock === 0) {
                                        return <span className="text-error">Out of stock</span>;
                                    } else if (maxStock < 10) {
                                        return <span className="text-warning">Only {maxStock} available</span>;
                                    } else if (maxStock < 100) {
                                        return <span className="text-success">{maxStock} available</span>;
                                    } else {
                                        return <span className="text-success">In stock</span>;
                                    }
                                })()}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            <button
                                className="btn btn-primary btn-lg add-to-cart-btn"
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                            >
                                🛒 Add to Cart
                            </button>
                            <button className="btn btn-secondary btn-lg wishlist-btn">
                                ♥ Add to Wishlist
                            </button>
                        </div>

                        {/* Product Highlights */}
                        <div className="product-highlights">
                            <h3>Product Highlights</h3>
                            <ul>
                                {features.map((feature, idx) => (
                                    <li key={idx}>
                                        <span className="check-icon">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="product-tabs">
                    <div className="tab-headers">
                        <button
                            className={`tab-header ${activeTab === 'description' ? 'active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Description
                        </button>
                        <button
                            className={`tab-header ${activeTab === 'reviews' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            Reviews ({reviews.length})
                        </button>
                        <button
                            className={`tab-header ${activeTab === 'shipping' ? 'active' : ''}`}
                            onClick={() => setActiveTab('shipping')}
                        >
                            Shipping & Returns
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'description' && (
                            <div className="tab-pane">
                                <h3>Product Description</h3>
                                <p>{product.description || 'Premium quality product designed for comfort and style.'}</p>
                                <h4>Features</h4>
                                <ul>
                                    {features.map((feature, idx) => (
                                        <li key={idx}>{feature}</li>
                                    ))}
                                </ul>
                                {product.specifications && (
                                    <>
                                        <h4>Specifications</h4>
                                        <table className="specifications-table">
                                            <tbody>
                                                {Object.entries(product.specifications).map(([key, value]) => (
                                                    <tr key={key}>
                                                        <td><strong>{key}</strong></td>
                                                        <td>{value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="tab-pane">
                                {totalReviews > 0 && (
                                    <div className="reviews-summary">
                                        <div className="average-rating">
                                            <div className="rating-number">{averageRating.toFixed(1)}</div>
                                            <div className="stars-large">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={i < Math.floor(averageRating) ? 'star filled' : 'star'}>
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="total-reviews">Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</div>
                                        </div>
                                    </div>
                                )}

                                {reviews.length > 0 ? (
                                    <div className="reviews-list">
                                        {reviews.map((review) => (
                                            <div key={review.id} className="review-card">
                                                <div className="review-header">
                                                    <div className="reviewer-info">
                                                        <div className="reviewer-avatar">
                                                            {review.userName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="reviewer-name">
                                                                {review.userName}
                                                                {review.verified && (
                                                                    <span className="verified-badge">✓ Verified Purchase</span>
                                                                )}
                                                            </div>
                                                            <div className="review-date">{formatDate(review.createdAt)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="review-rating">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} className={i < review.rating ? 'star filled' : 'star'}>
                                                                ★
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="review-comment">{review.comment}</p>

                                                {/* Delete button for review owner or admin */}
                                                {currentUser && (currentUser.uid === review.userId || currentUser.role === 'admin') && (
                                                    <button
                                                        className="btn btn-outline btn-sm delete-review-btn"
                                                        onClick={() => handleDeleteReview(review.id)}
                                                    >
                                                        🗑️ Delete Review
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-reviews">
                                        <p>No reviews yet. Be the first to review this product!</p>
                                    </div>
                                )}

                                {!showReviewForm ? (
                                    <button
                                        className="btn btn-primary write-review-btn"
                                        onClick={() => {
                                            if (!currentUser) {
                                                alert('Please login to write a review');
                                                return;
                                            }
                                            setShowReviewForm(true);
                                        }}
                                    >
                                        Write a Review
                                    </button>
                                ) : (
                                    <form className="review-form" onSubmit={handleSubmitReview}>
                                        <h4>Write Your Review</h4>

                                        <div className="form-group">
                                            <label>Your Rating:</label>
                                            <div className="star-rating-selector">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        className={`star-btn ${star <= reviewRating ? 'filled' : ''}`}
                                                        onClick={() => setReviewRating(star)}
                                                    >
                                                        ★
                                                    </button>
                                                ))}
                                                <span className="rating-label">({reviewRating} {reviewRating === 1 ? 'star' : 'stars'})</span>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>Your Review:</label>
                                            <textarea
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                placeholder="Share your experience with this product..."
                                                rows="5"
                                                required
                                            />
                                        </div>

                                        <div className="form-actions">
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                onClick={() => {
                                                    setShowReviewForm(false);
                                                    setReviewComment('');
                                                    setReviewRating(5);
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={submittingReview}
                                            >
                                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {activeTab === 'shipping' && (
                            <div className="tab-pane">
                                <h3>Shipping Information</h3>
                                <ul>
                                    <li>Free shipping on orders over ₹500</li>
                                    <li>Standard delivery: 5-7 business days</li>
                                    <li>Express delivery: 2-3 business days (additional charges apply)</li>
                                    <li>International shipping available</li>
                                </ul>
                                <h3>Returns & Exchanges</h3>
                                <ul>
                                    <li>30-day return policy</li>
                                    <li>Items must be unworn and in original packaging</li>
                                    <li>Free returns for defective items</li>
                                    <li>Exchange available for different sizes/colors</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="related-products-section">
                        <h2>You May Also Like</h2>
                        <div className="related-products-grid">
                            {relatedProducts.map((relatedProduct) => (
                                <Link
                                    key={relatedProduct.id}
                                    to={`/product/${relatedProduct.id}`}
                                    className="related-product-card"
                                >
                                    <div className="related-product-image">
                                        {relatedProduct.image ? (
                                            <img src={relatedProduct.image} alt={relatedProduct.name} />
                                        ) : (
                                            <div className="image-placeholder">📦</div>
                                        )}
                                    </div>
                                    <div className="related-product-info">
                                        <h4>{relatedProduct.name}</h4>
                                        <div className="related-product-rating">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < Math.floor(relatedProduct.rating || 0) ? 'star filled' : 'star'}>
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <p className="related-product-price">₹{relatedProduct.price}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
