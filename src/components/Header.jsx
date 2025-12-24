import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { logout } from '../firebase/firebaseService';
import './Header.css';

import logo from '../assets/logo.jpg';

const Header = () => {
    const { currentUser, userData, isAdmin } = useAuth();
    const { wishlistCount } = useWishlist();
    const { cartCount } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Sync search query with URL parameter
    useEffect(() => {
        const searchParam = searchParams.get('search');
        if (searchParam) {
            setSearchQuery(searchParam);
        } else {
            setSearchQuery('');
        }
    }, [searchParams]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.classList.add('menu-open');
        } else {
            document.body.classList.remove('menu-open');
        }
        return () => document.body.classList.remove('menu-open');
    }, [menuOpen]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setUserMenuOpen(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setMobileSearchOpen(false);
        }
    };

    const handleMobileSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setMobileSearchOpen(false);
        }
    };

    return (
        <>
            <header className="header">
                <div className="header-container">
                    {/* Left: Logo & Nav */}
                    <div className="header-left">
                        {/* Mobile Menu Toggle */}
                        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>

                        <Link to="/" className="logo">
                            <img src={logo} alt="DreamBoys" className="logo-img" />
                            DreamBoys
                        </Link>

                        {/* Desktop Navigation - Simple */}
                        <nav className="nav-desktop">
                            <Link to="/">HOME</Link>
                            <Link to="/products">SHOP</Link>
                            {isAdmin && (
                                <Link to="/admin" className="admin-link">
                                    ADMIN
                                </Link>
                            )}
                        </nav>

                        {/* Mobile Navigation - Full Menu */}
                        <nav className={`nav-mobile ${menuOpen ? 'nav-open' : ''}`}>
                            {/* User Info Section (if logged in) */}
                            {currentUser && (
                                <div className="mobile-nav-user">
                                    <div className="mobile-nav-avatar">
                                        {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="mobile-nav-user-info">
                                        <p className="mobile-nav-name">{currentUser.displayName || 'User'}</p>
                                        <p className="mobile-nav-email">{currentUser.email}</p>
                                    </div>
                                </div>
                            )}

                            {/* Main Navigation Links */}
                            <div className="mobile-nav-links">
                                <Link to="/" onClick={() => setMenuOpen(false)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                    </svg>
                                    HOME
                                </Link>
                                <Link to="/products" onClick={() => setMenuOpen(false)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="9" cy="21" r="1"></circle>
                                        <circle cx="20" cy="21" r="1"></circle>
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                    </svg>
                                    SHOP
                                </Link>
                                {currentUser && (
                                    <>
                                        <Link to="/profile" onClick={() => setMenuOpen(false)}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                            PROFILE
                                        </Link>
                                        <Link to="/orders" onClick={() => setMenuOpen(false)}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                            </svg>
                                            ORDERS
                                        </Link>
                                        <Link to="/my-messages" onClick={() => setMenuOpen(false)}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                            </svg>
                                            MESSAGES
                                        </Link>
                                    </>
                                )}
                                {isAdmin && (
                                    <Link to="/admin" className="admin-link" onClick={() => setMenuOpen(false)}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                                        </svg>
                                        ADMIN
                                    </Link>
                                )}
                            </div>

                            {/* Login/Signup Button for logged out users */}
                            {!currentUser && (
                                <Link to="/login" className="mobile-nav-login" onClick={() => setMenuOpen(false)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                        <polyline points="10 17 15 12 10 7"></polyline>
                                        <line x1="15" y1="12" x2="3" y2="12"></line>
                                    </svg>
                                    LOGIN / SIGN UP
                                </Link>
                            )}

                            {/* Logout Button at Bottom */}
                            {currentUser && (
                                <button className="mobile-nav-logout" onClick={() => {
                                    handleLogout();
                                    setMenuOpen(false);
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                    LOGOUT
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Center: Search (Desktop) */}
                    <div className="header-search">
                        <form className="search-bar" onSubmit={handleSearch}>
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                onClick={handleSearch}
                                style={{ cursor: 'pointer' }}
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search for products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                    </div>

                    {/* Right: Actions */}
                    <div className="header-actions">
                        {/* Mobile Search Toggle */}
                        <button className="search-toggle" onClick={() => setMobileSearchOpen(true)} aria-label="Search">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>

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
                                        <Link to="/my-messages" onClick={() => setUserMenuOpen(false)}>My Messages</Link>
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
                                <span>Login</span>
                            </Link>
                        )}

                        <Link to="/wishlist" className="wishlist-section">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            <span>Wishlist</span>
                            {wishlistCount > 0 && <span className="wishlist-badge">{wishlistCount}</span>}
                        </Link>

                        <Link to="/cart" className="cart-section">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            <span>Bag</span>
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile Search Overlay */}
            <div className={`mobile-search-overlay ${mobileSearchOpen ? 'active' : ''}`} onClick={() => setMobileSearchOpen(false)}>
                <div className="mobile-search-container" onClick={(e) => e.stopPropagation()}>
                    <form className="mobile-search-bar" onSubmit={handleMobileSearch}>
                        <input
                            type="text"
                            className="mobile-search-input"
                            placeholder="Search for products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <button type="button" className="mobile-search-close" onClick={() => setMobileSearchOpen(false)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Header;
