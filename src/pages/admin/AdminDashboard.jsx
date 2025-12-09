import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const stats = [
        { title: 'Total Orders', value: '156', icon: '📦', color: '#3498db' },
        { title: 'Total Products', value: '48', icon: '👕', color: '#f39c12' },
        { title: 'Total Users', value: '1,234', icon: '👥', color: '#27ae60' },
        { title: 'Revenue', value: '$12,450', icon: '💰', color: '#e74c3c' }
    ];

    const recentOrders = [
        { id: 'ORD-001', customer: 'John Doe', total: 159.97, status: 'delivered' },
        { id: 'ORD-002', customer: 'Jane Smith', total: 199.99, status: 'shipped' },
        { id: 'ORD-003', customer: 'Bob Johnson', total: 89.99, status: 'processing' }
    ];

    return (
        <div className="admin-dashboard">
            <div className="container">
                <div className="admin-header">
                    <h1>Admin Dashboard</h1>
                    <p>Welcome back! Here's what's happening with your store.</p>
                </div>

                <div className="stats-grid">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
                            <div className="stat-icon" style={{ background: stat.color }}>{stat.icon}</div>
                            <div className="stat-info">
                                <p className="stat-title">{stat.title}</p>
                                <h3 className="stat-value">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="admin-grid">
                    <div className="admin-card">
                        <h2>Recent Orders</h2>
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map(order => (
                                        <tr key={order.id}>
                                            <td>{order.id}</td>
                                            <td>{order.customer}</td>
                                            <td>${order.total}</td>
                                            <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Link to="/admin/orders" className="btn btn-outline">View All Orders</Link>
                    </div>

                    <div className="admin-card">
                        <h2>Quick Actions</h2>
                        <div className="quick-actions">
                            <Link to="/admin/products" className="action-btn">
                                <span className="action-icon">📦</span>
                                <span>Manage Products</span>
                            </Link>
                            <Link to="/admin/orders" className="action-btn">
                                <span className="action-icon">🛒</span>
                                <span>Manage Orders</span>
                            </Link>
                            <Link to="/admin/users" className="action-btn">
                                <span className="action-icon">👥</span>
                                <span>Manage Users</span>
                            </Link>
                            <Link to="/admin/content" className="action-btn">
                                <span className="action-icon">✨</span>
                                <span>Manage Content</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
