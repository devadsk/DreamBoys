import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    ShoppingCart,
    Users,
    MessageSquare,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Search,
    Bell,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
        { path: '/admin/products', icon: ShoppingBag, label: 'Products' },
        { path: '/admin/users', icon: Users, label: 'Customers' },
        { path: '/admin/messages', icon: MessageSquare, label: 'Messages' },
        { path: '/admin/requests', icon: FileText, label: 'Requests' },
        { path: '/admin/content', icon: Settings, label: 'Content' },
    ];

    // Get current page title based on path
    const getPageTitle = () => {
        const currentItem = navItems.find(item => {
            if (item.end) return location.pathname === item.path;
            return location.pathname.startsWith(item.path);
        });
        return currentItem ? currentItem.label : 'Admin';
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="admin-logo">
                    <div className="logo-icon">DB</div>
                    <span className="logo-text">DreamBoys Admin</span>
                    <button className="mobile-close" onClick={() => setSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="admin-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    <button onClick={handleLogout} className="nav-item logout-btn">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </nav>

                <div className="admin-user-mini">
                    <div className="user-avatar">{currentUser?.email?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-name">Admin User</p>
                        <p className="user-email">{currentUser?.email}</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {/* Top Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <h2 className="page-title">{getPageTitle()}</h2>
                    </div>

                    <div className="topbar-right">
                        {/* 
                        <div className="search-bar">
                            <Search size={18} />
                            <input type="text" placeholder="Search..." />
                        </div>
                        */}
                        <button className="icon-btn">
                            <Bell size={20} />
                            <span className="badge-dot"></span>
                        </button>
                        <div className="admin-profile">
                            <div className="avatar">{currentUser?.email?.charAt(0).toUpperCase()}</div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="admin-content-wrapper">
                    <Outlet />
                </div>
            </main>

            {/* Overlay for mobile */}
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
        </div>
    );
};

export default AdminLayout;
