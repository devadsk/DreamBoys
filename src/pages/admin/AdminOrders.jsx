import React from 'react';
import '../admin/AdminDashboard.css';

const AdminOrders = () => {
    return (
        <div className="admin-dashboard">
            <div className="container">
                <div className="admin-header">
                    <h1>Manage Orders</h1>
                </div>

                <div className="admin-card">
                    <p>Order management interface - View and update order statuses, manage deliveries</p>
                    <p className="text-muted">To be implemented with Firebase integration</p>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;
