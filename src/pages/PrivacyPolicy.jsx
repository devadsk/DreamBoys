import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    const location = useLocation();

    // Handle smooth scrolling to anchor links
    useEffect(() => {
        if (location.hash) {
            const element = document.querySelector(location.hash);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }, [location]);

    // Handle click on anchor links within the page
    const handleAnchorClick = (e, targetId) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Update URL without triggering navigation
            window.history.pushState(null, '', `#${targetId}`);
        }
    };

    return (
        <div className="legal-page">
            <div className="legal-hero">
                <div className="container">
                    <h1>Privacy Policy</h1>
                    <p className="last-updated">Last Updated: December 16, 2024</p>
                </div>
            </div>

            <div className="legal-content container">
                <div className="legal-nav">
                    <h3>Quick Navigation</h3>
                    <ul>
                        <li><a href="#information-collection" onClick={(e) => handleAnchorClick(e, 'information-collection')}>Information We Collect</a></li>
                        <li><a href="#information-use" onClick={(e) => handleAnchorClick(e, 'information-use')}>How We Use Your Information</a></li>
                        <li><a href="#information-sharing" onClick={(e) => handleAnchorClick(e, 'information-sharing')}>Information Sharing</a></li>
                        <li><a href="#data-security" onClick={(e) => handleAnchorClick(e, 'data-security')}>Data Security</a></li>
                        <li><a href="#cookies" onClick={(e) => handleAnchorClick(e, 'cookies')}>Cookies & Tracking</a></li>
                        <li><a href="#your-rights" onClick={(e) => handleAnchorClick(e, 'your-rights')}>Your Rights</a></li>
                        <li><a href="#contact" onClick={(e) => handleAnchorClick(e, 'contact')}>Contact Us</a></li>
                    </ul>
                </div>

                <div className="legal-body">
                    <section id="introduction">
                        <p>
                            At DreamBoys, we are committed to protecting your privacy and ensuring the security of your personal information.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our
                            website and make purchases from our online store.
                        </p>
                        <p>
                            By using our services, you agree to the collection and use of information in accordance with this policy.
                            If you do not agree with our policies and practices, please do not use our services.
                        </p>
                    </section>

                    <section id="information-collection">
                        <h2>1. Information We Collect</h2>

                        <h3>1.1 Personal Information</h3>
                        <p>We collect information that you provide directly to us, including:</p>
                        <ul>
                            <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                            <li><strong>Billing Information:</strong> Billing address, payment card details (processed securely through payment gateways)</li>
                            <li><strong>Shipping Information:</strong> Delivery address, contact details</li>
                            <li><strong>Profile Information:</strong> Size preferences, style preferences, wishlist items</li>
                            <li><strong>Communication Data:</strong> Customer service inquiries, product reviews, feedback</li>
                        </ul>

                        <h3>1.2 Automatically Collected Information</h3>
                        <ul>
                            <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                            <li><strong>Usage Data:</strong> Pages viewed, time spent on site, click patterns</li>
                            <li><strong>Location Data:</strong> Approximate geographic location based on IP address</li>
                            <li><strong>Cookies & Similar Technologies:</strong> Session data, preferences, analytics</li>
                        </ul>

                        <h3>1.3 Information from Third Parties</h3>
                        <ul>
                            <li>Social media platforms (if you choose to connect your account)</li>
                            <li>Payment processors and fraud prevention services</li>
                            <li>Shipping and logistics partners</li>
                            <li>Marketing and analytics providers</li>
                        </ul>
                    </section>

                    <section id="information-use">
                        <h2>2. How We Use Your Information</h2>
                        <p>We use the collected information for various purposes:</p>

                        <h3>2.1 Order Processing & Fulfillment</h3>
                        <ul>
                            <li>Process and complete your orders</li>
                            <li>Arrange shipping and delivery</li>
                            <li>Send order confirmations and updates</li>
                            <li>Handle returns, exchanges, and refunds</li>
                        </ul>

                        <h3>2.2 Account Management</h3>
                        <ul>
                            <li>Create and maintain your account</li>
                            <li>Provide customer support</li>
                            <li>Manage your preferences and settings</li>
                            <li>Send important account notifications</li>
                        </ul>

                        <h3>2.3 Marketing & Communications</h3>
                        <ul>
                            <li>Send promotional emails about new products, sales, and offers (with your consent)</li>
                            <li>Personalize your shopping experience</li>
                            <li>Conduct surveys and gather feedback</li>
                            <li>Send newsletters and style tips</li>
                        </ul>

                        <h3>2.4 Analytics & Improvement</h3>
                        <ul>
                            <li>Analyze website usage and customer behavior</li>
                            <li>Improve our products, services, and website</li>
                            <li>Develop new features and offerings</li>
                            <li>Conduct market research</li>
                        </ul>

                        <h3>2.5 Security & Fraud Prevention</h3>
                        <ul>
                            <li>Detect and prevent fraudulent transactions</li>
                            <li>Protect against unauthorized access</li>
                            <li>Ensure compliance with legal obligations</li>
                            <li>Resolve disputes and enforce our terms</li>
                        </ul>
                    </section>

                    <section id="information-sharing">
                        <h2>3. Information Sharing and Disclosure</h2>
                        <p>We do not sell your personal information. We may share your information with:</p>

                        <h3>3.1 Service Providers</h3>
                        <ul>
                            <li><strong>Payment Processors:</strong> To process payments securely</li>
                            <li><strong>Shipping Partners:</strong> To deliver your orders</li>
                            <li><strong>Email Service Providers:</strong> To send communications</li>
                            <li><strong>Analytics Providers:</strong> To understand website usage</li>
                            <li><strong>Customer Service Tools:</strong> To provide support</li>
                        </ul>

                        <h3>3.2 Legal Requirements</h3>
                        <p>We may disclose your information if required by law or in response to:</p>
                        <ul>
                            <li>Legal processes or government requests</li>
                            <li>Protection of our rights and property</li>
                            <li>Prevention of fraud or security issues</li>
                            <li>Protection of user safety</li>
                        </ul>

                        <h3>3.3 Business Transfers</h3>
                        <p>
                            In the event of a merger, acquisition, or sale of assets, your information may be transferred
                            to the acquiring entity, subject to the same privacy protections.
                        </p>
                    </section>

                    <section id="data-security">
                        <h2>4. Data Security</h2>
                        <p>We implement industry-standard security measures to protect your information:</p>
                        <ul>
                            <li><strong>Encryption:</strong> SSL/TLS encryption for data transmission</li>
                            <li><strong>Secure Storage:</strong> Encrypted databases and secure servers</li>
                            <li><strong>Access Controls:</strong> Limited access to authorized personnel only</li>
                            <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                            <li><strong>PCI Compliance:</strong> Payment card industry security standards</li>
                        </ul>
                        <p className="note">
                            <strong>Note:</strong> While we strive to protect your information, no method of transmission over
                            the internet is 100% secure. We cannot guarantee absolute security.
                        </p>
                    </section>

                    <section id="cookies">
                        <h2>5. Cookies and Tracking Technologies</h2>

                        <h3>5.1 What Are Cookies?</h3>
                        <p>
                            Cookies are small text files stored on your device that help us provide and improve our services.
                        </p>

                        <h3>5.2 Types of Cookies We Use</h3>
                        <ul>
                            <li><strong>Essential Cookies:</strong> Required for website functionality (shopping cart, login)</li>
                            <li><strong>Performance Cookies:</strong> Help us understand how visitors use our site</li>
                            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                            <li><strong>Marketing Cookies:</strong> Track your activity for personalized advertising</li>
                        </ul>

                        <h3>5.3 Managing Cookies</h3>
                        <p>
                            You can control cookies through your browser settings. Note that disabling cookies may affect
                            website functionality.
                        </p>
                    </section>

                    <section id="your-rights">
                        <h2>6. Your Privacy Rights</h2>
                        <p>You have the following rights regarding your personal information:</p>

                        <h3>6.1 Access and Portability</h3>
                        <ul>
                            <li>Request a copy of your personal data</li>
                            <li>Download your information in a portable format</li>
                        </ul>

                        <h3>6.2 Correction and Update</h3>
                        <ul>
                            <li>Update your account information</li>
                            <li>Correct inaccurate data</li>
                        </ul>

                        <h3>6.3 Deletion</h3>
                        <ul>
                            <li>Request deletion of your account and data</li>
                            <li>Right to be forgotten (subject to legal requirements)</li>
                        </ul>

                        <h3>6.4 Marketing Opt-Out</h3>
                        <ul>
                            <li>Unsubscribe from marketing emails</li>
                            <li>Opt-out of personalized advertising</li>
                            <li>Manage communication preferences</li>
                        </ul>

                        <h3>6.5 Data Retention</h3>
                        <p>
                            We retain your information for as long as necessary to provide our services and comply with
                            legal obligations. You can request deletion at any time.
                        </p>
                    </section>

                    <section id="children">
                        <h2>7. Children's Privacy</h2>
                        <p>
                            Our services are not intended for children under 13 years of age. We do not knowingly collect
                            personal information from children. If you believe we have collected information from a child,
                            please contact us immediately.
                        </p>
                    </section>

                    <section id="international">
                        <h2>8. International Data Transfers</h2>
                        <p>
                            Your information may be transferred to and processed in countries other than your own.
                            We ensure appropriate safeguards are in place to protect your data in accordance with this policy.
                        </p>
                    </section>

                    <section id="changes">
                        <h2>9. Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any material changes
                            by posting the new policy on this page and updating the "Last Updated" date. Your continued use
                            of our services after changes constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    <section id="contact">
                        <h2>10. Contact Us</h2>
                        <div className="contact-info">
                            <p>
                                If you have questions or concerns about this Privacy Policy or our data practices, please
                                <Link to="/contact" className="contact-link"> visit our Contact Us page</Link>.
                            </p>
                        </div>
                    </section>

                    <div className="legal-footer">
                        <p>
                            By using DreamBoys services, you acknowledge that you have read and understood this Privacy Policy.
                        </p>
                        <Link to="/terms" className="link-to-terms">View Terms of Service →</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
