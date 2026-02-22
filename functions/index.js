const { onCall, HttpsError, onRequest } = require('firebase-functions/v2/https');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const { createShiprocketOrder, mapShiprocketStatus, cancelShiprocketOrder, cancelShiprocketByOrderId } = require('./shiprocket');

admin.initializeApp();

// Helper to initialize Razorpay with secrets
const getRazorpay = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

// Global init for legacy/other functions if needed, but functions should use getRazorpay()
// const razorpay = new Razorpay({...}) // Removing global init to force use of getRazorpay() which guarantees secret access inside the function scope

/**
 * Create Razorpay Order with method-specific configuration
 */
exports.createRazorpayOrder = onCall({
    secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]
}, async (request) => {
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
        const razorpay = getRazorpay();
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
        case 'upi':
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
 */
exports.verifyRazorpayPayment = onCall({
    secrets: ["RAZORPAY_KEY_SECRET"]
}, async (request) => {
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
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
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
exports.processRefund = onCall({
    secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]
}, async (request) => {
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
        const razorpay = getRazorpay();
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
exports.getRefundStatus = onCall({
    secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]
}, async (request) => {
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
        const razorpay = getRazorpay();
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
exports.razorpayRefundWebhook = onRequest({
    secrets: ["RAZORPAY_WEBHOOK_SECRET"]
}, async (req, res) => {
    const crypto = require('crypto');

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
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

/**
 * Create Shiprocket Order (Shipment)
 * Callable triggered by admin after confirming payment/order
 */
exports.initiateShipment = onCall({
    secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"]
}, async (request) => {
    try {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
        }

        const { orderId, pickupLocation } = request.data;
        if (!orderId) {
            throw new HttpsError('invalid-argument', 'The function must be called with an orderId.');
        }

        console.log(`Initiating shipment for order: ${orderId}, Location: ${pickupLocation || 'Default'}`);

        const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new HttpsError('not-found', 'The order was not found.');
        }

        const orderData = orderDoc.data();

        // Check if shipment already exists
        if (orderData.delivery?.shipmentId) {
            return { success: true, message: 'Shipment already exists', delivery: orderData.delivery };
        }

        // Create shipment in Shiprocket
        const srResponse = await createShiprocketOrder(orderData, orderId, pickupLocation);

        const deliveryUpdate = {
            ...orderData.delivery,
            status: 'shipped',
            shipmentId: srResponse.shipment_id || null,
            shiprocketOrderId: srResponse.order_id || null, // Save Shiprocket's internal Order ID
            courier: srResponse.courier_name || null,
            trackingId: srResponse.tracking_id || srResponse.awb_code || null,
            trackingUrl: srResponse.tracking_url || `https://shiprocket.co/tracking/${srResponse.tracking_id || srResponse.awb_code}`,
            history: [
                ...(orderData.delivery?.history || []),
                {
                    status: 'shipped',
                    message: 'Shipment created and tracking ID assigned.',
                    timestamp: new Date().toISOString()
                }
            ]
        };

        await orderDoc.ref.update({
            status: 'shipped',
            delivery: deliveryUpdate,
            updatedAt: new Date().toISOString()
        });

        return {
            success: true,
            delivery: deliveryUpdate
        };

    } catch (error) {
        console.error('Initiate Shipment Error:', error);
        // If it's already an HttpsError, rethrow it
        if (error.code && error.details) {
            throw error;
        }
        // Map common error messages to clearer v2 errors
        throw new HttpsError('internal', error.message || 'Shipment Initiation Failed');
    }
});

/**
 * Shiprocket Webhook Handler
 */
exports.shiprocketWebhook = onRequest({
    secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] // Added secrets for auto-refund
}, async (req, res) => {
    // Shiprocket sends a signature in 'x-api-key' or similar depending on setup
    // For now, we process the payload. In production, verify the source.

    const payload = req.body;
    console.log('Shiprocket Webhook received:', payload);

    const { order_id, status, awb, courier_name, shipment_id } = payload;

    try {
        if (!order_id) {
            return res.status(400).send('Missing order_id');
        }

        const ordersRef = admin.firestore().collection('orders');
        const snapshot = await ordersRef.where('orderNumber', '==', order_id).get();

        if (snapshot.empty) {
            console.warn(`Order ${order_id} not found for Shiprocket update`);
            return res.status(404).send('Order not found');
        }

        const orderDoc = snapshot.docs[0];
        const orderData = orderDoc.data(); // Define orderData here
        const internalStatus = mapShiprocketStatus(status);
        if (internalStatus) {
            const deliveryHistory = orderData.delivery?.history || [];

            // Check if this status is already the latest to avoid duplicate history entries
            if (orderData.delivery?.status !== internalStatus) {
                await orderDoc.ref.update({ // Use orderDoc.ref
                    status: internalStatus,
                    'delivery.status': internalStatus,
                    'delivery.history': admin.firestore.FieldValue.arrayUnion({
                        status: internalStatus,
                        message: `Status updated to ${internalStatus} via Shiprocket.`,
                        timestamp: new Date().toISOString()
                    }),
                    updatedAt: new Date().toISOString()
                });

                // Auto-refund for Cancelled or Returned orders (Prepaid only)
                if (['cancelled', 'returned'].includes(internalStatus)) {
                    const isPrepaid = orderData.paymentMethod !== 'cod';
                    const hasPaymentId = orderData.paymentDetails?.razorpay_payment_id;
                    const notRefunded = !['completed', 'processing'].includes(orderData.refundStatus);

                    if (isPrepaid && hasPaymentId && notRefunded) {
                        try {
                            console.log(`Auto-initiating refund for Order ${order_id} (${internalStatus})`);
                            // Refund full amount (amount in paise)
                            const refundAmount = Math.round(orderData.total * 100);

                            const razorpay = getRazorpay();
                            const refund = await razorpay.payments.refund(orderData.paymentDetails.razorpay_payment_id, {
                                amount: refundAmount,
                                notes: {
                                    reason: `Auto-refund triggered by Shiprocket status: ${internalStatus}`
                                }
                            });

                            await orderDoc.ref.update({
                                refundStatus: 'processing',
                                refundId: refund.id,
                                refundInitiatedAt: new Date().toISOString()
                            });
                            console.log(`Refund initiated: ${refund.id}`);
                        } catch (error) {
                            console.error(`Auto-refund failed for ${order_id}:`, error);
                            await orderDoc.ref.update({
                                'delivery.history': admin.firestore.FieldValue.arrayUnion({
                                    status: 'refund_failed',
                                    message: `Auto-refund failed: ${error.message}`,
                                    timestamp: new Date().toISOString()
                                })
                            });
                        }
                    }
                }
            }
        }
        // Update tracking info if provided (AWB assignment)
        if (awb || shipment_id) {
            await orderDoc.ref.update({
                'delivery.shipmentId': shipment_id || orderData.delivery?.shipmentId,
                'delivery.trackingId': awb || orderData.delivery?.trackingId,
                'delivery.courier': courier_name || orderData.delivery?.courier,
                updatedAt: new Date().toISOString()
            });
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Internal Error');
    }
});
/**
 * Firestore Trigger: Automatically initiate shipment when order is confirmed
 */
exports.onOrderConfirmed = onDocumentUpdated({
    document: 'orders/{orderId}',
    secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"]
}, async (event) => {
    const newValue = event.data.after.data();
    const oldValue = event.data.before.data();

    // Trigger only if status changed to 'confirmed'
    if (newValue.status === 'confirmed' && oldValue.status !== 'confirmed') {
        const orderId = event.params.orderId;

        // Skip if shipment already exists
        if (newValue.delivery?.shipmentId) return;

        try {
            console.log(`Auto-initiating shipment for order: ${orderId}`);
            const srResponse = await createShiprocketOrder(newValue, orderId);

            const deliveryUpdate = {
                ...newValue.delivery,
                status: 'shipped',
                shipmentId: srResponse.shipment_id || null,
                courier: srResponse.courier_name || null,
                trackingId: srResponse.tracking_id || srResponse.awb_code || null,
                trackingUrl: srResponse.tracking_url || `https://shiprocket.co/tracking/${srResponse.tracking_id || srResponse.awb_code}`,
                history: [
                    ...(newValue.delivery?.history || []),
                    {
                        status: 'shipped',
                        message: 'Shipment created automatically after confirmation.',
                        timestamp: new Date().toISOString()
                    }
                ]
            };

            await event.data.after.ref.update({
                status: 'shipped',
                delivery: deliveryUpdate,
                updatedAt: new Date().toISOString()
            });

        } catch (error) {
            console.error(`Auto-Shipment Error for ${orderId}:`, error);
            // Update history with failure
            await event.data.after.ref.update({
                'delivery.status': 'failed',
                'delivery.history': admin.firestore.FieldValue.arrayUnion({
                    status: 'failed',
                    message: `Auto-shipment failed: ${error.message}`,
                    timestamp: new Date().toISOString()
                })
            });
        }
    }
});

/**
 * Firestore Trigger: Auto-Cancel Shiprocket Shipment when Request is Approved
 */
exports.onRefundRequestAccepted = onDocumentUpdated({
    document: 'refundRequests/{requestId}',
    secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"]
}, async (event) => {
    const newValue = event.data.after.data();
    const oldValue = event.data.before.data();
    const { createShiprocketReturnOrder } = require('./shiprocket');

    // Trigger only if status changed to 'approved'
    if (newValue.status === 'approved' && oldValue.status !== 'approved') {
        const orderId = newValue.orderId;
        const requestType = newValue.type; // 'cancel', 'refund', 'replace'

        console.log(`${requestType.toUpperCase()} approved for Request ${event.params.requestId}. Processing logic for Order ${orderId}...`);

        try {
            // Fetch order details
            const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
            if (!orderDoc.exists) {
                console.error(`Order ${orderId} not found.`);
                return;
            }

            const orderData = orderDoc.data();
            const awb = orderData.delivery?.trackingId;
            const shiprocketOrderId = orderData.delivery?.shiprocketOrderId;
            const currentStatus = orderData.delivery?.status || orderData.status;
            const isDelivered = ['delivered', 'returned'].includes(currentStatus);

            // ==========================================
            // LOGIC FOR CANCELLATION (Before Delivery)
            // ==========================================
            if (requestType === 'cancel') {
                let cancelResult = null;
                let cancelMethod = 'none';

                // Strategy 1: Cancel by AWB
                if (awb && !isDelivered) {
                    try {
                        cancelResult = await cancelShiprocketOrder(awb);
                        cancelMethod = 'awb';
                    } catch (awbError) {
                        console.warn(`Failed to cancel via AWB: ${awbError.message}`);
                    }
                }

                // Strategy 2: Cancel by Order ID
                if ((!cancelResult || !cancelResult.success) && !isDelivered) {
                    const srOrderId = shiprocketOrderId || orderData.orderNumber;
                    if (srOrderId) {
                        const idResult = await cancelShiprocketByOrderId(srOrderId);
                        if (idResult && (idResult.status_code === 200 || idResult.message?.includes('cancelled'))) {
                            cancelResult = idResult;
                            cancelMethod = 'order_id';
                        }
                    }
                }

                if (cancelResult && (cancelResult.status_code === 200 || cancelMethod !== 'none')) {
                    await orderDoc.ref.update({
                        'delivery.history': admin.firestore.FieldValue.arrayUnion({
                            status: 'cancelled_via_admin',
                            message: `Shipment cancelled automatically after approval.`,
                            timestamp: new Date().toISOString()
                        })
                    });
                }
            }

            // ==========================================
            // LOGIC FOR RETURN & REPLACEMENT (After Delivery)
            // ==========================================
            if (['refund', 'replace'].includes(requestType)) {
                console.log(`Initiating Reverse Pickup for ${requestType}...`);

                try {
                    // 1. Create Return Order in Shiprocket
                    const returnResponse = await createShiprocketReturnOrder(orderData);

                    if (returnResponse.shipment_id) {
                        console.log(`Return Shipment Created. Shipment ID: ${returnResponse.shipment_id}, AWB: ${returnResponse.awb_code}`);

                        await orderDoc.ref.update({
                            status: 'return_pickup_scheduled',
                            'delivery.returnShipmentId': returnResponse.shipment_id,
                            'delivery.returnAwb': returnResponse.awb_code,
                            'delivery.returnCourier': returnResponse.courier_name || 'Assigned Courier',
                            'delivery.history': admin.firestore.FieldValue.arrayUnion({
                                status: 'return_pickup_scheduled',
                                message: `Return pickup scheduled. AWB: ${returnResponse.awb_code}`,
                                timestamp: new Date().toISOString()
                            })
                        });
                    }
                } catch (returnError) {
                    console.error('Failed to create return shipment:', returnError);
                    await orderDoc.ref.update({
                        'delivery.history': admin.firestore.FieldValue.arrayUnion({
                            status: 'return_creation_failed',
                            message: `Automatic return pickup creation failed: ${returnError.message}. Please arrange manually.`,
                            timestamp: new Date().toISOString()
                        })
                    });
                }

                // 2. logic SPECIFIC TO REPLACEMENT: Create New Order
                if (requestType === 'replace') {
                    console.log('Creating Replacement Order...');
                    const newOrderRef = admin.firestore().collection('orders').doc();

                    // Create replacement item based on selection or fallback to original
                    // Assuming simplistic logic: We take the first item of original and swap size/color
                    // In a real multi-item scenario, we'd need to know exactly WHICH item was replaced. 
                    // Since specific item mapping is complex without a robust schema, we'll assume Single Item or First Item logic for now as per UI.
                    const originalItem = orderData.items[0];
                    const newItem = {
                        ...originalItem,
                        selectedSize: newValue.replacementSize || originalItem.selectedSize,
                        selectedColor: newValue.replacementColor || originalItem.selectedColor,
                        replacingItemId: originalItem.id || 'unknown'
                    };

                    const replacementOrder = {
                        userId: orderData.userId,
                        email: orderData.email,
                        shippingAddress: orderData.shippingAddress,
                        items: [newItem],

                        // Financials - 0 cost
                        subtotal: 0,
                        shipping: 0,
                        total: 0,
                        paymentMethod: 'replacement',
                        isReplacement: true,
                        originalOrderId: orderId,
                        originalOrderNumber: orderData.orderNumber,

                        status: 'confirmed', // Ready for packing
                        createdAt: new Date().toISOString(),
                        orderNumber: `REP-${Math.floor(100000 + Math.random() * 900000)}`, // Simple random number

                        delivery: {
                            status: 'pending',
                            history: [{
                                status: 'created',
                                message: 'Replacement order created automatically.',
                                timestamp: new Date().toISOString()
                            }]
                        }
                    };

                    await newOrderRef.set(replacementOrder);
                    console.log(`Replacement Order Created: ${newOrderRef.id}`);

                    // Link back to original
                    await orderDoc.ref.update({
                        replacementOrderId: newOrderRef.id,
                        replacementOrderNumber: replacementOrder.orderNumber
                    });
                }
            }

        } catch (error) {
            console.error(`Failed to process request action for Order ${orderId}:`, error);
        }
    }
});

/**
 * Firestore Trigger: Auto-Cancel Shiprocket Order when Status changes to 'cancelled'
 */
exports.onOrderCancelled = onDocumentUpdated({
    document: 'orders/{orderId}',
    secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"]
}, async (event) => {
    const newValue = event.data.after.data();
    const oldValue = event.data.before.data();
    const { cancelShiprocketOrder, cancelShiprocketByOrderId } = require('./shiprocket');

    // Trigger only if status changed to 'cancelled'
    if (newValue.status === 'cancelled' && oldValue.status !== 'cancelled') {
        const orderId = event.params.orderId;
        console.log(`Order ${orderId} cancelled in Firestore. Syncing with Shiprocket...`);

        try {
            let cancelResult = null;
            const awb = newValue.delivery?.trackingId;
            const shiprocketOrderId = newValue.delivery?.shiprocketOrderId;

            // Strategy 1: Cancel by AWB
            if (awb) {
                try {
                    cancelResult = await cancelShiprocketOrder(awb);
                    console.log(`Cancelled via AWB: ${awb}`);
                } catch (e) {
                    console.warn(`Failed to cancel via AWB: ${e.message}`);
                }
            }

            // Strategy 2: Cancel by Order ID
            if ((!cancelResult || !cancelResult.success) && shiprocketOrderId) {
                const idResult = await cancelShiprocketByOrderId(shiprocketOrderId);
                if (idResult && (idResult.status_code === 200 || idResult.message?.includes('cancelled'))) {
                    console.log(`Cancelled via Order ID: ${shiprocketOrderId}`);
                    cancelResult = idResult;
                }
            }

            // Strategy 3: Cancel by Custom Order Number (Fallback)
            if ((!cancelResult || !cancelResult.success)) {
                // Often Shiprocket maps Custom Order ID to their system if verified
                // But cancel endpoint expects Shiprocket internal ID. 
                // We can't do much else without the internal ID or AWB.
                console.warn('Could not cancel in Shiprocket: Missing AWB and Shiprocket Order ID');
            }

            if (cancelResult && (cancelResult.status_code === 200)) {
                await event.data.after.ref.update({
                    'delivery.history': admin.firestore.FieldValue.arrayUnion({
                        status: 'cancelled_synced',
                        message: 'Shiprocket order cancelled successfully.',
                        timestamp: new Date().toISOString()
                    })
                });
            }

        } catch (error) {
            console.error(`Error syncing cancellation for ${orderId}:`, error);
        }
    }
});
