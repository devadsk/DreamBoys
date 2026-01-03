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
        console.log(`Calling createShiprocketOrder with:`, {
            orderId,
            pickupLocation,
            hasDeliverySnapshot: !!orderData.delivery?.snapshot,
            hasShippingAddress: !!orderData.shippingAddress,
            itemCount: orderData.items?.length || 0
        });

        let srResponse;
        try {
            srResponse = await createShiprocketOrder(orderData, orderId, pickupLocation);
            console.log(`Shiprocket API response:`, {
                shipment_id: srResponse.shipment_id,
                order_id: srResponse.order_id,
                awb_code: srResponse.awb_code,
                courier_name: srResponse.courier_name
            });
        } catch (srError) {
            console.error(`Shiprocket API Error:`, {
                message: srError.message,
                stack: srError.stack,
                response: srError.response?.data || 'No response data'
            });
            throw new HttpsError('internal', `Shiprocket API Error: ${srError.message}`);
        }

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

        console.log(`Updating order ${orderId} with delivery data`);
        await orderDoc.ref.update({
            status: 'shipped',
            delivery: deliveryUpdate,
            updatedAt: new Date().toISOString()
        });

        console.log(`Shipment successfully created for order ${orderId}`);
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
// const { onDocumentCreated } = require('firebase-functions/v2/firestore');

/**
 * DISABLED: Auto-shipment triggers
 * Orders are now only sent to Shiprocket when admin manually clicks "Initiate Shipment"
 * This ensures proper pickup location selection and manual control over shipment creation
 */

/**
 * Helper to consolidate auto-shipment logic (CURRENTLY UNUSED - kept for future reference)
 */
// async function autoInitiateShipment(orderData, orderId, ref) {
//     if (orderData.status !== 'confirmed') return;
//     if (orderData.delivery?.shipmentId) return;

//     try {
//         console.log(`Auto-initiating shipment for order: ${orderId}`);
//         const srResponse = await createShiprocketOrder(orderData, orderId);

//         const deliveryUpdate = {
//             ...orderData.delivery,
//             status: 'shipped',
//             shipmentId: srResponse.shipment_id || null,
//             courier: srResponse.courier_name || null,
//             trackingId: srResponse.tracking_id || srResponse.awb_code || null,
//             trackingUrl: srResponse.tracking_url || `https://shiprocket.co/tracking/${srResponse.tracking_id || srResponse.awb_code}`,
//             history: [
//                 ...(orderData.delivery?.history || []),
//                 {
//                     status: 'shipped',
//                     message: 'Shipment created automatically.',
//                     timestamp: new Date().toISOString()
//                 }
//             ]
//         };

//         await ref.update({
//             status: 'shipped',
//             delivery: deliveryUpdate,
//             updatedAt: new Date().toISOString()
//         });

//     } catch (error) {
//         console.error(`Auto-Shipment Error for ${orderId}: ${error.message}`);
//         await ref.update({
//             'delivery.status': 'failed',
//             'delivery.history': admin.firestore.FieldValue.arrayUnion({
//                 status: 'failed',
//                 message: `Auto-shipment failed: ${error.message}`,
//                 timestamp: new Date().toISOString()
//             })
//         });
//     }
// }

/**
 * DISABLED: Firestore Trigger - Automatically initiate shipment when order is created
 * Reason: Admin should manually select pickup location before creating Shiprocket order
 */
// exports.onOrderCreated = onDocumentCreated({
//     document: 'orders/{orderId}',
//     secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"]
// }, async (event) => {
//     const data = event.data.data();
//     if (data.status === 'confirmed') {
//         await autoInitiateShipment(data, event.params.orderId, event.data.ref);
//     }
// });

/**
 * DISABLED: Firestore Trigger - Automatically initiate shipment when order is confirmed
 * Reason: Admin should manually select pickup location before creating Shiprocket order
 */
// exports.onOrderConfirmed = onDocumentUpdated({
//     document: 'orders/{orderId}',
//     secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"]
// }, async (event) => {
//     const newValue = event.data.after.data();
//     const oldValue = event.data.before.data();

//     // Trigger only if status changed to 'confirmed'
//     if (newValue.status === 'confirmed' && oldValue.status !== 'confirmed') {
//         await autoInitiateShipment(newValue, event.params.orderId, event.data.after.ref);
//     }
// });

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
                // Check if shipment exists in Shiprocket before attempting cancellation
                if (!orderData.delivery?.shipmentId) {
                    console.log(`Order ${orderId} has no shipment - skipping Shiprocket cancellation (order never sent to Shiprocket)`);
                    // Order was cancelled before shipment was initiated - no Shiprocket action needed
                    await orderDoc.ref.update({
                        'delivery.history': admin.firestore.FieldValue.arrayUnion({
                            status: 'cancelled_before_shipment',
                            message: 'Order cancelled before shipment was created.',
                            timestamp: new Date().toISOString()
                        })
                    });
                } else {
                    // Shipment exists - attempt cancellation in Shiprocket
                    console.log(`Attempting Shiprocket cancellation for Order ${orderId}:`, {
                        awb: awb || 'NOT_SET',
                        shiprocketOrderId: shiprocketOrderId || 'NOT_SET',
                        orderNumber: orderData.orderNumber,
                        hasShipment: !!orderData.delivery?.shipmentId
                    });

                    let cancelResult = null;
                    let cancelMethod = 'none';

                    // Strategy 1: Cancel by AWB
                    if (awb && !isDelivered) {
                        try {
                            console.log(`Attempting cancellation via AWB: ${awb}`);
                            cancelResult = await cancelShiprocketOrder(awb);
                            cancelMethod = 'awb';
                            console.log(`Cancellation via AWB successful`);
                        } catch (awbError) {
                            console.warn(`Failed to cancel via AWB: ${awbError.message}`);
                        }
                    }

                    // Strategy 2: Cancel by Shiprocket Order ID
                    if ((!cancelResult || !cancelResult.success) && !isDelivered && shiprocketOrderId) {
                        try {
                            console.log(`Attempting cancellation via Shiprocket Order ID: ${shiprocketOrderId}`);
                            const idResult = await cancelShiprocketByOrderId(shiprocketOrderId);
                            if (idResult && (idResult.status_code === 200 || idResult.message?.includes('cancelled'))) {
                                cancelResult = idResult;
                                cancelMethod = 'order_id';
                                console.log(`Cancellation via Order ID successful`);
                            }
                        } catch (idError) {
                            console.error(`Failed to cancel via Order ID: ${idError.message}`);
                        }
                    }

                    if (cancelResult && (cancelResult.status_code === 200 || cancelMethod !== 'none')) {
                        await orderDoc.ref.update({
                            'delivery.history': admin.firestore.FieldValue.arrayUnion({
                                status: 'cancelled_via_admin',
                                message: `Shipment cancelled in Shiprocket via ${cancelMethod}.`,
                                timestamp: new Date().toISOString()
                            })
                        });
                        console.log(`Order ${orderId} successfully cancelled in Shiprocket`);
                    } else {
                        console.warn(`Could not cancel Order ${orderId} in Shiprocket - manual intervention may be required`);
                        await orderDoc.ref.update({
                            'delivery.history': admin.firestore.FieldValue.arrayUnion({
                                status: 'cancellation_failed',
                                message: 'Automatic Shiprocket cancellation failed. Please cancel manually in Shiprocket dashboard.',
                                timestamp: new Date().toISOString()
                            })
                        });
                    }
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

        // Check if shipment exists in Shiprocket before attempting cancellation
        if (!newValue.delivery?.shipmentId) {
            console.log(`Order ${orderId} cancelled but has no shipment - skipping Shiprocket cancellation (order never sent to Shiprocket)`);
            await event.data.after.ref.update({
                'delivery.history': admin.firestore.FieldValue.arrayUnion({
                    status: 'cancelled_before_shipment',
                    message: 'Order cancelled before shipment was created.',
                    timestamp: new Date().toISOString()
                })
            });
            return; // Exit early - no Shiprocket action needed
        }

        console.log(`Order ${orderId} cancelled in Firestore. Syncing with Shiprocket...`);

        try {
            let cancelResult = null;
            const awb = newValue.delivery?.trackingId;
            const shiprocketOrderId = newValue.delivery?.shiprocketOrderId;

            console.log(`Attempting Shiprocket cancellation for Order ${orderId}:`, {
                awb: awb || 'NOT_SET',
                shiprocketOrderId: shiprocketOrderId || 'NOT_SET',
                orderNumber: newValue.orderNumber
            });

            // Strategy 1: Cancel by AWB
            if (awb) {
                try {
                    console.log(`Attempting cancellation via AWB: ${awb}`);
                    cancelResult = await cancelShiprocketOrder(awb);
                    console.log(`Cancelled via AWB: ${awb}`);
                } catch (e) {
                    console.warn(`Failed to cancel via AWB: ${e.message}`);
                }
            }

            // Strategy 2: Cancel by Shiprocket Order ID
            if ((!cancelResult || !cancelResult.success) && shiprocketOrderId) {
                try {
                    console.log(`Attempting cancellation via Shiprocket Order ID: ${shiprocketOrderId}`);
                    const idResult = await cancelShiprocketByOrderId(shiprocketOrderId);
                    if (idResult && (idResult.status_code === 200 || idResult.message?.includes('cancelled'))) {
                        console.log(`Cancelled via Order ID: ${shiprocketOrderId}`);
                        cancelResult = idResult;
                    }
                } catch (idError) {
                    console.error(`Failed to cancel via Order ID: ${idError.message}`);
                }
            }

            // Log warning if both strategies failed
            if (!cancelResult || !cancelResult.success) {
                console.warn(`Could not cancel Order ${orderId} in Shiprocket: Missing or invalid AWB and Shiprocket Order ID`);
                await event.data.after.ref.update({
                    'delivery.history': admin.firestore.FieldValue.arrayUnion({
                        status: 'cancellation_failed',
                        message: 'Automatic Shiprocket cancellation failed. Please cancel manually in Shiprocket dashboard.',
                        timestamp: new Date().toISOString()
                    })
                });
            }

            if (cancelResult && (cancelResult.status_code === 200)) {
                await event.data.after.ref.update({
                    'delivery.history': admin.firestore.FieldValue.arrayUnion({
                        status: 'cancelled_synced',
                        message: 'Shiprocket order cancelled successfully.',
                        timestamp: new Date().toISOString()
                    })
                });
                console.log(`Order ${orderId} successfully cancelled in Shiprocket`);
            }

        } catch (error) {
            console.error(`Error syncing cancellation for ${orderId}:`, error);
        }
    }
});
