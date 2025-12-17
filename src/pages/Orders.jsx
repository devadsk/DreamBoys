import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../firebase/firebaseService';
import InlineLoader from '../components/InlineLoader';
import './Orders.css';

const Orders = () => {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (currentUser) {
                setLoading(true);
                const result = await getUserOrders(currentUser.uid);
                if (result.success) {
                    setOrders(result.data);
                } else {
                    console.error("Failed to fetch orders:", result.error);
                }
                setLoading(false);
            } else {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [currentUser]);

    const getStatusClass = (status) => {
        switch (status) {
            case 'delivered': return 'status-delivered';
            case 'shipped': return 'status-shipped';
            case 'processing': return 'status-processing';
            default: return '';
        }
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
                <h1>My Orders</h1>

                {orders.length === 0 ? (
                    <div className="no-orders">
                        <p>You haven't placed any orders yet</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div key={order.id} className="order-card">
                                <div className="order-header">
                                    <div>
                                        <h3>Order #{order.id}</h3>
                                        <p className="order-date">{new Date(order.createdAt || order.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`order-status ${getStatusClass(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="order-items">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="order-item">
                                            <span>{item.name} x{item.quantity}</span>
                                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-footer">
                                    <span className="order-total">Total: ₹{order.total.toFixed(2)}</span>
                                    <button className="btn btn-outline">Track Order</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};

export default Orders;
