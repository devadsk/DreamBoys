import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, getProducts, getProductReviews } from '../firebase/firebaseService';
import { useAuth } from '../context/AuthContext';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
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
            if (productData.sizes?.length > 0) setSelectedSize(productData.sizes[0]);
            loadRelatedProducts(productData.category);
            loadReviews(id);
        }
    };

    const loadRelatedProducts = async (category) => {
        const result = await getProducts();
        if (result.success) {
            setRelatedProducts(result.data.filter(p => p.category === category && p.id !== id).slice(0, 4));
        }
    };

    const loadReviews = async (productId) => {
        const result = await getProductReviews(productId);
        if (result.success) setReviews(result.data);
    };

    const handleAddToCart = () => {
        if (!selectedSize && product.sizes?.length > 0) {
            alert('Please select a size');
            return;
        }
        setShowQuantity(true);
    };

    const toggleAccordion = (section) => {
        setActiveAccordion(activeAccordion === section ? null : section);
    };

    if (!product) return <div className="loading">Loading...</div>;

    const productImages = product.images || (product.image ? [product.image] : []);
    const averageRating = product.rating || 4.5; // Default for demo matches reference
    const totalReviews = reviews.length || 50;   // Default for demo matches reference

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

                        {/* Size Selector */}
                        <div className="selection-area">
                            <div className="selection-label">Select Size</div>
                            <div className="size-pills">
                                {(product.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map(size => (
                                    <button
                                        key={size}
                                        className={`size-pill-btn ${selectedSize === size ? 'selected' : ''}`}
                                        onClick={() => setSelectedSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity (Hidden initially) */}
                        {showQuantity && (
                            <div className="quantity-area">
                                <div className="quantity-label">Quantity</div>
                                <div className="quantity-stepper">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                                    <span>{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="cart-actions">
                            <button className="add-cart-btn-black" onClick={handleAddToCart}>
                                {showQuantity ? 'Update Cart' : 'Add to Cart'}
                            </button>
                            <button className="wishlist-btn-outline">♡</button>
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
                                        <p style={{ marginTop: '10px', color: '#666' }}>
                                            Loose-fit sweatshirt hoodie in medium weight cotton-blend fabric with a generous, but not oversized silhouette. Jersey-lined, drawstring hood, dropped shoulders, long sleeves, and a kangaroo pocket. Wide ribbing at cuffs and hem. Soft, brushed inside.
                                        </p>
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

                {/* Rating & Reviews Section - Below Fold */}
                <div className="reviews-container-ref">
                    <h2 className="reviews-heading">Rating & Reviews</h2>

                    <div className="reviews-content-grid">
                        {/* Left: Big Rating */}
                        <div className="rating-summary-box">
                            <div className="big-rating-number">
                                4.5 <span className="small-total">/ 5</span>
                            </div>
                            <div className="rating-bars">
                                {[5, 4, 3, 2, 1].map((star, i) => (
                                    <div key={star} className="rating-bar-row">
                                        <span className="star-label">★ {star}</span>
                                        <div className="bar-bg">
                                            <div className="bar-fill" style={{ width: i === 0 ? '90%' : i === 1 ? '20%' : '5%' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="review-count-text">({totalReviews} New Reviews)</div>
                        </div>

                        {/* Right: Review Slider Card */}
                        <div className="review-slider-area">
                            <div className="review-testimonial-card">
                                <div className="reviewer-header">
                                    <div className="reviewer-avatar-circle">
                                        <img src="https://i.pravatar.cc/150?u=alex" alt="Alex" />
                                    </div>
                                    <div className="reviewer-meta">
                                        <h4>Alex Mathio</h4>
                                        <div className="reviewer-stars">★ ★ ★ ★ ★</div>
                                    </div>
                                    <div className="review-date-right">13 Oct 2024</div>
                                </div>
                                <p className="review-text-body">
                                    "NextGen's dedication to sustainability and ethical practices resonates strongly with today's consumers, positioning the brand as a responsible choice in the fashion world."
                                </p>
                                <div className="slider-controls">
                                    <div className="slider-bar">
                                        <div className="slider-progress" style={{ width: '40%' }}></div>
                                    </div>
                                    <button className="next-review-btn"></button>
                                </div>
                            </div>
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
                                    <div className="related-rating">★ 4.5/5</div>
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