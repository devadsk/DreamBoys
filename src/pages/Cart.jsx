import React from 'react';
import { Link } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
    // Mock cart items (replace with actual cart state management)
    const cartItems = [
        { id: '1', name: 'Classic White Shirt', price: 49.99, quantity: 2, size: 'M', image: '👔' },
        { id: '2', name: 'Slim Fit Jeans', price: 79.99, quantity: 1, size: 'L', image: '👖' }
    ];

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 10;
    const total = subtotal + shipping;

    return (
        <div className="cart-page">
            <div className="container">
                <h1>Shopping Cart</h1>

                {cartItems.length === 0 ? (
                    <div className="empty-cart">
                        <p>Your cart is empty</p>
                        <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
                    </div>
                ) : (
                    <div className="cart-grid">
                        <div className="cart-items">
                            {cartItems.map(item => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-image">{item.image}</div>
                                    <div className="cart-item-details">
                                        <h3>{item.name}</h3>
                                        <p>Size: {item.size}</p>
                                        <p className="cart-item-price">₹{item.price}</p>
                                    </div>
                                    <div className="cart-item-quantity">
                                        <button>-</button>
                                        <span>{item.quantity}</span>
                                        <button>+</button>
                                    </div>
                                    <button className="cart-item-remove">Remove</button>
                                </div>
                            ))}
                        </div>

                        <div className="cart-summary">
                            <h2>Order Summary</h2>
                            <div className="summary-row">
                                <span>Subtotal:</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping:</span>
                                <span>₹{shipping.toFixed(2)}</span>
                            </div>
                            <div className="summary-divider"></div>
                            <div className="summary-row summary-total">
                                <span>Total:</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                            <Link to="/checkout" className="btn btn-primary btn-lg">
                                Proceed to Checkout
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
