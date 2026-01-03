import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    Users,
    DollarSign,
    Package,
    ArrowUpRight,
    ArrowRight,
    TrendingUp,
    Clock,
    AlertTriangle,
    Activity,
    Calendar
} from 'lucide-react';
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
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchDashboardData();
        const timer = setInterval(() => setCurrentDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [ordersData, productsData, usersData] = await Promise.all([
                getAllOrders(),
                getAllProducts(),
                getAllUsers()
            ]);

            // Calculate revenue excluding cancelled orders and replacements (which have total: 0)
            const totalRevenue = ordersData
                .filter(order => !['cancelled', 'refund_approved', 'return_pickup_scheduled'].includes(order.status))
                .filter(order => !order.isReplacement) // Exclude replacement orders (they have total: 0)
                .reduce((sum, order) => sum + (order.total || 0), 0);

            setStats({
                totalOrders: ordersData.length,
                totalProducts: productsData.length,
                totalUsers: usersData.length,
                totalRevenue,
                pendingOrders: ordersData.filter(o => o.status === 'pending' || o.status === 'placed').length,
                processingOrders: ordersData.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
                shippedOrders: ordersData.filter(o => o.status === 'shipped').length,
                deliveredOrders: ordersData.filter(o => o.status === 'delivered').length
            });

            setRecentOrders(ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
            setLowStockProducts(productsData.filter(p => p.stock < 10).slice(0, 4));

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

    if (loading) {
        return (
            <div className="admin-loading-screen">
                <div className="spinner-lg"></div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-container">
            {/* Header Section */}
            <div className="dashboard-header">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Overview of your store's performance</p>
                </div>
                <div className="dashboard-date-badge">
                    <Calendar size={16} className="text-gray-500" />
                    <span>{currentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
            </div>

            {/* Stats Overview Rows */}
            <div className="stats-showcase-grid">
                <div className="stat-showcase-card blue-accent">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="stat-label">Total Revenue</p>
                            <h3 className="stat-number">{formatCurrency(stats.totalRevenue)}</h3>
                        </div>
                        <div className="stat-icon-bg">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div className="stat-trend positive">
                        <TrendingUp size={14} />
                        <span>+12.5% from last month</span>
                    </div>
                </div>

                <div className="stat-showcase-card purple-accent">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="stat-label">Total Orders</p>
                            <h3 className="stat-number">{stats.totalOrders}</h3>
                        </div>
                        <div className="stat-icon-bg">
                            <ShoppingBag size={24} />
                        </div>
                    </div>
                    <div className="stat-footer-info">
                        <span className="text-orange-600 font-medium">{stats.pendingOrders} pending processing</span>
                    </div>
                </div>

                <div className="stat-showcase-card orange-accent">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="stat-label">Active Users</p>
                            <h3 className="stat-number">{stats.totalUsers}</h3>
                        </div>
                        <div className="stat-icon-bg">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="stat-footer-info">
                        <span className="text-green-600">Growing community</span>
                    </div>
                </div>

                <div className="stat-showcase-card green-accent">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="stat-label">Total Products</p>
                            <h3 className="stat-number">{stats.totalProducts}</h3>
                        </div>
                        <div className="stat-icon-bg">
                            <Package size={24} />
                        </div>
                    </div>
                    <div className="stat-footer-info">
                        {lowStockProducts.length > 0 ? (
                            <span className="text-red-500 font-medium">{lowStockProducts.length} items low stock</span>
                        ) : (
                            <span className="text-green-600">Inventory healthy</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-main-layout">
                {/* Left Column (ACTIVITY & ORDERS) */}
                <div className="dashboard-col-left">
                    {/* Live Status Panel */}
                    <div className="dashboard-panel">
                        <div className="panel-header">
                            <div className="flex items-center gap-2">
                                <Activity size={18} className="text-indigo-600" />
                                <h3>Order Activity</h3>
                            </div>
                        </div>
                        <div className="order-status-timeline">
                            <div className="status-timeline-item">
                                <div className="timeline-dot pending"></div>
                                <div className="timeline-content">
                                    <span className="timeline-count">{stats.pendingOrders}</span>
                                    <span className="timeline-label">Pending Reviews</span>
                                </div>
                            </div>
                            <div className="status-timeline-item">
                                <div className="timeline-dot processing"></div>
                                <div className="timeline-content">
                                    <span className="timeline-count">{stats.processingOrders}</span>
                                    <span className="timeline-label">Processing</span>
                                </div>
                            </div>
                            <div className="status-timeline-item">
                                <div className="timeline-dot shipped"></div>
                                <div className="timeline-content">
                                    <span className="timeline-count">{stats.shippedOrders}</span>
                                    <span className="timeline-label">Shipped</span>
                                </div>
                            </div>
                            <div className="status-timeline-item">
                                <div className="timeline-dot delivered"></div>
                                <div className="timeline-content">
                                    <span className="timeline-count">{stats.deliveredOrders}</span>
                                    <span className="timeline-label">Delivered</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders Table */}
                    <div className="dashboard-panel">
                        <div className="panel-header">
                            <h3>Recent Orders</h3>
                            <Link to="/admin/orders" className="view-all-link">
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="recent-orders-list">
                            {recentOrders.length === 0 ? (
                                <div className="empty-placeholder">No recent orders</div>
                            ) : (
                                recentOrders.map(order => (
                                    <div key={order.id} className="recent-order-row">
                                        <div className="order-info-main">
                                            <span className="order-id">#{order.orderNumber}</span>
                                            <span className="order-customer">{order.shippingAddress?.fullName}</span>
                                        </div>
                                        <div className="order-info-meta">
                                            <span className="order-date">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className={`status-dot status-${order.status}`} title={order.status}></span>
                                            <span className="order-total">{formatCurrency(order.total)}</span>
                                        </div>
                                        <Link to={`/admin/orders`} className="order-action-btn">
                                            <ArrowUpRight size={16} />
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (ALERTS & QUICK ACTIONS) */}
                <div className="dashboard-col-right">

                    {/* Inventory Alert */}
                    <div className="dashboard-panel">
                        <div className="panel-header">
                            <div className="flex items-center gap-2 text-amber-600">
                                <AlertTriangle size={18} />
                                <h3>Attention Needed</h3>
                            </div>
                        </div>
                        <div className="alert-list">
                            {lowStockProducts.length > 0 ? (
                                lowStockProducts.map(p => (
                                    <div key={p.id} className="alert-item">
                                        <img src={p.image} alt="" className="alert-item-img" />
                                        <div className="alert-item-info">
                                            <h4>{p.name}</h4>
                                            <span className="text-red-500 text-xs font-bold">{p.stock} remaining</span>
                                        </div>
                                        <Link to="/admin/products" className="btn-xs-outline">Refill</Link>
                                    </div>
                                ))
                            ) : (
                                <div className="healthy-state">
                                    <div className="check-circle-icon">✓</div>
                                    <p>All systems operational</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="dashboard-panel">
                        <div className="panel-header">
                            <h3>Quick Actions</h3>
                        </div>
                        <div className="quick-actions-grid">
                            <Link to="/admin/products" className="quick-action-tile">
                                <div className="tile-icon bg-blue-50 text-blue-600">
                                    <Package size={20} />
                                </div>
                                <span>Add Product</span>
                            </Link>
                            <Link to="/admin/content" className="quick-action-tile">
                                <div className="tile-icon bg-purple-50 text-purple-600">
                                    <Activity size={20} />
                                </div>
                                <span>Content</span>
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
