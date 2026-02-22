import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './PrivacyPolicy.css';

const TermsOfService = () => {
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
                    <h1>Terms of Service</h1>
                    <p className="last-updated">Last Updated: December 16, 2024</p>
                </div>
            </div>

            <div className="legal-content container">
                <div className="legal-nav">
                    <h3>Quick Navigation</h3>
                    <ul>
                        <li><a href="#agreement" onClick={(e) => handleAnchorClick(e, 'agreement')}>Agreement to Terms</a></li>
                        <li><a href="#account" onClick={(e) => handleAnchorClick(e, 'account')}>Account Registration</a></li>
                        <li><a href="#orders" onClick={(e) => handleAnchorClick(e, 'orders')}>Orders & Payments</a></li>
                        <li><a href="#shipping" onClick={(e) => handleAnchorClick(e, 'shipping')}>Shipping & Delivery</a></li>
                        <li><a href="#returns" onClick={(e) => handleAnchorClick(e, 'returns')}>Returns & Refunds</a></li>
                        <li><a href="#prohibited" onClick={(e) => handleAnchorClick(e, 'prohibited')}>Prohibited Activities</a></li>
                        <li><a href="#intellectual" onClick={(e) => handleAnchorClick(e, 'intellectual')}>Intellectual Property</a></li>
                        <li><a href="#limitation" onClick={(e) => handleAnchorClick(e, 'limitation')}>Limitation of Liability</a></li>
                    </ul>
                </div>

                <div className="legal-body">
                    <section id="introduction">
                        <p>
                            Welcome to DreamBoys! These Terms of Service ("Terms") govern your access to and use of our website,
                            mobile application, and services (collectively, the "Services"). By accessing or using our Services,
                            you agree to be bound by these Terms.
                        </p>
                        <p className="important-notice">
                            <strong>IMPORTANT:</strong> Please read these Terms carefully before using our Services. If you do not
                            agree to these Terms, you may not access or use our Services.
                        </p>
                    </section>

                    <section id="agreement">
                        <h2>1. Agreement to Terms</h2>

                        <h3>1.1 Acceptance</h3>
                        <p>
                            By creating an account, making a purchase, or otherwise using our Services, you acknowledge that you
                            have read, understood, and agree to be bound by these Terms and our Privacy Policy.
                        </p>

                        <h3>1.2 Eligibility</h3>
                        <ul>
                            <li>You must be at least 18 years old to use our Services</li>
                            <li>You must provide accurate and complete information</li>
                            <li>You must have the legal capacity to enter into binding contracts</li>
                            <li>You must not be prohibited from using our Services under applicable law</li>
                        </ul>

                        <h3>1.3 Modifications</h3>
                        <p>
                            We reserve the right to modify these Terms at any time. We will notify you of material changes
                            by posting the updated Terms on our website. Your continued use of our Services after such changes
                            constitutes acceptance of the modified Terms.
                        </p>
                    </section>

                    <section id="account">
                        <h2>2. Account Registration and Security</h2>

                        <h3>2.1 Account Creation</h3>
                        <ul>
                            <li>You must create an account to access certain features</li>
                            <li>You must provide accurate, current, and complete information</li>
                            <li>You must maintain and update your information as needed</li>
                            <li>One person or entity may maintain only one account</li>
                        </ul>

                        <h3>2.2 Account Security</h3>
                        <ul>
                            <li>You are responsible for maintaining the confidentiality of your password</li>
                            <li>You are responsible for all activities under your account</li>
                            <li>You must notify us immediately of any unauthorized access</li>
                            <li>We are not liable for losses due to unauthorized use of your account</li>
                        </ul>

                        <h3>2.3 Account Termination</h3>
                        <p>
                            We reserve the right to suspend or terminate your account at any time for violation of these Terms,
                            fraudulent activity, or any other reason at our sole discretion.
                        </p>
                    </section>

                    <section id="orders">
                        <h2>3. Orders and Payments</h2>

                        <h3>3.1 Product Information</h3>
                        <ul>
                            <li>We strive to display accurate product information, including colors, sizes, and descriptions</li>
                            <li>We do not warrant that product descriptions are error-free</li>
                            <li>We reserve the right to correct errors and update information</li>
                            <li>Actual product colors may vary slightly from images due to screen settings</li>
                        </ul>

                        <h3>3.2 Pricing</h3>
                        <ul>
                            <li>All prices are in Indian Rupees (₹) unless otherwise stated</li>
                            <li>Prices are subject to change without notice</li>
                            <li>We reserve the right to correct pricing errors</li>
                            <li>Promotional prices are valid for the specified period only</li>
                            <li>Additional charges (shipping, taxes) will be clearly displayed before checkout</li>
                        </ul>

                        <h3>3.3 Order Acceptance</h3>
                        <ul>
                            <li>Your order is an offer to purchase products</li>
                            <li>We reserve the right to accept or reject any order</li>
                            <li>Order confirmation does not guarantee acceptance</li>
                            <li>We may cancel orders due to pricing errors, stock unavailability, or fraud concerns</li>
                        </ul>

                        <h3>3.4 Payment</h3>
                        <ul>
                            <li>Payment must be received before order processing</li>
                            <li>We accept major credit cards, debit cards, and other specified payment methods</li>
                            <li>Payment information is processed securely through third-party payment processors</li>
                            <li>You authorize us to charge your payment method for the total order amount</li>
                        </ul>

                        <h3>3.5 Order Cancellation</h3>
                        <ul>
                            <li>You may cancel orders before shipment</li>
                            <li>Cancellation requests must be submitted through your account or customer service</li>
                            <li>Refunds for cancelled orders will be processed within 5-7 business days</li>
                            <li>We reserve the right to cancel orders for any reason</li>
                        </ul>
                    </section>

                    <section id="shipping">
                        <h2>4. Shipping and Delivery</h2>

                        <h3>4.1 Shipping Areas</h3>
                        <p>
                            We currently ship to addresses within India. International shipping may be available for select locations.
                        </p>

                        <h3>4.2 Delivery Time</h3>
                        <ul>
                            <li>Standard delivery: 5-7 business days</li>
                            <li>Express delivery: 2-3 business days (where available)</li>
                            <li>Delivery times are estimates and not guaranteed</li>
                            <li>Delays may occur due to weather, holidays, or other unforeseen circumstances</li>
                        </ul>

                        <h3>4.3 Shipping Charges</h3>
                        <ul>
                            <li>Shipping charges are calculated based on order value and delivery location</li>
                            <li>Free shipping may be offered on orders above a specified amount</li>
                            <li>Shipping charges are displayed before checkout</li>
                        </ul>

                        <h3>4.4 Delivery Issues</h3>
                        <ul>
                            <li>You must provide accurate shipping information</li>
                            <li>We are not responsible for delays due to incorrect addresses</li>
                            <li>Undelivered packages due to incorrect information may incur additional charges</li>
                            <li>Contact customer service for delivery issues within 48 hours</li>
                        </ul>
                    </section>

                    <section id="returns">
                        <h2>5. Returns, Exchanges, and Refunds</h2>

                        <h3>5.1 Return Policy</h3>
                        <ul>
                            <li>Products may be returned within 2 days of delivery</li>
                            <li>Items must be unused, unwashed, and in original condition with tags attached</li>
                            <li>Original packaging and invoice must be included</li>
                            <li>Certain items (intimate wear, sale items) may not be eligible for return</li>
                        </ul>

                        <h3>5.2 Exchange Policy</h3>
                        <ul>
                            <li>Exchanges are subject to product availability</li>
                            <li>Size and color exchanges are available within 2 days</li>
                            <li>Exchange requests must meet return policy conditions</li>
                            <li>Additional charges may apply for price differences</li>
                        </ul>

                        <h3>5.3 Refund Process</h3>
                        <ul>
                            <li>Refunds are processed after inspection of returned items</li>
                            <li>Refund amount will be credited to the original payment method</li>
                            <li>Processing time: 7-10 business days after receipt of return</li>
                            <li>Shipping charges are non-refundable unless the return is due to our error</li>
                        </ul>

                        <h3>5.4 Damaged or Defective Items</h3>
                        <ul>
                            <li>Report damaged or defective items within 48 hours of delivery</li>
                            <li>Provide photos and description of the issue</li>
                            <li>We will arrange for replacement or full refund</li>
                            <li>Return shipping costs will be covered by us</li>
                        </ul>
                    </section>

                    <section id="prohibited">
                        <h2>6. Prohibited Activities</h2>
                        <p>You agree not to:</p>
                        <ul>
                            <li>Use our Services for any illegal purpose</li>
                            <li>Violate any applicable laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Transmit viruses, malware, or harmful code</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Engage in fraudulent activities or payment disputes</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Scrape, copy, or reproduce our content without permission</li>
                            <li>Create fake accounts or impersonate others</li>
                            <li>Interfere with the proper functioning of our Services</li>
                        </ul>
                    </section>

                    <section id="intellectual">
                        <h2>7. Intellectual Property Rights</h2>

                        <h3>7.1 Our Content</h3>
                        <p>
                            All content on our Services, including text, graphics, logos, images, videos, and software,
                            is the property of DreamBoys or its licensors and is protected by copyright, trademark, and
                            other intellectual property laws.
                        </p>

                        <h3>7.2 Limited License</h3>
                        <p>
                            We grant you a limited, non-exclusive, non-transferable license to access and use our Services
                            for personal, non-commercial purposes. You may not:
                        </p>
                        <ul>
                            <li>Modify, copy, or distribute our content</li>
                            <li>Reverse engineer or decompile our software</li>
                            <li>Remove copyright or proprietary notices</li>
                            <li>Use our content for commercial purposes without permission</li>
                        </ul>

                        <h3>7.3 User Content</h3>
                        <p>
                            By submitting reviews, photos, or other content, you grant us a worldwide, royalty-free license
                            to use, reproduce, modify, and display such content for marketing and promotional purposes.
                        </p>
                    </section>

                    <section id="warranty">
                        <h2>8. Warranties and Disclaimers</h2>

                        <h3>8.1 Product Warranty</h3>
                        <p>
                            We warrant that products will be free from defects in materials and workmanship under normal use.
                            This warranty does not cover damage from misuse, accidents, or normal wear and tear.
                        </p>

                        <h3>8.2 Service Disclaimer</h3>
                        <p className="disclaimer">
                            OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
                            OR IMPLIED. WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
                        </p>
                    </section>

                    <section id="limitation">
                        <h2>9. Limitation of Liability</h2>
                        <p className="disclaimer">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, DREAMBOYS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR BUSINESS
                            INTERRUPTION, ARISING FROM YOUR USE OF OUR SERVICES.
                        </p>
                        <p>
                            Our total liability for any claim arising from these Terms or your use of our Services shall not
                            exceed the amount you paid for the product or service giving rise to the claim.
                        </p>
                    </section>

                    <section id="indemnification">
                        <h2>10. Indemnification</h2>
                        <p>
                            You agree to indemnify and hold harmless DreamBoys, its affiliates, and their respective officers,
                            directors, employees, and agents from any claims, damages, losses, liabilities, and expenses
                            (including legal fees) arising from:
                        </p>
                        <ul>
                            <li>Your violation of these Terms</li>
                            <li>Your violation of any rights of third parties</li>
                            <li>Your use of our Services</li>
                            <li>Your content or submissions</li>
                        </ul>
                    </section>

                    <section id="governing-law">
                        <h2>11. Governing Law and Dispute Resolution</h2>

                        <h3>11.1 Governing Law</h3>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of India,
                            without regard to conflict of law principles.
                        </p>

                        <h3>11.2 Dispute Resolution</h3>
                        <p>
                            Any disputes arising from these Terms or your use of our Services shall be resolved through:
                        </p>
                        <ol>
                            <li><strong>Informal Resolution:</strong> Contact our customer service team first</li>
                            <li><strong>Mediation:</strong> If informal resolution fails, parties agree to mediation</li>
                            <li><strong>Arbitration:</strong> Binding arbitration in Madurai, Tamil Nadu</li>
                            <li><strong>Jurisdiction:</strong> Courts of Madurai, Tamil Nadu shall have exclusive jurisdiction</li>
                        </ol>
                    </section>

                    <section id="miscellaneous">
                        <h2>12. Miscellaneous</h2>

                        <h3>12.1 Entire Agreement</h3>
                        <p>
                            These Terms, together with our Privacy Policy, constitute the entire agreement between you and
                            DreamBoys regarding our Services.
                        </p>

                        <h3>12.2 Severability</h3>
                        <p>
                            If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions
                            shall remain in full force and effect.
                        </p>

                        <h3>12.3 Waiver</h3>
                        <p>
                            Our failure to enforce any right or provision of these Terms shall not constitute a waiver of
                            such right or provision.
                        </p>

                        <h3>12.4 Assignment</h3>
                        <p>
                            You may not assign or transfer these Terms without our prior written consent. We may assign
                            these Terms without restriction.
                        </p>
                    </section>

                    <section id="contact">
                        <h2>13. Contact Information</h2>
                        <p>For questions about these Terms of Service, please contact us:</p>
                        <div className="contact-info">
                            <p><strong>DreamBoys Fashion</strong></p>
                            <p>Email: <a href="mailto:legal@dreamboys.com">legal@dreamboys.com</a></p>
                            <p>Email: <a href="mailto:support@dreamboys.com">support@dreamboys.com</a></p>
                            <p>Phone: +1 (555) 123-4567</p>
                            <p>Address: 19, Alagar Kovil Mainroad, Outpost, Madurai, Tamilnadu-625002</p>
                        </div>
                    </section>

                    <div className="legal-footer">
                        <p>
                            By using DreamBoys services, you acknowledge that you have read, understood, and agree to be
                            bound by these Terms of Service.
                        </p>
                        <Link to="/privacy" className="link-to-terms">View Privacy Policy →</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
