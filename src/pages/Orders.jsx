import React from 'react';
import './Orders.css';

const Orders = () => {
    // Mock orders (replace with actual data from Firebase)
    const orders = [
        {
            id: 'ORD-001',
            date: '2024-12-01',
            status: 'delivered',
            total: 159.97,
            items: [
                { name: 'Classic White Shirt', quantity: 2, price: 49.99 },
                { name: 'Slim Fit Jeans', quantity: 1, price: 79.99 }
            ]
        },
        {
            id: 'ORD-002',
            date: '2024-11-28',
            status: 'shipped',
            total: 199.99,
            items: [
                { name: 'Leather Jacket', quantity: 1, price: 199.99 }
            ]
        }
    ];

    const getStatusClass = (status) => {
        switch (status) {
            case 'delivered': return 'status-delivered';
            case 'shipped': return 'status-shipped';
            case 'processing': return 'status-processing';
            default: return '';
        }
    };

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
                                        <p className="order-date">{new Date(order.date).toLocaleDateString()}</p>
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
        </div>
    );
};

export default Orders;
