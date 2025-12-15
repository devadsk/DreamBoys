import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/firebaseService';
import './Header.css';

import logo from '../assets/logo.jpg';

const Header = () => {
    const { currentUser, userData, isAdmin } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setUserMenuOpen(false);
    };

    return (
        <header className="header">
            <div className="header-container">
                {/* Left: Logo & Nav */}
                <div className="header-left">
                    <Link to="/" className="logo">
                        <img src={logo} alt="DreamBoys" className="logo-img" />
                        DreamBoys
                    </Link>

                    <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
                        <Link to="/" onClick={() => setMenuOpen(false)}>HOME</Link>
                        <Link to="/products" onClick={() => setMenuOpen(false)}>SHOP</Link>
                        {isAdmin && (
                            <Link to="/admin" className="admin-link" onClick={() => setMenuOpen(false)}>
                                ADMIN
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Center: Search */}
                <div className="header-search">
                    <div className="search-bar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" placeholder="Search for products..." />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="header-actions">
                    {currentUser ? (
                        <div className="profile-section" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>Profile</span>

                            {userMenuOpen && (
                                <div className="user-dropdown">
                                    <div className="dropdown-header">
                                        <p>{userData?.displayName || 'User'}</p>
                                        <small>{currentUser.email}</small>
                                    </div>
                                    <Link to="/profile" onClick={() => setUserMenuOpen(false)}>My Profile</Link>
                                    <Link to="/orders" onClick={() => setUserMenuOpen(false)}>Orders</Link>
                                    <button onClick={handleLogout}>Logout</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="profile-section">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>Profile</span>
                        </Link>
                    )}

                    <Link to="/cart" className="cart-section">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                        <span>Bag</span>
                        <span className="cart-badge">0</span>
                    </Link>

                    <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
