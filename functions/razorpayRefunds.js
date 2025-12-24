// Firebase Cloud Function for Razorpay Refunds
// Add this to your functions/index.js file

const functions = require('firebase-functions');
const Razorpay = require('razorpay');

// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
    key_id: functions.config().razorpay.key_id,
    key_secret: functions.config().razorpay.key_secret
});

/**
 * Process Refund through Razorpay
 * Callable function to process refunds for cancelled orders
 */
exports.processRefund = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated to process refunds'
        );
    }

    const { paymentId, amount, notes } = data;

    // Validate input
    if (!paymentId || !amount) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Payment ID and amount are required'
        );
    }

    try {
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

        // Handle specific Razorpay errors
        if (error.error) {
            throw new functions.https.HttpsError(
                'internal',
                `Razorpay error: ${error.error.description || error.error.code}`
            );
        }

        throw new functions.https.HttpsError(
            'internal',
            'Failed to process refund'
        );
    }
});

/**
 * Get Refund Status
 * Callable function to check the status of a refund
 */
exports.getRefundStatus = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated'
        );
    }

    const { refundId } = data;

    if (!refundId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Refund ID is required'
        );
    }

    try {
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

        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch refund status'
        );
    }
});

/**
 * Webhook handler for Razorpay refund events
 * Updates order status when refund is processed
 */
exports.razorpayRefundWebhook = functions.https.onRequest(async (req, res) => {
    const admin = require('firebase-admin');
    const crypto = require('crypto');

    // Verify webhook signature
    const webhookSecret = functions.config().razorpay.webhook_secret;
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
