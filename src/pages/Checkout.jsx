import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    getUserData,
    getSavedAddresses,
    saveAddress,
    deleteAddress,
    createOrder
} from '../firebase/firebaseService';
import { loadRazorpay } from '../utils/razorpay';
import { createRazorpayOrder, verifyRazorpayPayment } from '../utils/razorpayFunctions';
import './Checkout.css';
import { Timestamp } from 'firebase/firestore';

const Checkout = () => {
    const navigate = useNavigate();
    const { cart, getCartTotal, clearCart } = useCart();
    const { currentUser } = useAuth();
    const toast = useToast();

    const cartTotal = getCartTotal();

    // Steps: 1 = Shipping, 2 = Payment

    // Steps: 1 = Shipping, 2 = Payment
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Data State
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new');

    // Form State
    const [shippingInfo, setShippingInfo] = useState({
        fullName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
    });

    const [paymentMethod, setPaymentMethod] = useState('cod');

    // Load initial data
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (cart.length === 0) {
            navigate('/cart');
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);

                // Load User Profile
                const profileRes = await getUserData(currentUser.uid);
                if (profileRes.success && profileRes.data) {
                    setShippingInfo(prev => ({
                        ...prev,
                        fullName: profileRes.data.displayName || prev.fullName,
                        email: profileRes.data.email || currentUser.email || prev.email,
                        phone: profileRes.data.phone || prev.phone, // Found 'phone' in Profile.jsx not 'phoneNumber'
                        // Pre-fill address from profile if available
                        street: profileRes.data.address?.street || prev.street,
                        city: profileRes.data.address?.city || prev.city,
                        state: profileRes.data.address?.state || prev.state,
                        zipCode: profileRes.data.address?.postalCode || prev.zipCode,
                        country: profileRes.data.address?.country || prev.country
                    }));
                } else {
                    // Fallback to auth data
                    setShippingInfo(prev => ({
                        ...prev,
                        fullName: currentUser.displayName || '',
                        email: currentUser.email || ''
                    }));
                }

                // Load Saved Addresses
                const addressRes = await getSavedAddresses(currentUser.uid);
                if (addressRes.success) {
                    setSavedAddresses(addressRes.data);
                    // If address exists, select the first one by default
                    if (addressRes.data.length > 0) {
                        // Find default or first
                        const defaultAddr = addressRes.data.find(a => a.isDefault) || addressRes.data[0];
                        setSelectedAddressId(defaultAddr.id);
                        fillFormWithAddress(defaultAddr);
                    }
                }
            } catch (error) {
                console.error("Error loading checkout data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentUser, navigate, cart.length]);

    const fillFormWithAddress = (address) => {
        setShippingInfo(prev => ({
            ...prev,
            fullName: address.name || prev.fullName,
            phone: address.phone || prev.phone,
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.postalCode,
            country: address.country
        }));
    };

    const handleAddressSelect = (addressId) => {
        setSelectedAddressId(addressId);
        if (addressId === 'new') {
            // Clear address fields but keep contact info
            setShippingInfo(prev => ({
                ...prev,
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'India'
            }));
        } else {
            const address = savedAddresses.find(a => a.id === addressId);
            if (address) {
                fillFormWithAddress(address);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShippingInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleStep1Submit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!shippingInfo.fullName || !shippingInfo.street || !shippingInfo.city || !shippingInfo.zipCode) {
            toast.warning('Please fill in all required fields');
            return;
        }

        // If 'new' address selected, save it automatically
        if (selectedAddressId === 'new') {
            try {
                const newAddress = {
                    name: shippingInfo.fullName,
                    phone: shippingInfo.phone,
                    street: shippingInfo.street,
                    city: shippingInfo.city,
                    state: shippingInfo.state,
                    postalCode: shippingInfo.zipCode,
                    country: shippingInfo.country,
                    isDefault: savedAddresses.length === 0
                };

                const res = await saveAddress(currentUser.uid, newAddress);
                if (res.success) {
                    // Update list and select the new one
                    const updatedList = await getSavedAddresses(currentUser.uid);
                    if (updatedList.success) {
                        setSavedAddresses(updatedList.data);
                        setSelectedAddressId(res.id);
                    }
                }
            } catch (err) {
                console.error("Failed to save new address:", err);
            }
        }

        setCurrentStep(2);
        window.scrollTo(0, 0);
    };

    const handlePlaceOrder = async () => {
        try {
            setProcessing(true);

            // Validate shipping info
            if (!shippingInfo.fullName || !shippingInfo.email || !shippingInfo.phone ||
                !shippingInfo.street || !shippingInfo.city || !shippingInfo.state ||
                !shippingInfo.zipCode || !shippingInfo.country) {
                toast.warning('Please ensure all shipping information is filled out.');
                setProcessing(false);
                return;
            }

            // Basic Order Data (common for both)
            const orderBase = {
                userId: currentUser.uid,
                items: cart,
                shippingAddress: {
                    fullName: shippingInfo.fullName,
                    email: shippingInfo.email,
                    phone: shippingInfo.phone,
                    street: shippingInfo.street,
                    city: shippingInfo.city,
                    state: shippingInfo.state,
                    zipCode: shippingInfo.zipCode,
                    country: shippingInfo.country
                },
                subtotal: cartTotal,
                shipping: 0,
                total: cartTotal,
                email: shippingInfo.email
            };

            // CASE 1: Cash on Delivery
            if (paymentMethod === 'cod') {
                const res = await createOrder({
                    ...orderBase,
                    paymentMethod: 'cod'
                });

                if (res.success) {
                    clearCart();
                    navigate(`/order-success/${res.orderNumber}`);
                } else {
                    toast.error(`Order Failed: ${res.error}`);
                }
            }
            // CASE 2: Online Payment (Razorpay with Cloud Function)
            else {
                const isLoaded = await loadRazorpay();
                if (!isLoaded) {
                    toast.error('Razorpay SDK failed to load. Are you online?');
                    setProcessing(false);
                    return;
                }

                // Verify Razorpay is loaded
                if (!window.Razorpay) {
                    toast.error('Razorpay SDK loaded but window.Razorpay is undefined. Please check your internet connection.');
                    setProcessing(false);
                    return;
                }

                try {
                    // Step 1: Create Razorpay order via Cloud Function
                    console.log('Creating Razorpay order via Cloud Function...');
                    const razorpayOrderData = await createRazorpayOrder(
                        cartTotal,
                        paymentMethod,
                        'INR'
                    );

                    if (!razorpayOrderData.success) {
                        throw new Error('Failed to create Razorpay order');
                    }

                    console.log('Razorpay order created:', razorpayOrderData.orderId);

                    // Step 2: Open Razorpay checkout with order_id
                    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_RtlhgJ14PsoRoN";
                    const options = {
                        key: razorpayKey,
                        order_id: razorpayOrderData.orderId,
                        amount: razorpayOrderData.amount,
                        currency: razorpayOrderData.currency,
                        name: "DreamBoys Fashion",
                        description: "Payment for Order",
                        // FIXED: Image must be a public HTTPS URL (Razorpay cannot access localhost images due to CORS/Security)
                        image: "https://placehold.co/250x250/000000/ffffff?text=DreamBoys",
                        handler: async function (response) {
                            try {
                                console.log('Payment successful:', response);

                                // Step 3: Verify payment signature (optional but recommended)
                                const verificationResult = await verifyRazorpayPayment(
                                    response.razorpay_order_id,
                                    response.razorpay_payment_id,
                                    response.razorpay_signature
                                );

                                if (!verificationResult.verified) {
                                    throw new Error('Payment verification failed');
                                }

                                // Step 4: Create order in Firestore
                                const paymentDetails = {
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature,
                                    verified: true
                                };

                                const res = await createOrder({
                                    ...orderBase,
                                    paymentMethod: paymentMethod,
                                    paymentDetails: paymentDetails
                                });

                                if (res.success) {
                                    clearCart();
                                    navigate(`/order-success/${res.orderNumber}`);
                                } else {
                                    toast.error(`Payment successful but Order Creation Failed: ${res.error}`);
                                }
                            } catch (err) {
                                console.error("Post-payment error:", err);
                                toast.error(`An error occurred after payment: ${err.message}`);
                            }
                        },
                        prefill: {
                            name: shippingInfo.fullName,
                            email: shippingInfo.email,
                            contact: shippingInfo.phone
                        },
                        theme: {
                            color: "#dc2626"
                        },
                        modal: {
                            ondismiss: function () {
                                setProcessing(false);
                                console.log('Razorpay modal closed');
                            }
                        }
                    };

                    const paymentObject = new window.Razorpay(options);
                    paymentObject.on('payment.failed', function (response) {
                        toast.error(`Payment Failed: ${response.error.description}`);
                        setProcessing(false);
                    });
                    paymentObject.open();
                } catch (cloudFunctionError) {
                    console.error("Cloud Function Error:", cloudFunctionError);
                    toast.error(`Failed to initiate payment: ${cloudFunctionError.message}`);
                    setProcessing(false);
                }
            }

        } catch (error) {
            console.error("Order processing error:", error);
            toast.error('An error occurred while processing your order');
            setProcessing(false);
        } finally {
            if (paymentMethod === 'cod') {
                setProcessing(false);
            }
            // For online, processing stays true until modal closes or payment finishes
        }
    };

    const handleDeleteAddress = async (e, addressId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this address?')) {
            const res = await deleteAddress(currentUser.uid, addressId);
            if (res.success) {
                setSavedAddresses(prev => prev.filter(a => a.id !== addressId));
                if (selectedAddressId === addressId) {
                    setSelectedAddressId('new');
                    // Reset form fields
                    setShippingInfo(prev => ({
                        ...prev,
                        street: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        country: 'India'
                    }));
                }
            }
        }
    };

    if (loading) return <div className="checkout-page"><div className="container">Loading checkout...</div></div>;

    return (
        <div className="checkout-page">
            <div className="container">
                <h1>Checkout</h1>

                <div className="checkout-container">
                    <div className="checkout-main">
                        {/* Step 1: Shipping Information */}
                        {currentStep === 1 && (
                            <div className="checkout-section">
                                <h2>
                                    <span className="step-indicator">1</span>
                                    Shipping Information
                                </h2>

                                {savedAddresses.length > 0 && (
                                    <div className="saved-addresses-section">
                                        <h3>Saved Addresses</h3>
                                        <div className="saved-addresses">
                                            {savedAddresses.map(addr => (
                                                <div
                                                    key={addr.id}
                                                    className={`address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                                                    onClick={() => handleAddressSelect(addr.id)}
                                                >
                                                    <div className="address-header">
                                                        <span className="address-name">{addr.name}</span>
                                                        <button
                                                            className="delete-address-btn"
                                                            onClick={(e) => handleDeleteAddress(e, addr.id)}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <span className="address-phone">{addr.phone}</span>
                                                    <div className="address-details">
                                                        {addr.street}, {addr.city}<br />
                                                        {addr.state}, {addr.postalCode}<br />
                                                        {addr.country}
                                                    </div>
                                                </div>
                                            ))}

                                            <div
                                                className={`add-address-card ${selectedAddressId === 'new' ? 'selected' : ''}`}
                                                onClick={() => handleAddressSelect('new')}
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                </svg>
                                                <span>Add New Address</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleStep1Submit}>
                                    <div className="form-grid">
                                        <div className="form-group full-width">
                                            <label>Full Name</label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={shippingInfo.fullName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={shippingInfo.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={shippingInfo.phone}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Street Address</label>
                                            <input
                                                type="text"
                                                name="street"
                                                value={shippingInfo.street}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="House number and street name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={shippingInfo.city}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>State / Province</label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={shippingInfo.state}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>ZIP / Postal Code</label>
                                            <input
                                                type="text"
                                                name="zipCode"
                                                value={shippingInfo.zipCode}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Country</label>
                                            <select
                                                name="country"
                                                value={shippingInfo.country}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="India">India</option>
                                                <option value="United States">United States</option>
                                                <option value="United Kingdom">United Kingdom</option>
                                                <option value="Canada">Canada</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-primary">
                                        Continue to Payment
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Step 2: Payment Selection */}
                        {currentStep === 2 && (
                            <div className="checkout-section">
                                <button className="btn-back" onClick={() => setCurrentStep(1)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15 18 9 12 15 6"></polyline>
                                    </svg>
                                    Back to Shipping
                                </button>

                                <h2>
                                    <span className="step-indicator">2</span>
                                    Payment Method
                                </h2>

                                <div className="shipping-review">
                                    <p><strong>Ship to:</strong> {shippingInfo.fullName} | {shippingInfo.phone}</p>
                                    <p>{shippingInfo.street}, {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}, {shippingInfo.country}</p>
                                </div>
                                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

                                <div className="payment-methods">
                                    {/* UPI Options */}
                                    <div
                                        className={`payment-method-card ${paymentMethod.startsWith('upi') ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod('upi-gpay')}
                                    >
                                        <div className="radio-circle"></div>
                                        <div className="payment-logos-group">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/200px-UPI-Logo-vector.svg.png" alt="UPI" className="payment-logo-main" />
                                            {/* <div className="payment-logos-sub">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png" alt="GPay" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/PhonePe_Logo.png/120px-PhonePe_Logo.png" alt="PhonePe" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/120px-Paytm_Logo_%28standalone%29.svg.png" alt="Paytm" />
                                            </div> */}
                                        </div>
                                        <div className="payment-info">
                                            <span className="payment-title">UPI Payment</span>
                                            <span className="payment-desc">GPay, PhonePe, Paytm & more</span>
                                            {paymentMethod.startsWith('upi') && (
                                                <div className="sub-options">
                                                    <label className={`sub-option ${paymentMethod === 'upi-gpay' ? 'active' : ''}`}>
                                                        <input type="radio" name="upi" checked={paymentMethod === 'upi-gpay'} onChange={() => setPaymentMethod('upi-gpay')} />
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png" alt="GPay" className="sub-option-logo" />
                                                    </label>
                                                    <label className={`sub-option ${paymentMethod === 'upi-phonepe' ? 'active' : ''}`}>
                                                        <input type="radio" name="upi" checked={paymentMethod === 'upi-phonepe'} onChange={() => setPaymentMethod('upi-phonepe')} />
                                                        <img src="/payment-logos/phonepe.svg" alt="PhonePe" className="sub-option-logo" />

                                                    </label>
                                                    <label className={`sub-option ${paymentMethod === 'upi-paytm' ? 'active' : ''}`}>
                                                        <input type="radio" name="upi" checked={paymentMethod === 'upi-paytm'} onChange={() => setPaymentMethod('upi-paytm')} />
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/120px-Paytm_Logo_%28standalone%29.svg.png" alt="Paytm" className="sub-option-logo" />

                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Options */}
                                    <div
                                        className={`payment-method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod('card')}
                                    >
                                        <div className="radio-circle"></div>
                                        <div className="payment-logos-group">
                                            <div className="payment-logos-sub card-logos">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/120px-Visa_Inc._logo.svg.png" alt="Visa" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/120px-Mastercard-logo.svg.png" alt="Mastercard" />
                                                <img src="/payment-logos/rupay.png" alt="RuPay" />
                                            </div>
                                        </div>
                                        <div className="payment-info">
                                            <span className="payment-title">Credit / Debit Card</span>
                                            <span className="payment-desc">Visa, Mastercard, RuPay</span>
                                        </div>
                                    </div>

                                    {/* NetBanking */}
                                    <div
                                        className={`payment-method-card ${paymentMethod === 'netbanking' ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod('netbanking')}
                                    >
                                        <div className="radio-circle"></div>
                                        <div className="payment-icon">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 21h18M5 21V7l8-4 8 4v14M10 9L8 21M16 9l2 12"></path>
                                            </svg>
                                        </div>
                                        <div className="payment-info">
                                            <span className="payment-title">NetBanking</span>
                                            <span className="payment-desc">All Indian banks supported</span>
                                        </div>
                                    </div>

                                    {/* Cash on Delivery */}
                                    <div
                                        className={`payment-method-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod('cod')}
                                    >
                                        <div className="radio-circle"></div>
                                        <div className="payment-icon">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                            </svg>
                                        </div>
                                        <div className="payment-info">
                                            <span className="payment-title">Cash on Delivery</span>
                                            <span className="payment-desc">Pay cash upon delivery. +₹50 Handling Fee.</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '24px' }}>
                                    <button
                                        className="btn-primary"
                                        onClick={handlePlaceOrder}
                                        disabled={processing}
                                    >
                                        {processing ? 'Processing Order...' : `Place Order • ₹${cartTotal.toFixed(2)}`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="order-summary">
                        <h3>Order Summary</h3>

                        <div className="summary-items">
                            {cart.map(item => (
                                <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="summary-item">
                                    <img src={item.image} alt={item.name} />
                                    <div className="summary-item-details">
                                        <h4>{item.name}</h4>
                                        <div className="summary-item-meta">
                                            Size: {item.selectedSize} | Color: {item.selectedColor}
                                        </div>
                                        <div className="summary-item-meta">
                                            Qty: {item.quantity}
                                        </div>
                                        <div className="summary-item-price">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="summary-totals">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Free</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>₹{cartTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
