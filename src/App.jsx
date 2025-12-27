import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
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
import AdminMessages from './pages/admin/AdminMessages';
import AdminRequests from './pages/admin/AdminRequests';
import UserMessages from './pages/UserMessages';
import InitializeData from './pages/admin/InitializeData';

// Components
import Header from './components/Header'; // Deprecated for MainLayout usage but verify first
import Footer from './components/Footer'; // Deprecated
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
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
            <ToastProvider>
                <WishlistProvider>
                    <CartProvider>
                        <Router>
                            <ScrollToTop />
                            <Routes>
                                {/* Public Routes wrapped in MainLayout */}
                                <Route element={<MainLayout />}>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/products" element={<Products />} />
                                    <Route path="/product/:id" element={<ProductDetail />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/contact" element={<Contact />} />
                                    <Route path="/privacy" element={<PrivacyPolicy />} />
                                    <Route path="/terms" element={<TermsOfService />} />
                                    <Route path="/faq" element={<FAQ />} />

                                    {/* Protected Customer Routes */}
                                    <Route path="/wishlist" element={<Wishlist />} />
                                    <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
                                    <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                                    <Route path="/order-success/:orderId" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />
                                    <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                                    <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                                    <Route path="/my-messages" element={<PrivateRoute><UserMessages /></PrivateRoute>} />
                                </Route>

                                {/* Admin Routes wrapped in AdminLayout */}
                                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                                    <Route index element={<AdminDashboard />} />
                                    <Route path="products" element={<AdminProducts />} />
                                    <Route path="orders" element={<AdminOrders />} />
                                    <Route path="requests" element={<AdminRequests />} />
                                    <Route path="users" element={<AdminUsers />} />
                                    <Route path="content" element={<AdminContent />} />
                                    <Route path="messages" element={<AdminMessages />} />
                                    <Route path="initialize" element={<InitializeData />} />
                                </Route>
                            </Routes>
                        </Router>
                    </CartProvider>
                </WishlistProvider>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
