import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCw,
    Search,
    Filter,
    Eye,
    Truck,
    Package,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    MapPin,
    Calendar,
    CreditCard,
    User,
    Mail,
    Phone,
    X,
    ChevronDown,
    ArrowUpRight
} from 'lucide-react';
import { getAllOrders, updateOrderStatus, initiateShipment } from '../../firebase/firebaseService';
import { useToast } from '../../context/ToastContext';
import '../admin/AdminDashboard.css'; // Keep for some potential shared styles if needed, but rely mainly on local + variables
import './AdminOrders.css';

const AdminOrders = () => {
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, pending, processing, shipped, delivered, cancelled
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Shipment Location Modal State
    const [showShipLocationModal, setShowShipLocationModal] = useState(false);
    const [pendingShipmentOrderId, setPendingShipmentOrderId] = useState(null);
    const [pickupLocation, setPickupLocation] = useState('Outpost Branch');

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
            // Update selected order view if open
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
            // Close modal if status update completes flow (optional, keeping open for now)
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Failed to update order status');
        } finally {
            setUpdating(false);
        }
    };

    const handleInitiateShipment = (orderId) => {
        setPendingShipmentOrderId(orderId);
        setPickupLocation('Home'); // Default to 'Home' - the only location in Shiprocket
        setShowShipLocationModal(true);
    };

    const confirmShipment = async () => {
        if (!pendingShipmentOrderId) return;

        try {
            setUpdating(true);
            const res = await initiateShipment(pendingShipmentOrderId, pickupLocation);
            if (res.success) {
                toast.success(`Shipment initiated from ${pickupLocation}!`);
                const updatedDelivery = res.delivery || res.data?.delivery;

                // Update local state
                setOrders(orders.map(order =>
                    order.id === pendingShipmentOrderId
                        ? { ...order, status: 'shipped', delivery: updatedDelivery }
                        : order
                ));

                // Update selected order view if open
                if (selectedOrder && selectedOrder.id === pendingShipmentOrderId) {
                    setSelectedOrder(prev => ({ ...prev, status: 'shipped', delivery: updatedDelivery }));
                }

                setShowShipLocationModal(false);
                setPendingShipmentOrderId(null);
            } else {
                toast.error(`Shipment Initiation Failed: ${res.error}`);
            }
        } catch (error) {
            console.error('Error initiating shipment:', error);
            toast.error('Failed to initiate shipment');
        } finally {
            setUpdating(false);
        }
    };


    const getFilteredOrders = () => {
        if (activeTab === 'all') return orders;
        return orders.filter(order => order.status === activeTab);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock size={14} />;
            case 'processing': return <RefreshCw size={14} />;
            case 'packed': return <Package size={14} />;
            case 'shipped': return <Truck size={14} />;
            case 'delivered': return <CheckCircle size={14} />;
            case 'cancelled': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
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

    return (
        <div className="admin-page-content">
            <div className="page-header">
                <div>
                    <h1>Manage Orders</h1>
                    <p className="subtitle">Track and manage customer orders</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={fetchOrders} title="Refresh Orders">
                        <RefreshCw size={18} /> Refresh
                    </button>
                </div>
            </div>

            {/* Order Statistics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper icon-blue">
                        <Package size={24} />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Total Orders</p>
                        <h3 className="stat-value">{orders.length}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper icon-yellow">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Pending</p>
                        <h3 className="stat-value">{orders.filter(o => o.status === 'pending').length}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper icon-purple">
                        <Truck size={24} />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Shipped</p>
                        <h3 className="stat-value">{orders.filter(o => o.status === 'shipped').length}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper icon-green">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Delivered</p>
                        <h3 className="stat-value">{orders.filter(o => o.status === 'delivered').length}</h3>
                    </div>
                </div>
            </div>

            {/* NEW PILL TABS */}
            <div className="mb-6">
                <div className="filter-tabs-container">
                    {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`filter-tab-pill ${activeTab === tab ? 'active' : ''}`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabOrder"
                                    className="active-pill-bg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="capitalize">{tab}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="products-table-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} className="text-muted mb-2" />
                        <p>No orders found matching this filter.</p>
                    </div>
                ) : (
                    <table className="admin-table">
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
                                <tr key={order.id} onClick={() => setSelectedOrder(order)} role="button" tabIndex={0}>
                                    <td className="font-mono font-bold text-primary">#{order.orderNumber}</td>
                                    <td className="text-secondary text-sm">{formatDate(order.createdAt)}</td>
                                    <td>
                                        <div className="customer-cell">
                                            <span className="font-medium">{order.shippingAddress?.fullName || 'N/A'}</span>
                                            <span className="text-muted text-xs">{order.email}</span>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-neutral">{order.items?.length || 0} items</span></td>
                                    <td className="font-medium">₹{order.total?.toFixed(2)}</td>
                                    <td>
                                        <span className={`badge ${order.paymentMethod === 'cod' ? 'badge-warning' : 'badge-success'}`}>
                                            {order.paymentMethod === 'cod' ? 'COD' : 'Online'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill status-${order.status}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-icon btn-view"
                                            onClick={() => setSelectedOrder(order)}
                                            title="View Details"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-content order-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl">Order #{selectedOrder.orderNumber}</h2>
                                    <span className={`status-pill status-${selectedOrder.status}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <p className="text-sm text-secondary mt-1">{formatDate(selectedOrder.createdAt)}</p>
                            </div>
                            <button className="btn-icon-small" onClick={() => setSelectedOrder(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body-scroll">
                            <div className="details-grid">
                                {/* Customer & Shipping */}
                                <div className="detail-card">
                                    <h3><User size={16} /> Customer Info</h3>
                                    <div className="info-list">
                                        <div className="info-item">
                                            <span className="label">Name</span>
                                            <span className="value">{selectedOrder.shippingAddress?.fullName}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Email</span>
                                            <span className="value">{selectedOrder.email}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Phone</span>
                                            <span className="value">{selectedOrder.shippingAddress?.phone}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Address</span>
                                            <span className="value text-sm">
                                                {selectedOrder.shippingAddress?.street}<br />
                                                {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}<br />
                                                {selectedOrder.shippingAddress?.zipCode}, {selectedOrder.shippingAddress?.country}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order & Payment */}
                                <div className="detail-card">
                                    <h3><CreditCard size={16} /> Payment & Summary</h3>
                                    <div className="info-list">
                                        <div className="info-item">
                                            <span className="label">Method</span>
                                            <span className="value capitalize">{selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : selectedOrder.paymentMethod}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Subtotal</span>
                                            <span className="value">₹{selectedOrder.subtotal?.toFixed(2) || selectedOrder.total?.toFixed(2)}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Shipping</span>
                                            <span className="value">₹0.00</span>
                                        </div>
                                        <div className="info-item total">
                                            <span className="label">Total</span>
                                            <span className="value text-primary">₹{selectedOrder.total?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery Info if available */}
                                {selectedOrder.delivery && (
                                    <div className="detail-card full-width">
                                        <h3><Truck size={16} /> Delivery Tracking</h3>
                                        <div className="delivery-status-box">
                                            <div className="status-steps">
                                                <div className="step completed">
                                                    <div className="dot"></div>
                                                    <div className="label">Ordered</div>
                                                </div>
                                                <div className={`step ${['processing', 'packed', 'shipped', 'delivered'].includes(selectedOrder.status) ? 'completed' : ''}`}>
                                                    <div className="dot"></div>
                                                    <div className="label">Processing</div>
                                                </div>
                                                <div className={`step ${['shipped', 'delivered'].includes(selectedOrder.status) ? 'completed' : ''}`}>
                                                    <div className="dot"></div>
                                                    <div className="label">Shipped</div>
                                                </div>
                                                <div className={`step ${selectedOrder.status === 'delivered' ? 'completed' : ''}`}>
                                                    <div className="dot"></div>
                                                    <div className="label">Delivered</div>
                                                </div>
                                            </div>
                                            <div className="tracking-details">
                                                <div className="track-row">
                                                    <span className="text-secondary">Courier:</span>
                                                    <span className="font-medium">{selectedOrder.delivery.courier || 'N/A'}</span>
                                                </div>
                                                <div className="track-row">
                                                    <span className="text-secondary">Tracking ID:</span>
                                                    <span className="font-mono">{selectedOrder.delivery.trackingId || 'N/A'}</span>
                                                </div>
                                                {selectedOrder.delivery.trackingUrl && (
                                                    <a href={selectedOrder.delivery.trackingUrl} target="_blank" rel="noopener noreferrer" className="track-link">
                                                        Track Package <ArrowUpRight size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Order Items */}
                            <div className="order-items-section">
                                <h3>Order Items ({selectedOrder.items?.length})</h3>
                                <div className="order-items-list">
                                    {selectedOrder.items?.map((item, index) => (
                                        <div key={index} className="order-item-row">
                                            <div className="item-image">
                                                <img src={item.image} alt={item.name} />
                                            </div>
                                            <div className="item-details">
                                                <h4>{item.name}</h4>
                                                <div className="item-meta">
                                                    <span className="meta-tag">Size: {item.selectedSize}</span>
                                                    <span className="meta-tag">Color: {item.selectedColor}</span>
                                                </div>
                                            </div>
                                            <div className="item-qty">
                                                x{item.quantity}
                                            </div>
                                            <div className="item-price">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions Bar */}
                            <div className="modal-actions-bar">
                                <div className="action-group">
                                    {/* Action buttons based on status */}
                                    {(selectedOrder.status === 'pending' || selectedOrder.status === 'placed' || selectedOrder.status === 'processing') && (
                                        <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(selectedOrder.id, 'confirmed')} disabled={updating}>
                                            <CheckCircle size={16} /> Confirm Order
                                        </button>
                                    )}

                                    {/* Allow initiation from confirmed or packed status if not already initiated */}
                                    {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'packed') && !selectedOrder.delivery?.shipmentId && (
                                        <button className="btn btn-primary btn-sm" onClick={() => handleInitiateShipment(selectedOrder.id)} disabled={updating}>
                                            <Truck size={16} /> Initiate Shipment
                                        </button>
                                    )}

                                    {selectedOrder.status === 'confirmed' && (
                                        <button className="btn btn-outline btn-sm" onClick={() => handleStatusUpdate(selectedOrder.id, 'packed')} disabled={updating}>
                                            <Package size={16} /> Mark Packed
                                        </button>
                                    )}

                                    {selectedOrder.status === 'packed' && selectedOrder.delivery?.shipmentId && (
                                        <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(selectedOrder.id, 'shipped')} disabled={updating}>
                                            <Truck size={16} /> Mark Shipped
                                        </button>
                                    )}

                                    {selectedOrder.status === 'shipped' && (
                                        <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(selectedOrder.id, 'delivered')} disabled={updating}>
                                            <CheckCircle size={16} /> Mark Delivered
                                        </button>
                                    )}

                                    {/* Allow cancellation from packed status too */}
                                    {['pending', 'placed', 'confirmed', 'processing', 'packed'].includes(selectedOrder.status) && (
                                        <button className="btn btn-danger btn-sm" onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')} disabled={updating}>
                                            <XCircle size={16} /> Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shipment Location Modal */}
            {showShipLocationModal && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><MapPin size={20} /> Select Pickup Location</h3>
                            <button className="btn-icon-small" onClick={() => setShowShipLocationModal(false)}><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-secondary mb-4">
                                Choose the branch to ship Order #{orders.find(o => o.id === pendingShipmentOrderId)?.orderNumber} from:
                            </p>

                            <div className="form-group mb-4">
                                <label className="form-label">Pickup Location</label>
                                <select
                                    className="form-select w-full"
                                    value={pickupLocation}
                                    onChange={(e) => setPickupLocation(e.target.value)}
                                >
                                    <option value="Outpost Branch">Outpost Branch</option>
                                    <option value="Chavadi Branch">Chavadi Branch</option>
                                    <option value="Pasumalai Branch">Pasumalai Branch</option>
                                    <option value="Home">Home</option>
                                </select>
                            </div>



                            <div className="flex justify-end gap-2 mt-6">
                                <button className="btn btn-outline" onClick={() => setShowShipLocationModal(false)} disabled={updating}>Cancel</button>
                                <button className="btn btn-primary" onClick={confirmShipment} disabled={updating}>
                                    {updating ? 'Processing...' : 'Confirm & Ship'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
