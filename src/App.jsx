import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import FAQ from './pages/FAQ';
import Wishlist from './pages/Wishlist';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminContent from './pages/admin/AdminContent';
import InitializeData from './pages/admin/InitializeData';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import InlineLoader from './components/InlineLoader';

function App() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate initial loading
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000); // Show loader for 2 seconds

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <InlineLoader message="Welcome to DreamBoys..." />;
    }

    return (
        <AuthProvider>
            <WishlistProvider>
                <Router>
                    <ScrollToTop />
                    <div className="app">
                        <Header />
                        <main>
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<Home />} />
                                <Route path="/products" element={<Products />} />
                                <Route path="/product/:id" element={<ProductDetail />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                <Route path="/terms" element={<TermsOfService />} />
                                <Route path="/faq" element={<FAQ />} />

                                {/* Protected Routes */}
                                <Route path="/wishlist" element={<Wishlist />} />
                                <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
                                <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                                <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

                                {/* Admin Routes */}
                                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                                <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
                                <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                                <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
                                <Route path="/admin/initialize" element={<AdminRoute><InitializeData /></AdminRoute>} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </Router>
            </WishlistProvider>
        </AuthProvider>
    );
}

export default App;
