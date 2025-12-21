import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrders, getAllProducts, getAllUsers } from '../../firebase/firebaseService';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lowStockProducts, setLowStockProducts] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all data in parallel
            const [ordersData, productsData, usersData] = await Promise.all([
                getAllOrders(),
                getAllProducts(),
                getAllUsers()
            ]);

            // Calculate statistics
            const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
            const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
            const processingOrders = ordersData.filter(o => o.status === 'processing').length;
            const shippedOrders = ordersData.filter(o => o.status === 'shipped').length;
            const deliveredOrders = ordersData.filter(o => o.status === 'delivered').length;

            // Get recent orders (last 5)
            const sortedOrders = ordersData
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5);

            // Find low stock products (stock < 10)
            const lowStock = productsData
                .filter(product => product.stock < 10)
                .sort((a, b) => a.stock - b.stock)
                .slice(0, 5);

            setStats({
                totalOrders: ordersData.length,
                totalProducts: productsData.length,
                totalUsers: usersData.length,
                totalRevenue,
                pendingOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders
            });

            setRecentOrders(sortedOrders);
            setLowStockProducts(lowStock);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p>Welcome back! Here's what's happening with your store.</p>
                    </div>
                    <button className="btn-refresh" onClick={fetchDashboardData}>
                        🔄 Refresh Data
                    </button>
                </div>

                {/* Main Statistics */}
                <div className="stats-grid">
                    <div className="stat-card" style={{ borderLeftColor: '#3498db' }}>
                        <div className="stat-icon" style={{ background: '#3498db' }}>📦</div>
                        <div className="stat-info">
                            <p className="stat-title">Total Orders</p>
                            <h3 className="stat-value">{stats.totalOrders}</h3>
                            <p className="stat-subtitle">{stats.pendingOrders} pending</p>
                        </div>
                    </div>

                    <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
                        <div className="stat-icon" style={{ background: '#f39c12' }}>👕</div>
                        <div className="stat-info">
                            <p className="stat-title">Total Products</p>
                            <h3 className="stat-value">{stats.totalProducts}</h3>
                            <p className="stat-subtitle">{lowStockProducts.length} low stock</p>
                        </div>
                    </div>

                    <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
                        <div className="stat-icon" style={{ background: '#27ae60' }}>👥</div>
                        <div className="stat-info">
                            <p className="stat-title">Total Users</p>
                            <h3 className="stat-value">{stats.totalUsers.toLocaleString()}</h3>
                            <p className="stat-subtitle">Registered customers</p>
                        </div>
                    </div>

                    <div className="stat-card" style={{ borderLeftColor: '#e74c3c' }}>
                        <div className="stat-icon" style={{ background: '#e74c3c' }}>💰</div>
                        <div className="stat-info">
                            <p className="stat-title">Total Revenue</p>
                            <h3 className="stat-value">{formatCurrency(stats.totalRevenue)}</h3>
                            <p className="stat-subtitle">All time</p>
                        </div>
                    </div>
                </div>

                {/* Order Status Overview */}
                <div className="order-status-overview">
                    <h2>Order Status Overview</h2>
                    <div className="status-grid">
                        <div className="status-item status-pending">
                            <div className="status-count">{stats.pendingOrders}</div>
                            <div className="status-label">Pending</div>
                        </div>
                        <div className="status-item status-processing">
                            <div className="status-count">{stats.processingOrders}</div>
                            <div className="status-label">Processing</div>
                        </div>
                        <div className="status-item status-shipped">
                            <div className="status-count">{stats.shippedOrders}</div>
                            <div className="status-label">Shipped</div>
                        </div>
                        <div className="status-item status-delivered">
                            <div className="status-count">{stats.deliveredOrders}</div>
                            <div className="status-label">Delivered</div>
                        </div>
                    </div>
                </div>

                <div className="admin-grid">
                    {/* Recent Orders */}
                    <div className="admin-card">
                        <div className="card-header">
                            <h2>Recent Orders</h2>
                            <Link to="/admin/orders" className="view-all-link">View All →</Link>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div className="empty-state">
                                <p>No orders yet</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Order #</th>
                                            <th>Customer</th>
                                            <th>Date</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map(order => (
                                            <tr key={order.id}>
                                                <td className="order-number">#{order.orderNumber}</td>
                                                <td>{order.shippingAddress?.fullName || 'N/A'}</td>
                                                <td>{formatDate(order.createdAt)}</td>
                                                <td className="order-total">{formatCurrency(order.total)}</td>
                                                <td>
                                                    <span className={`status-badge status-${order.status}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <Link to="/admin/orders" className="btn btn-outline">Manage All Orders</Link>
                    </div>

                    {/* Low Stock Alert */}
                    <div className="admin-card">
                        <div className="card-header">
                            <h2>Low Stock Alert</h2>
                            <Link to="/admin/products" className="view-all-link">View All →</Link>
                        </div>

                        {lowStockProducts.length === 0 ? (
                            <div className="empty-state">
                                <p>✅ All products well stocked</p>
                            </div>
                        ) : (
                            <div className="low-stock-list">
                                {lowStockProducts.map(product => (
                                    <div key={product.id} className="low-stock-item">
                                        <img src={product.image} alt={product.name} />
                                        <div className="product-info">
                                            <h4>{product.name}</h4>
                                            <p className="stock-warning">
                                                ⚠️ Only {product.stock} left in stock
                                            </p>
                                        </div>
                                        <Link to="/admin/products" className="btn-restock">
                                            Restock
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
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
    );
};

export default AdminDashboard;
