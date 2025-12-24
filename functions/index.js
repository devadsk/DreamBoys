const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');

admin.initializeApp();

// Initialize Razorpay
// You'll need to set these in Firebase Functions config
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RtlhgJ14PsoRoN',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET'
});

/**
 * Create Razorpay Order with method-specific configuration
 * 
 * Request body:
 * {
 *   amount: number (in rupees),
 *   currency: string (default: 'INR'),
 *   paymentMethod: string ('upi-gpay', 'upi-phonepe', 'card', 'netbanking', etc.)
 * }
 */
exports.createRazorpayOrder = onCall(async (request) => {
    try {
        // Verify user is authenticated
        if (!request.auth) {
            throw new Error('User must be authenticated to create orders');
        }

        const { amount, currency = 'INR', paymentMethod } = request.data;

        // Validate input
        if (!amount || amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }

        // Create order options
        const orderOptions = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: currency,
            receipt: `order_${Date.now()}`,
            payment_capture: 1
        };

        // Add method-specific configuration
        const methodConfig = getMethodConfig(paymentMethod);
        if (methodConfig) {
            orderOptions.method = methodConfig.method;
            if (methodConfig.bank) {
                orderOptions.bank = methodConfig.bank;
            }
        }

        // Create Razorpay order
        const order = await razorpay.orders.create(orderOptions);

        // Log order creation
        console.log('Razorpay order created:', {
            orderId: order.id,
            amount: order.amount,
            method: paymentMethod,
            userId: request.auth.uid
        });

        return {
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            method: paymentMethod
        };

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw new Error(error.message || 'Failed to create Razorpay order');
    }
});

/**
 * Get method-specific configuration for Razorpay
 */
function getMethodConfig(paymentMethod) {
    const config = {};

    switch (paymentMethod) {
        case 'upi-gpay':
        case 'upi-phonepe':
        case 'upi-paytm':
            config.method = 'upi';
            break;
        case 'card':
            config.method = 'card';
            break;
        case 'netbanking':
            config.method = 'netbanking';
            break;
        default:
            return null; // Allow all methods
    }

    return config;
}

/**
 * Verify Razorpay payment signature
 * 
 * Request body:
 * {
 *   orderId: string,
 *   paymentId: string,
 *   signature: string
 * }
 */
exports.verifyRazorpayPayment = onCall(async (request) => {
    try {
        // Verify user is authenticated
        if (!request.auth) {
            throw new Error('User must be authenticated');
        }

        const { orderId, paymentId, signature } = request.data;

        if (!orderId || !paymentId || !signature) {
            throw new Error('Missing required payment verification data');
        }

        // Verify signature
        const crypto = require('crypto');
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        const isValid = generatedSignature === signature;

        if (isValid) {
            console.log('Payment verified successfully:', {
                orderId,
                paymentId,
                userId: request.auth.uid
            });
        } else {
            console.warn('Payment verification failed:', {
                orderId,
                paymentId,
                userId: request.auth.uid
            });
        }

        return {
            success: true,
            verified: isValid
        };

    } catch (error) {
        console.error('Error verifying payment:', error);
        throw new Error(error.message || 'Failed to verify payment');
    }
});

/**
 * Process Refund through Razorpay
 * Callable function to process refunds for cancelled orders
 */
exports.processRefund = onCall(async (request) => {
    try {
        // Verify user is authenticated
        if (!request.auth) {
            throw new Error('User must be authenticated to process refunds');
        }

        const { paymentId, amount, notes } = request.data;

        // Validate input
        if (!paymentId || !amount) {
            throw new Error('Payment ID and amount are required');
        }

        // Create refund through Razorpay API
        const refund = await razorpay.payments.refund(paymentId, {
            amount: amount, // Amount in paise
            speed: 'normal', // 'normal' or 'optimum'
            notes: notes || {},
            receipt: `refund_${Date.now()}`
        });

        console.log('Refund processed:', refund.id);

        return {
            success: true,
            refundId: refund.id,
            status: refund.status,
            amount: refund.amount,
            currency: refund.currency,
            createdAt: refund.created_at
        };
    } catch (error) {
        console.error('Refund processing error:', error);
        throw new Error(error.message || 'Failed to process refund');
    }
});

/**
 * Get Refund Status
 * Callable function to check the status of a refund
 */
exports.getRefundStatus = onCall(async (request) => {
    try {
        // Verify user is authenticated
        if (!request.auth) {
            throw new Error('User must be authenticated');
        }

        const { refundId } = request.data;

        if (!refundId) {
            throw new Error('Refund ID is required');
        }

        // Fetch refund details from Razorpay
        const refund = await razorpay.refunds.fetch(refundId);

        return {
            success: true,
            status: refund.status,
            amount: refund.amount,
            currency: refund.currency,
            createdAt: refund.created_at,
            processedAt: refund.processed_at
        };
    } catch (error) {
        console.error('Error fetching refund status:', error);
        throw new Error(error.message || 'Failed to fetch refund status');
    }
});

/**
 * Webhook handler for Razorpay refund events
 * Updates order status when refund is processed
 */
const { onRequest } = require('firebase-functions/v2/https');

exports.razorpayRefundWebhook = onRequest(async (req, res) => {
    const crypto = require('crypto');

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'YOUR_WEBHOOK_SECRET';
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

    if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const payload = req.body.payload.refund.entity;

    try {
        if (event === 'refund.processed') {
            // Update order in Firestore
            const ordersRef = admin.firestore().collection('orders');
            const snapshot = await ordersRef
                .where('paymentDetails.razorpay_payment_id', '==', payload.payment_id)
                .get();

            if (!snapshot.empty) {
                const orderDoc = snapshot.docs[0];
                await orderDoc.ref.update({
                    refundStatus: 'completed',
                    refundCompletedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                console.log(`Order ${orderDoc.id} refund completed`);
            }
        }

        res.status(200).send('Webhook processed');
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Webhook processing failed');
    }
});
