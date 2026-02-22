import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../firebase/firebaseService';
import './OrderSuccess.css';

const OrderSuccess = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!currentUser || !orderId) return;

            try {
                // In a real app, we might want a specific getOrder(orderId) function
                // For now, we'll fetch user orders and find the matching one to ensure ownership
                const result = await getUserOrders(currentUser.uid);

                if (result.success) {
                    // Try to match by Firestore ID or custom orderNumber
                    const foundOrder = result.data.find(o => o.id === orderId || o.orderNumber === orderId);

                    if (foundOrder) {
                        setOrder(foundOrder);
                    } else {
                        console.error('Order not found');
                        // Optional: Navigate away or show error
                    }
                }
            } catch (error) {
                console.error('Error fetching order:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [currentUser, orderId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="order-success-page loading">
                <div className="loader"></div>
                <p>Loading your invoice...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-success-page error">
                <div className="container">
                    <h1>Order Not Found</h1>
                    <p>We couldn't find the order details you're looking for.</p>
                    <Link to="/" className="btn-primary">Return to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="order-success-page">
            <div className="container">
                <div className="success-header no-print">
                    <div className="success-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h1>Order Placed Successfully!</h1>
                    <p>Thank you for your purchase. A confirmation email has been sent to {order.email}</p>
                </div>

                <div className="invoice-container">
                    <div className="invoice-header">
                        <div className="invoice-brand">
                            <h2>DreamBoys</h2>
                            <p>Premium Fashion Store</p>
                        </div>
                        <div className="invoice-meta">
                            <h3>INVOICE</h3>
                            <p><strong>Order ID:</strong> {order.orderNumber}</p>
                            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <span className={`status-badge ${order.status}`}>{order.status}</span></p>
                        </div>
                    </div>

                    <div className="invoice-body">
                        <div className="invoice-section shipping-info">
                            <h4>Bill To:</h4>
                            <p><strong>{order.shippingAddress.fullName}</strong></p>
                            <p>{order.shippingAddress.street}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                            <p>{order.shippingAddress.country}</p>
                            <p>Phone: {order.shippingAddress.phone}</p>
                            <p>Email: {order.shippingAddress.email}</p>
                        </div>

                        <div className="invoice-section payment-info">
                            <h4>Payment Method:</h4>
                            <p>{order.paymentMethod ? order.paymentMethod.replace('cod', 'Cash on Delivery').replace('online', 'Online Payment') : 'Standard'}</p>
                        </div>

                        <div className="invoice-items">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Size / Color</th>
                                        <th className="text-right">Price</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="item-name">{item.name}</div>
                                                <div className="item-sku text-muted">SKU: {item.id}</div>
                                            </td>
                                            <td>{item.selectedSize} / {item.selectedColor}</td>
                                            <td className="text-right">₹{item.price.toFixed(2)}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="invoice-totals">
                            <div className="total-row">
                                <span>Subtotal:</span>
                                <span>₹{order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Shipping:</span>
                                <span>{order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</span>
                            </div>
                            <div className="total-row grand-total">
                                <span>Total:</span>
                                <span>₹{order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="invoice-footer">
                        <p>Thank you for shopping with DreamBoys!</p>
                        <p className="support-contact">Questions? Contact us at support@dreamboys.com</p>
                    </div>
                </div>

                <div className="success-actions no-print">
                    <button onClick={handlePrint} className="btn-secondary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Print Invoice
                    </button>
                    <Link to="/orders" className="btn-secondary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="3" width="15" height="13"></rect>
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 18 1 18 1 3"></polygon>
                            <circle cx="5.5" cy="18.5" r="2.5"></circle>
                            <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                        Track Order
                    </Link>
                    <Link to="/" className="btn-primary">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
