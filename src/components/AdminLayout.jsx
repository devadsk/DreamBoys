import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
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
    ChevronDown,
    ArrowLeft,
    User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllRequests } from '../firebase/firebaseService';
import './AdminLayout.css';

const AdminLayout = () => {
    const { currentUser, userData, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

    // Fetch notification count (pending requests)
    useEffect(() => {
        const fetchNotificationCount = async () => {
            try {
                const requestsResult = await getAllRequests();
                if (requestsResult.success) {
                    const pendingCount = requestsResult.data.filter(r => r.status === 'pending').length;
                    setNotificationCount(pendingCount);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        fetchNotificationCount();
        // Refresh every 30 seconds
        const interval = setInterval(fetchNotificationCount, 30000);
        return () => clearInterval(interval);
    }, []);

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
                    <button
                        onClick={() => navigate('/')}
                        className="back-home-btn"
                        title="Back to Home"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'inherit',
                            marginRight: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px',
                            borderRadius: '50%',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <ArrowLeft size={20} />
                    </button>
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


                </nav>

                <div className="admin-user-mini">
                    <div className="user-avatar">{userData?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-name">{userData?.displayName || 'Admin User'}</p>
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
                        {/* Notifications */}
                        <Link to="/admin/requests" className="icon-btn" title={`${notificationCount} pending requests`}>
                            <Bell size={20} />
                            {notificationCount > 0 && <span className="badge-dot">{notificationCount}</span>}
                        </Link>

                        {/* Profile Dropdown */}
                        <div className="admin-profile-dropdown">
                            <button
                                className="admin-profile"
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                            >
                                <div className="avatar">{userData?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}</div>
                                <ChevronDown size={16} className={profileDropdownOpen ? 'rotated' : ''} />
                            </button>

                            {profileDropdownOpen && (
                                <>
                                    <div className="dropdown-overlay" onClick={() => setProfileDropdownOpen(false)} />
                                    <div className="profile-dropdown-menu">
                                        <div className="profile-dropdown-header">
                                            <div className="profile-avatar-large">
                                                {userData?.displayName?.charAt(0).toUpperCase() || 'A'}
                                            </div>
                                            <div className="profile-info">
                                                <p className="profile-name">{userData?.displayName || 'Admin User'}</p>
                                                <p className="profile-email">{currentUser?.email}</p>
                                                {userData?.role && <span className="profile-role-badge">{userData.role}</span>}
                                            </div>
                                        </div>
                                        <div className="profile-dropdown-divider" />
                                        <Link to="/profile" className="profile-dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                                            <User size={18} />
                                            <span>My Profile</span>
                                        </Link>
                                        <div className="profile-dropdown-divider" />
                                        <button className="profile-dropdown-item logout" onClick={handleLogout}>
                                            <LogOut size={18} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </>
                            )}
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
