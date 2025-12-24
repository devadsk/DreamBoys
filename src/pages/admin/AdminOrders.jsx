import React, { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../../firebase/firebaseService';
import { useToast } from '../../context/ToastContext';
import '../admin/AdminDashboard.css';
import './AdminOrders.css';

const AdminOrders = () => {
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, processing, shipped, delivered, cancelled
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const ordersData = await getAllOrders();
            // Sort by creation date (newest first)
            const sortedOrders = ordersData.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setOrders(sortedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        if (!window.confirm(`Update order status to "${newStatus}"?`)) {
            return;
        }

        try {
            setUpdating(true);
            await updateOrderStatus(orderId, newStatus);

            // Update local state
            setOrders(orders.map(order =>
                order.id === orderId
                    ? { ...order, status: newStatus }
                    : order
            ));

            toast.success('Order status updated successfully!');
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Failed to update order status');
        } finally {
            setUpdating(false);
        }
    };

    const getFilteredOrders = () => {
        if (filter === 'all') return orders;
        return orders.filter(order => order.status === filter);
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            pending: 'status-pending',
            processing: 'status-processing',
            shipped: 'status-shipped',
            delivered: 'status-delivered',
            cancelled: 'status-cancelled'
        };
        return statusClasses[status] || 'status-pending';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredOrders = getFilteredOrders();

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="container">
                    <div className="loading-state">
                        <p>Loading orders...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="container">
                <div className="admin-header">
                    <h1>Manage Orders</h1>
                    <button className="btn-refresh" onClick={fetchOrders}>
                        🔄 Refresh
                    </button>
                </div>

                {/* Order Statistics */}
                <div className="order-stats">
                    <div className="stat-card">
                        <h3>{orders.length}</h3>
                        <p>Total Orders</p>
                    </div>
                    <div className="stat-card">
                        <h3>{orders.filter(o => o.status === 'pending').length}</h3>
                        <p>Pending</p>
                    </div>
                    <div className="stat-card">
                        <h3>{orders.filter(o => o.status === 'processing').length}</h3>
                        <p>Processing</p>
                    </div>
                    <div className="stat-card">
                        <h3>{orders.filter(o => o.status === 'shipped').length}</h3>
                        <p>Shipped</p>
                    </div>
                    <div className="stat-card">
                        <h3>{orders.filter(o => o.status === 'delivered').length}</h3>
                        <p>Delivered</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="order-filters">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        All ({orders.length})
                    </button>
                    <button
                        className={filter === 'pending' ? 'active' : ''}
                        onClick={() => setFilter('pending')}
                    >
                        Pending ({orders.filter(o => o.status === 'pending').length})
                    </button>
                    <button
                        className={filter === 'processing' ? 'active' : ''}
                        onClick={() => setFilter('processing')}
                    >
                        Processing ({orders.filter(o => o.status === 'processing').length})
                    </button>
                    <button
                        className={filter === 'shipped' ? 'active' : ''}
                        onClick={() => setFilter('shipped')}
                    >
                        Shipped ({orders.filter(o => o.status === 'shipped').length})
                    </button>
                    <button
                        className={filter === 'delivered' ? 'active' : ''}
                        onClick={() => setFilter('delivered')}
                    >
                        Delivered ({orders.filter(o => o.status === 'delivered').length})
                    </button>
                    <button
                        className={filter === 'cancelled' ? 'active' : ''}
                        onClick={() => setFilter('cancelled')}
                    >
                        Cancelled ({orders.filter(o => o.status === 'cancelled').length})
                    </button>
                </div>

                {/* Orders Table */}
                <div className="admin-card">
                    {filteredOrders.length === 0 ? (
                        <div className="empty-state">
                            <p>No orders found</p>
                        </div>
                    ) : (
                        <div className="orders-table-container">
                            <table className="orders-table">
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order.id}>
                                            <td className="order-number">#{order.orderNumber}</td>
                                            <td>{formatDate(order.createdAt)}</td>
                                            <td>
                                                <div className="customer-info">
                                                    <strong>{order.shippingAddress?.fullName || 'N/A'}</strong>
                                                    <span>{order.email}</span>
                                                </div>
                                            </td>
                                            <td>{order.items?.length || 0} items</td>
                                            <td className="order-total">₹{order.total?.toFixed(2)}</td>
                                            <td>
                                                <span className={`payment-badge ${order.paymentMethod === 'cod' ? 'payment-cod' : 'payment-online'}`}>
                                                    {order.paymentMethod === 'cod' ? 'COD' : 'Online'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-view"
                                                    onClick={() => setSelectedOrder(order)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Order Details Modal */}
                {selectedOrder && (
                    <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                        <div className="modal-content order-details-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Order Details - #{selectedOrder.orderNumber}</h2>
                                <button className="btn-close" onClick={() => setSelectedOrder(null)}>×</button>
                            </div>

                            <div className="modal-body">
                                {/* Order Info */}
                                <div className="detail-section">
                                    <h3>Order Information</h3>
                                    <div className="detail-grid">
                                        <div>
                                            <label>Order Date:</label>
                                            <p>{formatDate(selectedOrder.createdAt)}</p>
                                        </div>
                                        <div>
                                            <label>Status:</label>
                                            <span className={`status-badge ${getStatusBadgeClass(selectedOrder.status)}`}>
                                                {selectedOrder.status}
                                            </span>
                                        </div>
                                        <div>
                                            <label>Payment Method:</label>
                                            <p>{selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : selectedOrder.paymentMethod?.toUpperCase()}</p>
                                        </div>
                                        <div>
                                            <label>Total Amount:</label>
                                            <p className="amount">₹{selectedOrder.total?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="detail-section">
                                    <h3>Customer Details</h3>
                                    <div className="detail-grid">
                                        <div>
                                            <label>Name:</label>
                                            <p>{selectedOrder.shippingAddress?.fullName}</p>
                                        </div>
                                        <div>
                                            <label>Email:</label>
                                            <p>{selectedOrder.email}</p>
                                        </div>
                                        <div>
                                            <label>Phone:</label>
                                            <p>{selectedOrder.shippingAddress?.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="detail-section">
                                    <h3>Shipping Address</h3>
                                    <p>
                                        {selectedOrder.shippingAddress?.street}<br />
                                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}<br />
                                        {selectedOrder.shippingAddress?.country}
                                    </p>
                                </div>

                                {/* Order Items */}
                                <div className="detail-section">
                                    <h3>Order Items</h3>
                                    <div className="order-items-list">
                                        {selectedOrder.items?.map((item, index) => (
                                            <div key={index} className="order-item">
                                                <img src={item.image} alt={item.name} />
                                                <div className="item-details">
                                                    <h4>{item.name}</h4>
                                                    <p>Size: {item.size} | Color: {item.color}</p>
                                                    <p>Quantity: {item.quantity}</p>
                                                </div>
                                                <div className="item-price">
                                                    ₹{(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Update Status */}
                                <div className="detail-section">
                                    <h3>Update Order Status</h3>
                                    <div className="status-actions">
                                        {selectedOrder.status === 'pending' && (
                                            <>
                                                <button
                                                    className="btn-status btn-processing"
                                                    onClick={() => handleStatusUpdate(selectedOrder.id, 'processing')}
                                                    disabled={updating}
                                                >
                                                    Mark as Processing
                                                </button>
                                                <button
                                                    className="btn-status btn-cancelled"
                                                    onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')}
                                                    disabled={updating}
                                                >
                                                    Cancel Order
                                                </button>
                                            </>
                                        )}
                                        {selectedOrder.status === 'processing' && (
                                            <button
                                                className="btn-status btn-shipped"
                                                onClick={() => handleStatusUpdate(selectedOrder.id, 'shipped')}
                                                disabled={updating}
                                            >
                                                Mark as Shipped
                                            </button>
                                        )}
                                        {selectedOrder.status === 'shipped' && (
                                            <button
                                                className="btn-status btn-delivered"
                                                onClick={() => handleStatusUpdate(selectedOrder.id, 'delivered')}
                                                disabled={updating}
                                            >
                                                Mark as Delivered
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
