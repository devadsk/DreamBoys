import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../firebase/firebaseService';
import './Checkout.css';

const Checkout = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { cart, getCartTotal, clearCart } = useCart();

    // Calculate totals
    const subtotal = getCartTotal();
    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal + shipping;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: currentUser?.displayName || '',
        email: currentUser?.email || '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        cardNumber: '',
        expiryDate: '',
        cvv: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert('Please log in to place an order');
            navigate('/login');
            return;
        }

        if (cart.length === 0) {
            alert('Your cart is empty');
            navigate('/products');
            return;
        }

        setLoading(true);

        try {
            // Prepare order data
            // Use JSON parse/stringify to remove any undefined values which Firestore hates
            const sanitizedCart = cart.map(item => {
                // Ensure no undefined values in cart items
                const cleanItem = JSON.parse(JSON.stringify(item));
                return cleanItem;
            });

            const rawOrderData = {
                userId: currentUser.uid,
                userName: formData.fullName || '', // Ensure fallback
                userEmail: formData.email || '',
                items: sanitizedCart,
                subtotal: subtotal || 0,
                shipping: shipping || 0,
                total: total || 0,
                shippingAddress: {
                    fullName: formData.fullName || '',
                    phone: formData.phone || '',
                    address: formData.address || '',
                    city: formData.city || '',
                    zipCode: formData.zipCode || ''
                },
                paymentMethod: 'Card',
                status: 'processing',
                createdAt: new Date().toISOString()
            };

            const orderData = JSON.parse(JSON.stringify(rawOrderData));

            const result = await createOrder(orderData);

            if (result.success) {
                clearCart();
                // alert('Order placed successfully!');
                navigate('/orders');
            } else {
                alert('Failed to place order: ' + result.error);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout-page">
            <div className="container">
                <h1>Checkout</h1>

                <form onSubmit={handleSubmit} className="checkout-form">
                    <div className="checkout-section">
                        <h2>Shipping Information</h2>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    className="form-input"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                className="form-input"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <input
                                type="text"
                                name="address"
                                className="form-input"
                                value={formData.address}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    className="form-input"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">ZIP Code</label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    className="form-input"
                                    value={formData.zipCode}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="checkout-section">
                        <h2>Payment Information</h2>
                        <p className="payment-note">Note: Payment integration (Stripe/Razorpay) to be added</p>

                        <div className="form-group">
                            <label className="form-label">Card Number</label>
                            <input
                                type="text"
                                name="cardNumber"
                                className="form-input"
                                placeholder="1234 5678 9012 3456"
                                value={formData.cardNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Expiry Date</label>
                                <input
                                    type="text"
                                    name="expiryDate"
                                    className="form-input"
                                    placeholder="MM/YY"
                                    value={formData.expiryDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">CVV</label>
                                <input
                                    type="text"
                                    name="cvv"
                                    className="form-input"
                                    placeholder="123"
                                    value={formData.cvv}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? 'Processing...' : `Place Order (₹${total.toFixed(2)})`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Checkout;
