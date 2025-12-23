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

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setUserMenuOpen(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        }
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
                            <span>Profile</span>
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
