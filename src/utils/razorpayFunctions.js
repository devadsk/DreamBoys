import { getFunctions, httpsCallable } from 'firebase/functions';

// Initialize Firebase Functions
const functions = getFunctions();

/**
 * Create Razorpay order via Cloud Function
 * @param {number} amount - Amount in rupees
 * @param {string} paymentMethod - Payment method selected by user
 * @param {string} currency - Currency code (default: 'INR')
 * @returns {Promise<{success: boolean, orderId: string, amount: number, currency: string}>}
 */
export const createRazorpayOrder = async (amount, paymentMethod, currency = 'INR') => {
    try {
        const createOrder = httpsCallable(functions, 'createRazorpayOrder');

        const result = await createOrder({
            amount,
            currency,
            paymentMethod
        });

        return result.data;
    } catch (error) {
        console.error('Error calling createRazorpayOrder function:', error);
        throw new Error(error.message || 'Failed to create Razorpay order');
    }
};

/**
 * Verify Razorpay payment signature via Cloud Function
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {Promise<{success: boolean, verified: boolean}>}
 */
export const verifyRazorpayPayment = async (orderId, paymentId, signature) => {
    try {
        const verifyPayment = httpsCallable(functions, 'verifyRazorpayPayment');

        const result = await verifyPayment({
            orderId,
            paymentId,
            signature
        });

        return result.data;
    } catch (error) {
        console.error('Error calling verifyRazorpayPayment function:', error);
        throw new Error(error.message || 'Failed to verify payment');
    }
};
