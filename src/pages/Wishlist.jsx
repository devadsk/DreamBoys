import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import './Wishlist.css';

const Wishlist = () => {
    const navigate = useNavigate();
    const { wishlist, removeFromWishlist, clearWishlist, moveToCart } = useWishlist();
    const { addToCart } = useCart();
    const [selectedVariants, setSelectedVariants] = useState({});

    const handleMoveToCart = (product) => {
        // Use stored size and color from wishlist
        const size = product.selectedSize || product.sizes?.[0] || 'M';
        const color = product.selectedColor || product.colors?.[0] || 'Black';
        const quantity = 1;

        // Move to cart
        moveToCart(product, size, color, quantity, addToCart);

        // Navigate to cart
        navigate('/cart');
    };

    if (wishlist.length === 0) {
        return (
            <div className="wishlist-page">
                <div className="container">
                    <div className="wishlist-empty">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            <h2>Your Wishlist is Empty</h2>
                            <p>Save your favorite items to your wishlist and shop them later!</p>
                            <Link to="/products" className="shop-now-btn">
                                Start Shopping
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="wishlist-page">
            <div className="container">
                <div className="wishlist-header">
                    <div>
                        <h1>My Wishlist</h1>
                        <p>{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved</p>
                    </div>
                    {wishlist.length > 0 && (
                        <button className="clear-wishlist-btn" onClick={clearWishlist}>
                            Clear All
                        </button>
                    )}
                </div>

                <div className="wishlist-grid">
                    {wishlist.map((product, index) => (
                        <motion.div
                            key={product.id}
                            className="wishlist-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <button
                                className="remove-btn"
                                onClick={() => removeFromWishlist(product.id)}
                                aria-label="Remove from wishlist"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>

                            <Link to={`/product/${product.id}`} className="product-link">
                                <div className="product-image">
                                    <img src={product.image || product.images?.[0]} alt={product.name} />
                                    {product.discount > 0 && (
                                        <span className="discount-badge">-{product.discount}%</span>
                                    )}
                                    {product.stock <= 0 && (
                                        <span className="stock-badge">Out of Stock</span>
                                    )}
                                </div>

                                <div className="product-info">
                                    <span className="category">{product.category}</span>
                                    <h3>{product.name}</h3>
                                    <div className="price-row">
                                        <span className="price">₹{product.price}</span>
                                        {product.originalPrice && (
                                            <span className="original-price">₹{product.originalPrice}</span>
                                        )}
                                    </div>

                                    {product.colors && product.colors.length > 0 && (
                                        <div className="product-colors">
                                            {product.colors.slice(0, 4).map((color, idx) => (
                                                <span
                                                    key={idx}
                                                    className="color-dot"
                                                    style={{ backgroundColor: getColorHex(color) }}
                                                    title={color}
                                                ></span>
                                            ))}
                                            {product.colors.length > 4 && (
                                                <span className="more-colors">+{product.colors.length - 4}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>

                            <div className="card-actions">
                                <button
                                    className="move-to-cart-btn"
                                    onClick={() => handleMoveToCart(product)}
                                    disabled={product.stock <= 0}
                                >
                                    {product.stock <= 0 ? 'Out of Stock' : 'Move to Cart'}
                                </button>
                                <Link to={`/product/${product.id}`} className="view-btn">
                                    View Details
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Helper function for color hex codes
const getColorHex = (name) => {
    const colors = {
        black: '#000', white: '#fff', red: '#dc2626', blue: '#2563eb',
        green: '#16a34a', yellow: '#eab308', purple: '#9333ea', pink: '#db2777',
        gray: '#6b7280', navy: '#1e3a8a', orange: '#ea580c', brown: '#78350f'
    };
    return colors[name.toLowerCase()] || '#ccc';
};

export default Wishlist;
