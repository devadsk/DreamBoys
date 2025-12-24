import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getUserOrders, updateOrderStatus, createRefundRequest } from '../firebase/firebaseService';
import { processRazorpayRefund, processCODRefund } from '../utils/razorpayRefund';
import { motion, AnimatePresence } from 'framer-motion';
import InlineLoader from '../components/InlineLoader';
import './Orders.css';

const Orders = () => {
    const { currentUser } = useAuth();
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [refundType, setRefundType] = useState('refund'); // 'refund' or 'replace'
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [currentUser]);

    const fetchOrders = async () => {
        if (currentUser) {
            setLoading(true);
            const result = await getUserOrders(currentUser.uid);
            if (result.success) {
                // Sort by date, newest first
                const sortedOrders = result.data.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                setOrders(sortedOrders);
            } else {
                toast.error('Failed to fetch orders');
            }
            setLoading(false);
        } else {
            setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Pending', color: '#f59e0b', icon: '⏳' },
            confirmed: { label: 'Confirmed', color: '#10b981', icon: '✓' },
            processing: { label: 'Processing', color: '#3b82f6', icon: '📦' },
            packed: { label: 'Packed', color: '#8b5cf6', icon: '📦' },
            shipped: { label: 'Shipped', color: '#8b5cf6', icon: '🚚' },
            'out-for-delivery': { label: 'Out for Delivery', color: '#6366f1', icon: '🚚' },
            delivered: { label: 'Delivered', color: '#10b981', icon: '✅' },
            cancelled: { label: 'Cancelled', color: '#ef4444', icon: '❌' },
            cancellation_pending: { label: 'Cancellation Pending', color: '#f59e0b', icon: '⏳' },
            refund_requested: { label: 'Refund Requested', color: '#f97316', icon: '🔄' },
            refund_approved: { label: 'Refund Approved', color: '#10b981', icon: '✅' },
            refunded: { label: 'Refunded', color: '#6b7280', icon: '💰' },
            replace_requested: { label: 'Replace Requested', color: '#f97316', icon: '🔄' },
            replacement_approved: { label: 'Replacement Approved', color: '#10b981', icon: '✅' },
            replacement_processing: { label: 'Replacement Processing', color: '#3b82f6', icon: '📦' },
            replaced: { label: 'Replaced', color: '#10b981', icon: '✅' }
        };
        return statusMap[status] || statusMap.pending;
    };

    const canCancel = (order) => {
        // Can cancel until delivery (all statuses before delivered)
        return ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery'].includes(order.status);
    };

    const canRefundOrReplace = (order) => {
        if (order.status !== 'delivered') return false;
        const deliveredDate = new Date(order.deliveredAt || order.createdAt);
        const daysSinceDelivery = Math.floor((new Date() - deliveredDate) / (1000 * 60 * 60 * 24));
        return daysSinceDelivery <= 7; // 7 days return window
    };

    const getCancellationRefund = (order) => {
        // Gradual increase in cancellation charges based on order status
        const statusRefundMap = {
            pending: 0.975,      // 97.5% refund (2.5% charge)
            confirmed: 0.96,     // 96% refund (4% charge)
            processing: 0.94,    // 94% refund (6% charge)
            packed: 0.92,        // 92% refund (8% charge)
            shipped: 0.90,       // 90% refund (10% charge)
            'out-for-delivery': 0.90  // 90% refund (10% charge)
        };
        const refundPercentage = statusRefundMap[order.status] || 0.975; // Default to 2.5% charge
        const chargePercentage = (1 - refundPercentage) * 100;
        return {
            percentage: refundPercentage * 100,
            chargePercentage: chargePercentage,
            amount: order.total * refundPercentage,
            chargeAmount: order.total * (1 - refundPercentage)
        };
    };

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            toast.warning('Please provide a cancellation reason');
            return;
        }

        setProcessing(true);
        try {
            const refundInfo = getCancellationRefund(selectedOrder);

            // Create cancellation request for admin approval
            const requestData = {
                type: 'cancel',
                orderId: selectedOrder.id,
                orderNumber: selectedOrder.orderNumber || selectedOrder.id.slice(0, 8),
                userId: currentUser.uid,
                customerName: currentUser.displayName || selectedOrder.shippingAddress?.fullName,
                customerEmail: currentUser.email,
                reason: cancelReason,
                orderTotal: selectedOrder.total,
                refundAmount: refundInfo.amount,
                chargeAmount: refundInfo.chargeAmount,
                chargePercentage: refundInfo.chargePercentage,
                refundPercentage: refundInfo.percentage,
                paymentMethod: selectedOrder.paymentMethod,
                paymentId: selectedOrder.paymentDetails?.razorpay_payment_id || null,
                originalOrderStatus: selectedOrder.status,
                createdAt: new Date().toISOString()
            };

            const result = await createRefundRequest(requestData);

            if (result.success) {
                // Update order status to show cancellation is pending
                await updateOrderStatus(selectedOrder.id, 'cancellation_pending', {
                    cancellationRequestedAt: new Date().toISOString(),
                    cancellationRequestId: result.id
                });

                toast.success('Cancellation request submitted! Admin will review it shortly.');
                setShowCancelModal(false);
                setCancelReason('');
                setSelectedOrder(null);
                fetchOrders();
            } else {
                toast.error('Failed to submit cancellation request');
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
        setProcessing(false);
    };

    const handleRefundRequest = async () => {
        if (!refundReason.trim()) {
            toast.warning('Please provide a reason');
            return;
        }

        setProcessing(true);
        try {
            const newStatus = refundType === 'refund' ? 'refund_requested' : 'replace_requested';

            // Create refund/replace request for admin approval
            const requestData = {
                type: refundType,
                orderId: selectedOrder.id,
                orderNumber: selectedOrder.orderNumber || selectedOrder.id.slice(0, 8),
                userId: currentUser.uid,
                customerName: currentUser.displayName || selectedOrder.shippingAddress?.fullName,
                customerEmail: currentUser.email,
                reason: refundReason,
                orderTotal: selectedOrder.total,
                refundAmount: refundType === 'refund' ? selectedOrder.total : 0, // No refund for replace
                amount: selectedOrder.total,
                paymentMethod: selectedOrder.paymentMethod,
                paymentId: selectedOrder.paymentDetails?.razorpay_payment_id || null,
                createdAt: new Date().toISOString()
            };

            const result = await createRefundRequest(requestData);

            if (result.success) {
                await updateOrderStatus(selectedOrder.id, newStatus, {
                    [`${refundType}RequestedAt`]: new Date().toISOString(),
                    [`${refundType}Reason`]: refundReason,
                    [`${refundType}RequestId`]: result.id
                });

                toast.success(`${refundType === 'refund' ? 'Refund' : 'Replacement'} request submitted! Admin will review it shortly.`);
                setShowRefundModal(false);
                setRefundReason('');
                setSelectedOrder(null);
                fetchOrders();
            } else {
                toast.error('Failed to submit request');
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
        setProcessing(false);
    };

    const generateInvoice = (order) => {
        setSelectedOrder(order);
        setShowInvoice(true);
    };

    const printInvoice = () => {
        window.print();
    };

    const downloadInvoice = () => {
        // In a real app, you'd generate a PDF here
        toast.info('Invoice download feature coming soon!');
    };

    if (loading) {
        return (
            <div className="orders-page">
                <div className="container" style={{ minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <InlineLoader message="Loading your orders..." />
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="container">
                <div className="orders-header">
                    <h1>My Orders</h1>
                    <p className="orders-subtitle">Track, manage and review your orders</p>
                </div>

                {orders.length === 0 ? (
                    <div className="no-orders">
                        <div className="no-orders-icon">📦</div>
                        <h3>No orders yet</h3>
                        <p>Start shopping to see your orders here</p>
                        <a href="/products" className="btn btn-primary">Start Shopping</a>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => {
                            const statusInfo = getStatusInfo(order.status);
                            return (
                                <motion.div
                                    key={order.id}
                                    className="order-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="order-card-header">
                                        <div className="order-info">
                                            <h3>Order #{order.orderNumber || order.id.slice(0, 8)}</h3>
                                            <p className="order-date">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                {new Date(order.createdAt || order.date).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <span className="order-status-badge" style={{ background: statusInfo.color }}>
                                            <span className="status-icon">{statusInfo.icon}</span>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    <div className="order-items-preview">
                                        {order.items.slice(0, 2).map((item, index) => (
                                            <div key={index} className="order-item-preview">
                                                <img src={item.image} alt={item.name} />
                                                <div className="item-details">
                                                    <h4>{item.name}</h4>
                                                    <p>Qty: {item.quantity} • Size: {item.selectedSize} • Color: {item.selectedColor}</p>
                                                </div>
                                                <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        {order.items.length > 2 && (
                                            <p className="more-items">+{order.items.length - 2} more item(s)</p>
                                        )}
                                    </div>

                                    {/* Refund Status Display */}
                                    {(order.status === 'cancelled' || order.status === 'refunded') && order.refundStatus && (
                                        <div className="refund-status-info">
                                            <h4>💰 Refund Information</h4>

                                            <div className={`refund-status-badge ${order.refundStatus}`}>
                                                {order.refundStatus === 'processed' && '✅ Refund Processed'}
                                                {order.refundStatus === 'pending' && '⏳ Refund Pending'}
                                                {order.refundStatus === 'manual_processing' && '👤 Processing'}
                                                {order.refundStatus === 'failed' && '❌ Refund Failed'}
                                            </div>

                                            <div className="refund-details">
                                                <div className="refund-row">
                                                    <span>Refund Amount:</span>
                                                    <span className="refund-amount">₹{order.refundAmount?.toFixed(2)}</span>
                                                </div>

                                                {order.refundStatus === 'processed' && (
                                                    <p className="refund-note success">
                                                        ✓ Refund has been processed successfully. Money will be credited to your account within 5-7 business days.
                                                    </p>
                                                )}

                                                {order.refundStatus === 'pending' && (
                                                    <p className="refund-note warning">
                                                        ⏳ Your refund is being processed. Please wait...
                                                    </p>
                                                )}

                                                {order.refundStatus === 'manual_processing' && (
                                                    <p className="refund-note info">
                                                        👤 Your refund is being processed. Our team will contact you shortly.
                                                    </p>
                                                )}

                                                {order.refundStatus === 'failed' && (
                                                    <p className="refund-note error">
                                                        ❌ Refund processing failed. Please contact our support team.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Customer Notification Banner */}
                                    {order.customerNotification && !order.customerNotificationRead && (
                                        <div className="customer-notification-banner">
                                            <div className="notification-icon">
                                                {order.status === 'cancelled' && '✅'}
                                                {order.status === 'refund_approved' && '📦'}
                                                {order.status === 'replacement_approved' && '🔄'}
                                            </div>
                                            <div className="notification-content">
                                                <h4>Update from Admin</h4>
                                                <p>{order.customerNotification}</p>
                                            </div>
                                            <button
                                                className="notification-dismiss"
                                                onClick={async () => {
                                                    await updateOrderStatus(order.id, order.status, {
                                                        customerNotificationRead: true
                                                    });
                                                    fetchOrders();
                                                }}
                                                title="Dismiss"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}

                                    <div className="order-card-footer">
                                        <div className="order-total-section">
                                            <span className="total-label">Total Amount</span>
                                            <span className="total-amount">₹{order.total.toFixed(2)}</span>
                                        </div>
                                        <div className="order-actions">
                                            <button
                                                className="btn-action btn-invoice"
                                                onClick={() => generateInvoice(order)}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                                    <polyline points="10 9 9 9 8 9"></polyline>
                                                </svg>
                                                Invoice
                                            </button>

                                            {canCancel(order) && (
                                                <button
                                                    className="btn-action btn-cancel"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowCancelModal(true);
                                                    }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                                    </svg>
                                                    Cancel
                                                </button>
                                            )}

                                            {canRefundOrReplace(order) && (
                                                <button
                                                    className="btn-action btn-refund"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowRefundModal(true);
                                                    }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="23 4 23 10 17 10"></polyline>
                                                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                                    </svg>
                                                    Return
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Invoice Modal */}
            <AnimatePresence>
                {showInvoice && selectedOrder && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowInvoice(false)}
                    >
                        <motion.div
                            className="invoice-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="invoice-header">
                                <h2>Invoice</h2>
                                <button className="modal-close" onClick={() => setShowInvoice(false)}>×</button>
                            </div>

                            <div className="invoice-content">
                                <div className="invoice-company">
                                    <h1>DreamBoys</h1>
                                    <p>Premium Fashion Store</p>
                                    <p>contact@dreamboys.com</p>
                                </div>

                                <div className="invoice-details-grid">
                                    <div>
                                        <h4>Invoice To:</h4>
                                        <p><strong>{selectedOrder.shippingAddress?.fullName}</strong></p>
                                        <p>{selectedOrder.shippingAddress?.street}</p>
                                        <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                                        <p>{selectedOrder.shippingAddress?.zipCode}</p>
                                        <p>{selectedOrder.email}</p>
                                    </div>
                                    <div>
                                        <h4>Invoice Details:</h4>
                                        <p><strong>Order #:</strong> {selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}</p>
                                        <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                        <p><strong>Payment:</strong> {selectedOrder.paymentMethod?.toUpperCase()}</p>
                                        <p><strong>Status:</strong> {getStatusInfo(selectedOrder.status).label}</p>
                                    </div>
                                </div>

                                <table className="invoice-table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Qty</th>
                                            <th>Price</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <strong>{item.name}</strong>
                                                    <br />
                                                    <small>Size: {item.selectedSize}, Color: {item.selectedColor}</small>
                                                </td>
                                                <td>{item.quantity}</td>
                                                <td>₹{item.price.toFixed(2)}</td>
                                                <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3"><strong>Subtotal</strong></td>
                                            <td><strong>₹{selectedOrder.subtotal?.toFixed(2) || selectedOrder.total.toFixed(2)}</strong></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3">Shipping</td>
                                            <td>₹{selectedOrder.shipping?.toFixed(2) || '0.00'}</td>
                                        </tr>
                                        <tr className="total-row">
                                            <td colSpan="3"><strong>Total</strong></td>
                                            <td><strong>₹{selectedOrder.total.toFixed(2)}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>

                                <div className="invoice-footer">
                                    <p>Thank you for shopping with DreamBoys!</p>
                                    <p className="invoice-note">This is a computer-generated invoice and does not require a signature.</p>
                                </div>
                            </div>

                            <div className="invoice-actions">
                                <button className="btn btn-outline" onClick={printInvoice}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                        <rect x="6" y="14" width="12" height="8"></rect>
                                    </svg>
                                    Print
                                </button>
                                <button className="btn btn-primary" onClick={downloadInvoice}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    Download PDF
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cancel Order Modal */}
            <AnimatePresence>
                {showCancelModal && selectedOrder && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCancelModal(false)}
                    >
                        <motion.div
                            className="action-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Cancel Order</h3>
                                <button className="modal-close" onClick={() => setShowCancelModal(false)}>×</button>
                            </div>

                            <div className="modal-body">
                                <div className="refund-info">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <h4>Cancellation Policy</h4>
                                    <p>Order Status: <strong>{getStatusInfo(selectedOrder.status).label}</strong></p>

                                    <div className="refund-breakdown">
                                        <div className="breakdown-row">
                                            <span>Order Total:</span>
                                            <span>₹{selectedOrder.total.toFixed(2)}</span>
                                        </div>
                                        <div className="breakdown-row charge">
                                            <span>Cancellation Charge ({getCancellationRefund(selectedOrder).chargePercentage.toFixed(1)}%):</span>
                                            <span>- ₹{getCancellationRefund(selectedOrder).chargeAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="breakdown-row total">
                                            <span>Refund Amount:</span>
                                            <span>₹{getCancellationRefund(selectedOrder).amount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <p className="refund-note">✓ Refund will be processed within 5-7 business days</p>
                                </div>

                                <div className="form-group">
                                    <label>Reason for Cancellation *</label>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Please tell us why you're cancelling this order..."
                                        rows="4"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button className="btn btn-outline" onClick={() => setShowCancelModal(false)}>
                                    Keep Order
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleCancelOrder}
                                    disabled={processing}
                                >
                                    {processing ? 'Processing...' : 'Confirm Cancellation'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Refund/Replace Modal */}
            <AnimatePresence>
                {showRefundModal && selectedOrder && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowRefundModal(false)}
                    >
                        <motion.div
                            className="action-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Return Order</h3>
                                <button className="modal-close" onClick={() => setShowRefundModal(false)}>×</button>
                            </div>

                            <div className="modal-body">
                                <div className="return-type-selector">
                                    <button
                                        className={`return-type-btn ${refundType === 'refund' ? 'active' : ''}`}
                                        onClick={() => setRefundType('refund')}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="1" x2="12" y2="23"></line>
                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                        </svg>
                                        <span>Refund</span>
                                        <p>Get money back</p>
                                    </button>
                                    <button
                                        className={`return-type-btn ${refundType === 'replace' ? 'active' : ''}`}
                                        onClick={() => setRefundType('replace')}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="23 4 23 10 17 10"></polyline>
                                            <polyline points="1 20 1 14 7 14"></polyline>
                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                        </svg>
                                        <span>Replace</span>
                                        <p>Get new product</p>
                                    </button>
                                </div>

                                <div className="return-info">
                                    <p>✓ 7-day return window</p>
                                    <p>✓ Free pickup from your address</p>
                                    <p>✓ {refundType === 'refund' ? 'Refund in 5-7 days' : 'Replacement in 7-10 days'}</p>
                                </div>

                                <div className="form-group">
                                    <label>Reason for {refundType === 'refund' ? 'Refund' : 'Replacement'} *</label>
                                    <textarea
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        placeholder={`Please tell us why you want a ${refundType}...`}
                                        rows="4"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button className="btn btn-outline" onClick={() => setShowRefundModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleRefundRequest}
                                    disabled={processing}
                                >
                                    {processing ? 'Submitting...' : `Request ${refundType === 'refund' ? 'Refund' : 'Replacement'}`}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Orders;
