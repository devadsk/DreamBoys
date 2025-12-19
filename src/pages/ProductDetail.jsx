import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduct, getProducts, getProductReviews, addReview, deleteReview } from '../firebase/firebaseService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import InlineLoader from '../components/InlineLoader';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();
    const { addToCart, getCartQuantity } = useCart();
    const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);

    // State for selections
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);

    // UI States
    const [showQuantity, setShowQuantity] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState('description'); // 'description', 'shipping', or null

    // Review form states
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        loadProduct();
        window.scrollTo(0, 0);
        setShowQuantity(false);
    }, [id]);

    const loadProduct = async () => {
        const result = await getProduct(id);
        if (result.success && result.data) {
            const productData = result.data;
            setProduct(productData);

            // Set initial color and size
            if (productData.colors?.length > 0) {
                const firstColor = productData.colors[0];
                setSelectedColor(firstColor);

                // Set size available for this color
                const availableSizes = getAvailableSizes(productData, firstColor);
                if (availableSizes.length > 0) setSelectedSize(availableSizes[0]);
            } else if (productData.sizes?.length > 0) {
                // Products without color variants
                setSelectedSize(productData.sizes[0]);
            }

            loadRelatedProducts(productData.category);
            loadReviews(id);
        }
    };

    const getAvailableSizes = (prod, color) => {
        if (!prod || !prod.colorSizeStock) return prod?.sizes || ['S', 'M', 'L', 'XL'];

        // If color specified, check stock for that color
        if (color && prod.colorSizeStock[color]) {
            return Object.keys(prod.colorSizeStock[color]).filter(size => prod.colorSizeStock[color][size] > 0);
        }

        // Fallback for simple stock (key 'default')
        if (prod.colorSizeStock['default']) {
            return Object.keys(prod.colorSizeStock['default']).filter(size => prod.colorSizeStock['default'][size] > 0);
        }

        return prod.sizes || []; // Fallback
    };

    // Helper function for color hex codes (from Wishlist.jsx)
    const getColorHex = (name) => {
        const colors = {
            black: '#000', white: '#fff', red: '#dc2626', blue: '#2563eb',
            green: '#16a34a', yellow: '#eab308', purple: '#9333ea', pink: '#db2777',
            gray: '#6b7280', navy: '#1e3a8a', orange: '#ea580c', brown: '#78350f',
            beige: '#D4C5B9', khaki: '#C3B091'
        };
        return colors[name.toLowerCase()] || '#ccc';
    };

    const loadRelatedProducts = async (category) => {
        const result = await getProducts();
        if (result.success) {
            setRelatedProducts(result.data.filter(p => p.category === category && p.id !== id).slice(0, 4));
        }
    };

    const loadReviews = async (productId) => {
        // console.log('Loading reviews for product:', productId);
        const result = await getProductReviews(productId);
        // console.log('getProductReviews result:', result);

        if (result.success) {
            // console.log('Reviews loaded successfully:', result.data);
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
            const result = await deleteReview(reviewId, id);

            if (result.success) {
                alert('Review deleted successfully');
                await loadReviews(id);
                // Optionally reload product if rating aggregation is on product document
                // await loadProduct(); 
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
                // await loadProduct();
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
        console.log('🔵 handleAddToCart triggered');

        // Check if user is logged in
        if (!currentUser) {
            console.log('❌ User not logged in, redirecting to login');
            alert('Please login to add items to your cart');
            navigate('/login', { state: { from: `/product/${id}` } });
            return;
        }

        if (!selectedSize) {
            alert('Please select a size');
            return;
        }

        // Get the appropriate image (color-specific or default)
        let productImage;
        if (product.colorImages && selectedColor && product.colorImages[selectedColor]) {
            productImage = product.colorImages[selectedColor][0];
        } else if (product.images && product.images.length > 0) {
            productImage = product.images[0];
        } else {
            productImage = product.image;
        }

        // Create product object with all necessary properties
        const productToAdd = {
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: productImage,
            category: product.category,
            stock: getStockLevel()
        };

        // Call addToCart with correct parameter order: (product, selectedSize, selectedColor, quantity)
        addToCart(productToAdd, selectedSize, selectedColor, quantity);
        navigate('/cart');
    };

    const handleToggleWishlist = () => {
        // Check if user is logged in
        if (!currentUser) {
            alert('Please login to add items to your wishlist');
            navigate('/login', { state: { from: `/product/${id}` } });
            return;
        }

        // Toggle: if in wishlist, remove it; otherwise add it
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            // Add to wishlist with selected size and color
            addToWishlist(product, selectedSize, selectedColor);
        }
    };

    const toggleAccordion = (section) => {
        setActiveAccordion(activeAccordion === section ? null : section);
    };

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        // Reset quantity when color changes
        setQuantity(1);
        // Reset to first image when color changes
        setSelectedImage(0);
        // Reset size if current size isn't available in new color
        const newAvailableSizes = getAvailableSizes(product, color);
        if (!newAvailableSizes.includes(selectedSize)) {
            setSelectedSize(newAvailableSizes[0] || '');
        }
    };

    const handleSizeSelect = (size) => {
        setSelectedSize(size);
        // Reset quantity to 1 when size changes to prevent stock overflow
        setQuantity(1);
    };

    // Calculate Stock
    const getStockLevel = () => {
        if (!product || !product.colorSizeStock) return 0;

        // Matrix mode
        if (selectedColor && product.colorSizeStock[selectedColor]) {
            return product.colorSizeStock[selectedColor][selectedSize] || 0;
        }

        // Simple mode
        if (product.colorSizeStock['default']) {
            return product.colorSizeStock['default'][selectedSize] || 0;
        }

        return 0;
    };

    const stockLevel = getStockLevel();

    // Calculate available stock (total stock minus what's already in cart)
    const cartQuantity = getCartQuantity(id, selectedSize, selectedColor);
    const availableStock = Math.max(0, stockLevel - cartQuantity);

    if (!product) return <InlineLoader message="Loading..." />;

    // Get images for selected color or fallback to default images
    let productImages;
    if (product.colorImages && selectedColor && product.colorImages[selectedColor]) {
        // Use color-specific images
        productImages = product.colorImages[selectedColor];
    } else if (product.images) {
        // Fallback to default images
        productImages = product.images;
    } else if (product.image) {
        // Fallback to single image
        productImages = [product.image];
    } else {
        productImages = [];
    }

    const availableSizes = getAvailableSizes(product, selectedColor);

    // Calculate rating from reviews
    const calculateAverageRating = () => {
        if (reviews.length === 0) return product.rating || 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    const averageRating = calculateAverageRating();
    const totalReviews = reviews.length;

    // Helper to get count of stars for bar chart
    const getStarCount = (star) => reviews.filter(r => Math.round(r.rating) === star).length;

    return (
        <div className="product-detail-page">
            <div className="container">
                {/* Header / Nav (Hidden to match image look, or kept minimal) */}
                <div style={{ height: '40px' }}></div>

                <div className="product-detail-layout">
                    {/* Left Side - Image Gallery */}
                    <div className="left-column">
                        <div className="main-image-container">
                            <img
                                src={productImages[selectedImage]}
                                alt={product.name}
                                className="main-product-image"
                            />
                            {/* Thumbnails overlaid at bottom or below as per design */}
                            <div className="thumbnails-row">
                                {productImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`thumbnail-item ${selectedImage === idx ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(idx)}
                                    >
                                        <img src={img} alt="thumbnail" />
                                    </div>
                                ))}
                                {/* Reference shows 3 thumbnails usually */}
                                {[...Array(Math.max(0, 3 - productImages.length))].map((_, i) => (
                                    <div key={`placeholder-${i}`} className="thumbnail-item placeholder"></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Product Info */}
                    <div className="right-column">
                        <div className="product-category-pill">{product.category || 'Men Fashion'}</div>

                        <h1 className="product-title-large">{product.name}</h1>

                        <div className="product-price-large">₹{product.price}</div>

                        <div className="delivery-timer">
                            <span className="timer-icon">🕒</span>
                            <span>Order in <strong>02:30:25</strong> to get next day delivery</span>
                        </div>

                        {/* Colors Component */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="selection-area">
                                <div className="selection-label">Select Color: {selectedColor}</div>
                                <div className="product-colors">
                                    {product.colors.map((color, idx) => (
                                        <span
                                            key={idx}
                                            className={`color-dot ${selectedColor === color ? 'selected' : ''}`}
                                            style={{ backgroundColor: getColorHex(color) }}
                                            title={color}
                                            onClick={() => handleColorSelect(color)}
                                        ></span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size Selector */}
                        <div className="selection-area">
                            <div className="selection-label">Select Size</div>
                            <div className="size-pills">
                                {availableSizes.length > 0 ? availableSizes.map(size => (
                                    <button
                                        key={size}
                                        className={`size-pill-btn ${selectedSize === size ? 'selected' : ''}`}
                                        onClick={() => handleSizeSelect(size)}
                                    >
                                        {size}
                                    </button>
                                )) : (
                                    <p className="no-stock-msg">Out of Stock for this color</p>
                                )}
                            </div>

                            {/* Stock Indicator */}
                            {selectedSize && (
                                <div className={`stock-indicator ${availableStock <= 5 ? 'low-stock' : ''}`}>
                                    {availableStock > 0 ? (
                                        cartQuantity > 0 ? `${availableStock} more available (${cartQuantity} in cart)` : `${availableStock} items left`
                                    ) : (
                                        cartQuantity > 0 ? `All items in cart (${cartQuantity})` : 'Out of Stock'
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quantity (Hidden initially, but logic requested to consider quantity on add) */}
                        {/* Modified: Always show quantity or show on size select? 
                            User requirement: "also when add to cart clicked , consider the quantity also"
                            To support this better, maybe we should show quantity selector always or after size select.
                            The current logic shows it after "Add to Cart" clicked first time (which was just setting showQuantity=true).
                            But now "Add to Cart" navigates away. So we should probably let user set quantity beforehand or 
                            if they click "Add to Cart", it adds 1 (default) and goes to cart.
                            
                            Let's make quantity selector visible if size is selected? Or just allow user to add 1 and then update in cart.
                            However, the code `setShowQuantity(true)` in handleAddToCart was preventing immediate add.
                            Updated logic: `handleAddToCart` now adds immediately.
                            So `showQuantity` state might be redundant if we want typical ecommerce flow.
                            Let's keep the Quantity selector visible if a size is selected, so they can choose > 1.
                        */}

                        {(selectedSize || showQuantity) && (
                            <div className="quantity-area">
                                <div className="quantity-label">Quantity</div>
                                <div className="quantity-stepper">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                                    <span>{quantity}</span>
                                    <button onClick={() => setQuantity(Math.min(quantity + 1, availableStock))}>+</button>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="cart-actions">
                            <button
                                className="add-cart-btn-black"
                                onClick={handleAddToCart}
                                disabled={availableStock === 0}
                                style={{ opacity: availableStock === 0 ? 0.5 : 1, cursor: availableStock === 0 ? 'not-allowed' : 'pointer' }}
                            >
                                {availableStock > 0 ? 'Add to Cart' : (cartQuantity > 0 ? 'All in Cart' : 'Out of Stock')}
                            </button>
                            <button
                                className={`wishlist-btn-outline ${isInWishlist(product.id) ? 'in-wishlist' : ''}`}
                                onClick={handleToggleWishlist}
                                title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            >
                                {isInWishlist(product.id) ? '❤️' : '♡'}
                            </button>
                        </div>

                        {/* Accordions */}
                        <div className="accordions-list">
                            {/* Description & Fit */}
                            <div className="accordion-wrapper">
                                <button
                                    className="accordion-trigger"
                                    onClick={() => toggleAccordion('description')}
                                >
                                    <span>Description & Fit</span>
                                    <span className={`chevron ${activeAccordion === 'description' ? 'up' : 'down'}`}>^</span>
                                </button>
                                {activeAccordion === 'description' && (
                                    <div className="accordion-body">
                                        <p>{product.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Shipping */}
                            <div className="accordion-wrapper">
                                <button
                                    className="accordion-trigger"
                                    onClick={() => toggleAccordion('shipping')}
                                >
                                    <span>Shipping</span>
                                    <span className={`chevron ${activeAccordion === 'shipping' ? 'up' : 'down'}`}>^</span>
                                </button>
                                {activeAccordion === 'shipping' && (
                                    <div className="accordion-body">
                                        <div className="shipping-grid-icons">
                                            <div className="ship-item">
                                                <div className="ship-icon">🏷️</div>
                                                <div className="ship-detail">
                                                    <strong>Discount</strong>
                                                    <span>Disc 50%</span>
                                                </div>
                                            </div>
                                            <div className="ship-item">
                                                <div className="ship-icon">📦</div>
                                                <div className="ship-detail">
                                                    <strong>Package</strong>
                                                    <span>Regular Package</span>
                                                </div>
                                            </div>
                                            <div className="ship-item">
                                                <div className="ship-icon">📅</div>
                                                <div className="ship-detail">
                                                    <strong>Delivery Time</strong>
                                                    <span>3-5 Working Days</span>
                                                </div>
                                            </div>
                                            <div className="ship-item">
                                                <div className="ship-icon">🚚</div>
                                                <div className="ship-detail">
                                                    <strong>Estimated Arrival</strong>
                                                    <span>10 - 12 October 2024</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rating & Reviews Section */}
                <div className="reviews-container-ref">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="reviews-heading">Rating & Reviews</h2>
                        {currentUser && !showReviewForm && (
                            <button
                                className="add-review-btn"
                                style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}
                                onClick={() => setShowReviewForm(true)}
                            >
                                Write a Review
                            </button>
                        )}
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                        <div className="review-form-container" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #eee' }}>
                            <h3>Write your review</h3>
                            <form onSubmit={handleSubmitReview}>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Rating:</label>
                                    <div style={{ fontSize: '24px', cursor: 'pointer' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span
                                                key={star}
                                                onClick={() => setReviewRating(star)}
                                                style={{ color: star <= reviewRating ? '#ffc107' : '#e4e5e9', marginRight: '5px' }}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Comment:</label>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="What did you like or dislike?"
                                        style={{ width: '100%', padding: '10px', minHeight: '100px', border: '1px solid #ddd' }}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="submit"
                                        disabled={submittingReview}
                                        style={{ padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: submittingReview ? 'not-allowed' : 'pointer' }}
                                    >
                                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowReviewForm(false)}
                                        style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#000', border: '1px solid #000', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="reviews-content-grid">
                        {/* Left: Big Rating */}
                        <div className="rating-summary-box">
                            <div className="big-rating-number">
                                {averageRating} <span className="small-total">/ 5</span>
                            </div>
                            <div className="rating-bars">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = getStarCount(star);
                                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                                    return (
                                        <div key={star} className="rating-bar-row">
                                            <span className="star-label">★ {star}</span>
                                            <div className="bar-bg">
                                                <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#666', marginLeft: '5px' }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="review-count-text">({totalReviews} Reviews)</div>
                        </div>

                        {/* Right: Review List (formerly Slider Card) */}
                        <div className="review-list-area" style={{ flex: 1 }}>
                            {reviews.length > 0 ? (
                                <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {reviews.map((review) => (
                                        <div key={review.id} className="review-card-item" style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                                            <div className="reviewer-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="reviewer-avatar-circle" style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#ddd' }}>
                                                        <img
                                                            src={`https://ui-avatars.com/api/?name=${review.userName || 'User'}&background=random`}
                                                            alt={review.userName}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: 0 }}>{review.userName}</h4>
                                                        <div className="reviewer-stars" style={{ color: '#ffc107' }}>
                                                            {'★'.repeat(Math.round(review.rating))}{'☆'.repeat(5 - Math.round(review.rating))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div className="review-date-right" style={{ fontSize: '12px', color: '#888' }}>
                                                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                                                    </div>
                                                    {currentUser && (currentUser.uid === review.userId || userData?.role === 'admin') && (
                                                        <button
                                                            onClick={() => handleDeleteReview(review.id)}
                                                            style={{ marginTop: '5px', color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                                                            title={userData?.role === 'admin' && currentUser.uid !== review.userId ? 'Delete as Admin' : 'Delete your review'}
                                                        >
                                                            Delete {userData?.role === 'admin' && currentUser.uid !== review.userId ? '(Admin)' : ''}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="review-text-body" style={{ margin: 0, color: '#444' }}>
                                                "{review.comment}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    <p>No reviews yet. Be the first to review this product!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                <div className="related-products-ref">
                    <h2>You might also like</h2>
                    <div className="related-products-list-ref">
                        {relatedProducts.map(rel => (
                            <Link to={`/product/${rel.id}`} key={rel.id} className="related-card-ref">
                                <div className="related-img-box">
                                    <img src={rel.image || rel.images?.[0]} alt={rel.name} />
                                </div>
                                <div className="related-info-box">
                                    <h3>{rel.name}</h3>
                                    <div className="related-rating">★ {rel.rating ? parseFloat(rel.rating).toFixed(1) : '0.0'}/5</div>
                                    <div className="related-price">₹{rel.price}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductDetail;