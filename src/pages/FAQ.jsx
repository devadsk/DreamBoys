import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { searchFAQs } from '../utils/faqSearchUtils';
import './FAQ.css';

const FAQ = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [activeCategory, setActiveCategory] = useState('all');
    const [openQuestion, setOpenQuestion] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Scroll to top when component mounts or category changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Handle category from URL parameter
    useEffect(() => {
        const category = searchParams.get('category');
        if (category) {
            setActiveCategory(category);
            // Scroll to top when category changes
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [searchParams]);

    const categories = [
        { id: 'all', name: 'All Questions', icon: '📚' },
        { id: 'orders', name: 'Orders & Payment', icon: '🛒' },
        { id: 'shipping', name: 'Shipping & Delivery', icon: '📦' },
        { id: 'returns', name: 'Returns & Exchanges', icon: '🔄' },
        { id: 'products', name: 'Products & Sizing', icon: '👕' },
        { id: 'account', name: 'Account & Security', icon: '👤' },
        { id: 'general', name: 'General', icon: '❓' }
    ];

    const faqs = [
        // Orders & Payment
        {
            category: 'orders',
            question: 'How do I place an order?',
            answer: 'To place an order: 1) Browse our products and click on items you like. 2) Select size, color, and quantity. 3) Click "Add to Cart". 4) Go to your cart and click "Checkout". 5) Enter shipping details and payment information. 6) Review and confirm your order. You\'ll receive an order confirmation email immediately.'
        },
        {
            category: 'orders',
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, UPI, net banking, and digital wallets. All payments are processed securely through encrypted payment gateways. We do not store your card information.'
        },
        {
            category: 'orders',
            question: 'Can I modify or cancel my order?',
            answer: 'You can cancel your order before it ships by going to "My Orders" in your account and clicking "Cancel Order". If the order has already been shipped, you can refuse delivery or initiate a return once you receive it. Refunds are processed within 5-7 business days.'
        },
        {
            category: 'orders',
            question: 'Do you offer Cash on Delivery (COD)?',
            answer: 'Yes, we offer Cash on Delivery for orders within India. COD is available for orders up to ₹10,000. A small COD handling fee may apply. Please note that COD orders cannot be cancelled after placement.'
        },
        {
            category: 'orders',
            question: 'How do I track my order?',
            answer: 'Once your order ships, you\'ll receive a tracking number via email and SMS. You can track your order by: 1) Logging into your account and going to "My Orders". 2) Clicking on the order you want to track. 3) Viewing real-time tracking updates. You can also use the tracking number on the courier\'s website.'
        },

        // Shipping & Delivery
        {
            category: 'shipping',
            question: 'What are the shipping charges?',
            answer: 'Shipping charges vary based on order value and location: Free shipping on orders above ₹999. Standard shipping (₹99) for orders below ₹999. Express shipping (₹199) available in select cities. Shipping charges are calculated and displayed at checkout before payment.'
        },
        {
            category: 'shipping',
            question: 'How long does delivery take?',
            answer: 'Standard delivery: 5-7 business days for most locations. Express delivery: 2-3 business days for metro cities. Remote areas: 7-10 business days. Delivery times are estimates and may vary during sale periods or holidays. You\'ll receive updates via SMS and email.'
        },
        {
            category: 'shipping',
            question: 'Do you ship internationally?',
            answer: 'Currently, we ship only within India. We are working on expanding our international shipping options. Please check back soon or subscribe to our newsletter for updates on international shipping availability.'
        },
        {
            category: 'shipping',
            question: 'What if I\'m not available during delivery?',
            answer: 'If you\'re not available, the courier will attempt delivery 2-3 times. You\'ll receive a call before each attempt. You can also: 1) Reschedule delivery through the tracking link. 2) Provide alternate delivery instructions. 3) Arrange for someone else to receive the package. If all attempts fail, the order will be returned to us.'
        },
        {
            category: 'shipping',
            question: 'Can I change my delivery address?',
            answer: 'You can change the delivery address before the order ships by contacting customer support immediately. Once shipped, the address cannot be changed, but you can contact the courier for delivery instructions or reschedule to a different address if they support it.'
        },

        // Returns & Exchanges
        {
            category: 'returns',
            question: 'What is your return policy?',
            answer: 'We offer easy returns within 7 days of delivery. Items must be unused, unwashed, with original tags attached. To return: 1) Go to "My Orders" and select the item. 2) Click "Return" and choose a reason. 3) Schedule a pickup or drop at our store. 4) Refund will be processed within 7-10 days after we receive and inspect the item.'
        },
        {
            category: 'returns',
            question: 'How do I exchange a product?',
            answer: 'To exchange an item: 1) Initiate a return for the original item. 2) Place a new order for the desired size/color. This ensures faster processing. Alternatively, contact customer support for direct exchange assistance. Exchange is subject to availability of the new item.'
        },
        {
            category: 'returns',
            question: 'Which items cannot be returned?',
            answer: 'The following items cannot be returned: Intimate wear and innerwear, Products marked as "Final Sale" or "Non-returnable", Items without original tags, Worn, washed, or damaged products, Products purchased during special promotions (unless defective).'
        },
        {
            category: 'returns',
            question: 'How long does it take to get my refund?',
            answer: 'Refunds are processed within 7-10 business days after we receive and inspect your return. The amount will be credited to your original payment method. For COD orders, refunds are issued via bank transfer (provide account details) or store credit.'
        },
        {
            category: 'returns',
            question: 'What if I receive a damaged or wrong item?',
            answer: 'We apologize for any inconvenience! If you receive a damaged or wrong item: 1) Contact us within 48 hours with photos. 2) We\'ll arrange immediate pickup. 3) You\'ll receive a replacement or full refund (including shipping). 4) No questions asked - we\'ll make it right!'
        },

        // Products & Sizing
        {
            category: 'products',
            question: 'How do I find the right size?',
            answer: 'Use our size guide available on each product page. Measure yourself and compare with our size chart. If between sizes, we recommend sizing up. Check product reviews for fit feedback. Contact customer support for personalized sizing help. We offer easy exchanges if the size doesn\'t fit.'
        },
        {
            category: 'products',
            question: 'Are the product colors accurate?',
            answer: 'We strive to display accurate colors, but actual colors may vary slightly due to screen settings and lighting. We provide multiple product images from different angles. Check customer photos in reviews for real-life color representation. If you\'re not satisfied with the color, you can return it within 7 days.'
        },
        {
            category: 'products',
            question: 'How do I care for my DreamBoys products?',
            answer: 'Care instructions are provided on the product tag and description. General tips: Wash dark colors separately, Use cold water for delicate fabrics, Avoid harsh detergents, Air dry when possible, Iron on appropriate heat settings. Following care instructions ensures longevity of your garments.'
        },
        {
            category: 'products',
            question: 'Do you restock sold-out items?',
            answer: 'Popular items are regularly restocked. Click "Notify Me" on sold-out product pages to receive email alerts when items are back in stock. Follow us on social media for restock announcements. Some seasonal or limited edition items may not be restocked.'
        },
        {
            category: 'products',
            question: 'Are your products authentic?',
            answer: 'Yes, all DreamBoys products are 100% authentic and sourced directly from our manufacturing partners. We guarantee quality and authenticity. Each product comes with authenticity tags. Beware of counterfeit products from unauthorized sellers.'
        },

        // Account & Security
        {
            category: 'account',
            question: 'How do I create an account?',
            answer: 'Click "Sign Up" or "Register" at the top of the page. Enter your name, email, and create a password. Verify your email through the link sent to your inbox. You can also sign up during checkout. Having an account lets you track orders, save addresses, and get exclusive offers.'
        },
        {
            category: 'account',
            question: 'I forgot my password. What should I do?',
            answer: 'Click "Forgot Password" on the login page. Enter your registered email address. Check your email for a password reset link. Click the link and create a new password. If you don\'t receive the email, check your spam folder or contact support.'
        },
        {
            category: 'account',
            question: 'How do I update my account information?',
            answer: 'Log into your account and go to "My Profile" or "Account Settings". You can update: Name, Email address, Phone number, Delivery addresses, Password. Click "Save Changes" after making updates. Some changes may require email verification.'
        },
        {
            category: 'account',
            question: 'Is my payment information secure?',
            answer: 'Yes, absolutely! We use industry-standard SSL encryption for all transactions. Payment information is processed through PCI-DSS compliant payment gateways. We never store your complete card details. All data is encrypted and securely transmitted.'
        },
        {
            category: 'account',
            question: 'Can I delete my account?',
            answer: 'Yes, you can request account deletion by contacting customer support. We\'ll delete your personal information within 30 days. Note: Order history and transaction records may be retained for legal and accounting purposes. You can also deactivate your account temporarily.'
        },

        // General
        {
            category: 'general',
            question: 'Do you have physical stores?',
            answer: 'Yes! We have stores in Madurai: 1) Outpost Branch - 19, Alagar Kovil Mainroad, Madurai-625002. 2) Chavadi Branch - 158/1, P.P.Chavadi, Theni Mainroad, Madurai-625016. 3) Pasumalai Branch - 32, TPK Road, Pasumalai, Madurai-625004. Visit us for personalized shopping experience!'
        },
        {
            category: 'general',
            question: 'How can I contact customer support?',
            answer: 'We\'re here to help! Contact us via: Email: support@dreamboys.com (24-48 hour response), Phone: +1 (555) 123-4567 (Mon-Sat, 10 AM - 7 PM), Live Chat: Available on our website, Social Media: DM us on Instagram/Facebook. We respond to all queries promptly!'
        },
        {
            category: 'general',
            question: 'Do you offer gift cards?',
            answer: 'Yes! DreamBoys gift cards are available in denominations of ₹500, ₹1000, ₹2000, and ₹5000. They can be purchased online and sent via email. Gift cards are valid for 1 year from purchase date and can be used for any products on our website or in stores.'
        },
        {
            category: 'general',
            question: 'How do I apply a discount code?',
            answer: 'During checkout, you\'ll see a "Promo Code" or "Discount Code" field. Enter your code and click "Apply". The discount will be reflected in your order total. Only one promo code can be used per order. Promo codes cannot be combined with other offers unless specified.'
        },
        {
            category: 'general',
            question: 'Do you have a loyalty program?',
            answer: 'Yes! Join DreamBoys Rewards to earn points on every purchase. Benefits include: Points on purchases (1 point = ₹1 spent), Exclusive member discounts, Early access to sales, Birthday rewards, Free shipping on all orders. Sign up in your account dashboard!'
        }
    ];

    // Apply context-based search and category filtering
    const filteredFAQs = (() => {
        let filtered = faqs;

        // Apply category filter first
        if (activeCategory !== 'all') {
            filtered = filtered.filter(faq => faq.category === activeCategory);
        }

        // Apply context-based search
        if (searchQuery && searchQuery.trim()) {
            filtered = searchFAQs(filtered, searchQuery);
        }

        return filtered;
    })();

    const toggleQuestion = (index) => {
        setOpenQuestion(openQuestion === index ? null : index);
    };

    return (
        <div className="faq-page">
            <div className="faq-hero">
                <div className="container">
                    <h1>Frequently Asked Questions</h1>
                    <p>Find answers to common questions about shopping with DreamBoys</p>

                    <div className="faq-search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="faq-content container">
                <div className="faq-categories">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <span className="category-icon">{cat.icon}</span>
                            <span className="category-name">{cat.name}</span>
                        </button>
                    ))}
                </div>

                <div className="faq-list">
                    {filteredFAQs.length === 0 ? (
                        <div className="no-results">
                            <h3>No questions found</h3>
                            <p>Try a different search term or category</p>
                        </div>
                    ) : (
                        filteredFAQs.map((faq, index) => (
                            <div key={index} className={`faq-item ${openQuestion === index ? 'open' : ''}`}>
                                <button className="faq-question" onClick={() => toggleQuestion(index)}>
                                    <span>{faq.question}</span>
                                    <svg
                                        className="faq-icon"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                <div className="faq-answer">
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="faq-contact">
                    <h2>Still have questions?</h2>
                    <p>Can't find the answer you're looking for? Our customer support team is here to help!</p>
                    <div className="contact-options">
                        <a href="mailto:support@dreamboys.com" className="contact-option">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <span>Email Us</span>
                        </a>
                        <a href="tel:+15551234567" className="contact-option">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <span>Call Us</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
