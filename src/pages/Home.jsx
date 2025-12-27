import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTestimonials, getCategories } from '../firebase/firebaseService';
import videoBg from '../assets/videos/admin-hero.mp4';
import logoImg from '../assets/logo.jpg';
import './Home.css';

const Home = () => {
    const [scrollY, setScrollY] = useState(0);
    const [testimonials, setTestimonials] = useState([]);
    const [featuredCategories, setFeaturedCategories] = useState([]);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        loadContent();
    }, []);



    const loadContent = async () => {
        // Load testimonials - only from database, no fallback
        const testimonialsResult = await getTestimonials();
        if (testimonialsResult.success) {
            setTestimonials(testimonialsResult.data);
        }

        // Load categories - only from database, filter visible ones and limit to 6
        const categoriesResult = await getCategories();
        if (categoriesResult.success) {
            // Filter only visible categories and limit to 6
            const visibleCategories = categoriesResult.data
                .filter(cat => cat.visible !== false)
                .slice(0, 6);
            setFeaturedCategories(visibleCategories);
        }
    };


    return (
        <div className="home-page">
            {/* Video Intro Section */}
            <section className="video-intro">
                <div className="video-background">
                    <video autoPlay loop muted playsInline>
                        <source src={videoBg} type="video/mp4" />
                    </video>
                </div>
                <div className="video-overlay"></div>
                <div className="video-content">
                    <img src={logoImg} alt="Dream Boys Logo" className="video-logo" />
                    <h1 className="video-text">DREAM BOYS</h1>
                </div>
            </section>

            {/* Hero Section with Parallax */}
            <section className="hero-premium">
                <div className="hero-background" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
                    <div className="hero-gradient-orb orb-1"></div>
                    <div className="hero-gradient-orb orb-2"></div>
                    <div className="hero-gradient-orb orb-3"></div>
                </div>

                <div className="hero-content-premium container">
                    <motion.div
                        className="hero-text-premium"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* <motion.div
                            className="hero-badge"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            ✨ Premium Collection 2024
                        </motion.div> */}

                        <h1 className="hero-title-premium">
                            Redefine Your
                            <span className="highlight-premium"> Style</span>
                            <br />
                            <span className="highlight-gold">Embrace Luxury</span>
                        </h1>

                        <p className="hero-subtitle-premium">
                            Explore a curated collection of exquisite fashion. Exceptional craftsmanship, timeless style, and uncompromising quality designed for all.
                        </p>

                        <div className="hero-actions-premium">
                            <Link to="/products" className="btn-premium btn-primary-premium">
                                <span>Explore Collection</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link to="/products" className="btn-premium btn-outline-premium">
                                <span>View Lookbook</span>
                            </Link>
                        </div>

                        <div className="hero-stats">
                            <div className="stat-item">
                                <h3>10K+</h3>
                                <p>Happy Customers</p>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <h3>500+</h3>
                                <p>Premium Products</p>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <h3>4.9★</h3>
                                <p>Customer Rating</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="hero-image-premium"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="hero-card-3d">
                            <div className="card-shine"></div>
                            <div className="hero-product-showcase">
                                <div className="showcase-ring ring-1"></div>
                                <div className="showcase-ring ring-2"></div>
                                <div className="showcase-ring ring-3"></div>
                                <motion.div
                                    className="showcase-icon"
                                    animate={{
                                        y: [0, -5, 0],
                                        rotateZ: [0, 2, -2, 0],
                                        filter: ["drop-shadow(0 0 0px rgba(255,215,0,0))", "drop-shadow(0 0 10px rgba(255,215,0,0.5))", "drop-shadow(0 0 0px rgba(255,215,0,0))"]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                        <defs>
                                            <linearGradient id="luxury-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#d4af37" />
                                                <stop offset="50%" stopColor="#fdfd96" />
                                                <stop offset="100%" stopColor="#d4af37" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M6 3L2 9l10 12L22 9l-4-6H6z" fill="url(#luxury-gold)" stroke="none" opacity="0.9" />
                                        <path d="M6 3L2 9l10 12L22 9l-4-6H6z" stroke="#fff" strokeWidth="0.5" fill="none" />
                                        <path d="M12 21L7.5 9M12 21l4.5-12M2 9h20M12 3v18" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                                    </svg>
                                </motion.div>
                            </div>
                            <div className="floating-badge badge-1">Premium Quality</div>
                            <div className="floating-badge badge-2">Free Shipping</div>
                            <div className="floating-badge badge-3">24/7 Support</div>
                        </div>
                    </motion.div>
                </div>

                <div className="scroll-indicator">
                    <div className="mouse">
                        <div className="wheel"></div>
                    </div>
                    <p>Scroll to explore</p>
                </div>
            </section>

            {/* Categories Section */}
            <section className="categories-premium section">
                <div className="container">
                    <motion.div
                        className="section-header-premium"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="section-label">Shop by Category</span>
                        <h2>Curated Collections</h2>
                        <p>Explore our handpicked selection of premium menswear</p>
                    </motion.div>

                    <div className="categories-grid-premium">
                        {featuredCategories.map((category, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Link to={category.link} className="category-card-premium">
                                    <div className="category-glow" style={{ background: category.color }}></div>
                                    <div className="category-icon-premium">
                                        {category.image?.startsWith('data:') || category.image?.startsWith('http') ? (
                                            <img src={category.image} alt={category.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                        ) : (
                                            category.image
                                        )}
                                    </div>
                                    <h3>{category.name}</h3>
                                    <div className="category-arrow-premium">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-premium section">
                <div className="features-background"></div>
                <div className="container">
                    <div className="features-grid-premium">
                        <motion.div
                            className="feature-card-premium"
                            whileHover={{ y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="feature-icon-premium">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                    <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                            </div>
                            <h3>Premium Packaging</h3>
                            <p>Luxury packaging with every order, making unboxing an experience</p>
                        </motion.div>

                        <motion.div
                            className="feature-card-premium"
                            whileHover={{ y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="feature-icon-premium">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h3>Quality Guarantee</h3>
                            <p>100% authentic products with lifetime quality assurance</p>
                        </motion.div>

                        <motion.div
                            className="feature-card-premium"
                            whileHover={{ y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="feature-icon-premium">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <h3>Perfect Fit Promise</h3>
                            <p>Free size guidance to ensure every piece fits flawlessly</p>
                        </motion.div>

                        <motion.div
                            className="feature-card-premium"
                            whileHover={{ y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="feature-icon-premium">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <h3>Exclusive Designs</h3>
                            <p>Limited-edition pieces crafted with meticulous attention to detail</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-premium section">
                <div className="container">
                    <motion.div
                        className="section-header-premium"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="section-label">Testimonials</span>
                        <h2>What Our Clients Say</h2>
                        <p>Join thousands of satisfied customers worldwide</p>
                    </motion.div>

                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                className="testimonial-card"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="testimonial-stars">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <span key={i}>⭐</span>
                                    ))}
                                </div>
                                <p className="testimonial-text">"{testimonial.text}"</p>
                                <div className="testimonial-author">
                                    <div className="author-avatar">{testimonial.name.charAt(0)}</div>
                                    <div>
                                        <h4>{testimonial.name}</h4>
                                        <p>{testimonial.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-premium section">
                <div className="cta-background">
                    <div className="cta-orb cta-orb-1"></div>
                    <div className="cta-orb cta-orb-2"></div>
                </div>
                <div className="container">
                    <motion.div
                        className="cta-content-premium"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2>Ready to Elevate Your Wardrobe?</h2>
                        <p>Join our exclusive community</p>
                        <div className="cta-actions">
                            <Link to="/products" className="btn-premium btn-primary-premium btn-lg-premium">
                                <span>Shop Now</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                        <div className="cta-trust">
                            <div className="trust-item">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span>Trusted by 10,000+</span>
                            </div>
                            <div className="trust-item">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                <span>Secure Checkout</span>
                            </div>
                            <div className="trust-item">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                </svg>
                                <span>Easy Returns</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Home;
