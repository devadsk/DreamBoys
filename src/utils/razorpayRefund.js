// Razorpay Refund Functions
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * Process refund through Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in rupees
 * @param {string} reason - Reason for refund
 * @returns {Promise<{success: boolean, refundId?: string, error?: string}>}
 */
export const processRazorpayRefund = async (paymentId, amount, reason = 'Customer cancellation') => {
    try {
        // Call Firebase Cloud Function to process refund
        const processRefund = httpsCallable(functions, 'processRefund');

        const result = await processRefund({
            paymentId,
            amount: Math.round(amount * 100), // Convert to paise
            notes: {
                reason: reason,
                refund_type: 'cancellation'
            }
        });

        if (result.data.success) {
            return {
                success: true,
                refundId: result.data.refundId,
                status: result.data.status
            };
        } else {
            return {
                success: false,
                error: result.data.error || 'Refund processing failed'
            };
        }
    } catch (error) {
        console.error('Razorpay refund error:', error);
        return {
            success: false,
            error: error.message || 'Failed to process refund'
        };
    }
};

/**
 * Check refund status
 * @param {string} refundId - Razorpay refund ID
 * @returns {Promise<{success: boolean, status?: string, error?: string}>}
 */
export const checkRefundStatus = async (refundId) => {
    try {
        const getRefundStatus = httpsCallable(functions, 'getRefundStatus');

        const result = await getRefundStatus({ refundId });

        if (result.data.success) {
            return {
                success: true,
                status: result.data.status,
                amount: result.data.amount,
                createdAt: result.data.createdAt
            };
        } else {
            return {
                success: false,
                error: result.data.error || 'Failed to fetch refund status'
            };
        }
    } catch (error) {
        console.error('Refund status check error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Process instant refund for COD orders
 * For COD orders, we can mark as refunded immediately since no payment was processed
 * @param {string} orderId - Order ID
 * @param {number} amount - Amount to refund
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const processCODRefund = async (orderId, amount) => {
    try {
        // For COD, we just need to update the order status
        // Actual refund would be processed manually by admin
        return {
            success: true,
            message: `COD refund of ₹${amount.toFixed(2)} will be processed manually within 5-7 business days`,
            refundMethod: 'manual'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};
