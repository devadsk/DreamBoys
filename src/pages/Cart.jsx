import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import './Cart.css';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

    const subtotal = getCartTotal();
    const shipping = subtotal > 999 ? 0 : 99;
    const discount = 0; // Can be calculated based on promo codes
    const total = subtotal + shipping - discount;

    const handleQuantityChange = (item, change) => {
        const newQuantity = item.quantity + change;
        if (newQuantity > 0 && newQuantity <= (item.stock || 99)) {
            updateQuantity(item.id, item.selectedSize, item.selectedColor, newQuantity);
        }
    };

    const handleRemove = (item) => {
        removeFromCart(item.id, item.selectedSize, item.selectedColor);
    };

    if (cart.length === 0) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="cart-empty">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            <h2>Your Bag is Empty</h2>
                            <p>Add some amazing products to your bag and they'll show up here!</p>
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
        <div className="cart-page">
            <div className="container">
                <div className="cart-header">
                    <div>
                        <h1>Shopping Bag</h1>
                        <p>{cart.length} {cart.length === 1 ? 'item' : 'items'} in your bag</p>
                    </div>
                    {cart.length > 0 && (
                        <button className="clear-cart-btn" onClick={clearCart}>
                            Clear Bag
                        </button>
                    )}
                </div>

                <div className="cart-grid">
                    <div className="cart-items-section">
                        {cart.map((item, index) => (
                            <motion.div
                                key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                                className="cart-item"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <div className="cart-item-image">
                                    <img src={item.image} alt={item.name} />
                                </div>

                                <div className="cart-item-details">
                                    <h3>{item.name}</h3>
                                    <p className="cart-item-category">{item.category}</p>
                                    <div className="cart-item-options">
                                        <span className="option-label">Size: <strong>{item.selectedSize}</strong></span>
                                        <span className="option-label">Color: <strong>{item.selectedColor}</strong></span>
                                    </div>
                                    <div className="cart-item-price-mobile">
                                        <span className="price">₹{item.price}</span>
                                        {item.originalPrice && (
                                            <span className="original-price">₹{item.originalPrice}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="cart-item-actions">
                                    <div className="cart-item-price-desktop">
                                        <span className="price">₹{item.price}</span>
                                        {item.originalPrice && (
                                            <span className="original-price">₹{item.originalPrice}</span>
                                        )}
                                    </div>

                                    <div className="quantity-controls">
                                        <button
                                            onClick={() => handleQuantityChange(item, -1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                        <span className="quantity">{item.quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange(item, 1)}
                                            disabled={item.quantity >= (item.stock || 99)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="cart-item-total">
                                        <span className="total-label">Total:</span>
                                        <span className="total-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>

                                    <button
                                        className="remove-btn"
                                        onClick={() => handleRemove(item)}
                                        aria-label="Remove item"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="cart-summary-section">
                        <div className="cart-summary">
                            <h2>Order Summary</h2>

                            <div className="summary-details">
                                <div className="summary-row">
                                    <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Shipping</span>
                                    <span className={shipping === 0 ? 'free-shipping' : ''}>
                                        {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                                    </span>
                                </div>
                                {discount > 0 && (
                                    <div className="summary-row discount-row">
                                        <span>Discount</span>
                                        <span>-₹{discount.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            {subtotal < 999 && (
                                <div className="shipping-notice">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    <p>Add ₹{(999 - subtotal).toFixed(2)} more for FREE shipping!</p>
                                </div>
                            )}

                            <div className="summary-divider"></div>

                            <div className="summary-total">
                                <span>Total</span>
                                <span className="total-amount">₹{total.toFixed(2)}</span>
                            </div>

                            <Link to="/checkout" className="checkout-btn">
                                Proceed to Checkout
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </Link>

                            <Link to="/products" className="continue-shopping">
                                Continue Shopping
                            </Link>
                        </div>

                        <div className="cart-benefits">
                            <h3>Why Shop With Us?</h3>
                            <div className="benefit-item">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <div>
                                    <strong>Secure Payment</strong>
                                    <p>100% secure transactions</p>
                                </div>
                            </div>
                            <div className="benefit-item">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <div>
                                    <strong>Fast Delivery</strong>
                                    <p>2-7 days delivery</p>
                                </div>
                            </div>
                            <div className="benefit-item">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                <div>
                                    <strong>Easy Returns</strong>
                                    <p>7-day return policy</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
