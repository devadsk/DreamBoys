import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import {
    getAllRequests,
    updateRequestStatus,
    updateOrderStatus
} from '../../firebase/firebaseService';
import { processRazorpayRefund } from '../../utils/razorpayRefund';
import './AdminRequests.css';

const AdminRequests = () => {
    const toast = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, declined
    const [typeFilter, setTypeFilter] = useState('all'); // all, cancel, refund, replace
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [actionNote, setActionNote] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const result = await getAllRequests();
            if (result.success) {
                // Sort by date, newest first
                const sorted = result.data.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                setRequests(sorted);
            } else {
                toast.error('Failed to load requests');
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
        setLoading(false);
    };

    const getRequestTypeInfo = (type) => {
        const typeMap = {
            cancel: { label: 'Cancellation', icon: '❌', color: '#ef4444' },
            refund: { label: 'Refund', icon: '💰', color: '#f59e0b' },
            replace: { label: 'Replacement', icon: '🔄', color: '#3b82f6' }
        };
        return typeMap[type] || typeMap.cancel;
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Pending Review', color: '#f59e0b', icon: '⏳' },
            approved: { label: 'Approved', color: '#10b981', icon: '✅' },
            declined: { label: 'Declined', color: '#ef4444', icon: '❌' },
            completed: { label: 'Completed', color: '#6b7280', icon: '✓' }
        };
        return statusMap[status] || statusMap.pending;
    };

    const handleApprove = async (request) => {
        setProcessing(true);
        try {
            let refundResult = null;
            let newOrderStatus = '';
            let updateData = {
                status: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: 'admin', // In production, use actual admin ID
                adminNote: actionNote
            };

            // Handle different request types
            if (request.type === 'cancel') {
                // Cancellation request
                newOrderStatus = 'cancelled';

                // Process refund if online payment
                if (request.paymentMethod === 'online' && request.paymentId) {
                    toast.info('Processing refund...');
                    refundResult = await processRazorpayRefund(
                        request.paymentId,
                        request.refundAmount,
                        `Cancellation approved: ${actionNote || 'Admin approved'}`
                    );

                    if (refundResult.success) {
                        updateData.refundId = refundResult.refundId;
                        updateData.refundStatus = 'processed';
                        toast.success(`Refund processed! ID: ${refundResult.refundId}`);
                    } else {
                        updateData.refundStatus = 'manual_processing';
                        toast.warning('Refund will be processed manually');
                    }
                } else {
                    updateData.refundStatus = 'manual_processing';
                }

                // Prepare customer notification message
                let customerMessage = '';
                if (updateData.refundStatus === 'processed') {
                    customerMessage = `Cancellation approved! Refund of ₹${request.refundAmount.toFixed(2)} initiated to your account.`;
                } else {
                    customerMessage = `Cancellation approved! Our team will contact you shortly regarding your refund of ₹${request.refundAmount.toFixed(2)}.`;
                }

                // Update order status
                await updateOrderStatus(request.orderId, newOrderStatus, {
                    cancelledAt: new Date().toISOString(),
                    cancellationApprovedAt: new Date().toISOString(),
                    refundAmount: request.refundAmount,
                    refundStatus: updateData.refundStatus,
                    refundId: updateData.refundId || null,
                    refundedAt: updateData.refundStatus === 'processed' ? new Date().toISOString() : null,
                    customerNotification: customerMessage,
                    customerNotificationRead: false
                });

            } else if (request.type === 'refund') {
                // Refund request - requires product return first
                newOrderStatus = 'refund_approved';
                updateData.awaitingReturn = true;
                updateData.returnDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                const returnDeadlineDate = new Date(updateData.returnDeadline).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short'
                });

                await updateOrderStatus(request.orderId, newOrderStatus, {
                    refundApprovedAt: new Date().toISOString(),
                    awaitingReturn: true,
                    returnDeadline: updateData.returnDeadline,
                    customerNotification: `Refund request approved! Please return the product by ${returnDeadlineDate}. Refund processed after verification.`,
                    customerNotificationRead: false
                });

                toast.info('Refund approved. Awaiting product return.');

            } else if (request.type === 'replace') {
                // Replacement request - no refund, just replacement
                newOrderStatus = 'replacement_approved';
                updateData.awaitingReturn = true;
                updateData.returnDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                const returnDeadlineDate = new Date(updateData.returnDeadline).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short'
                });

                await updateOrderStatus(request.orderId, newOrderStatus, {
                    replacementApprovedAt: new Date().toISOString(),
                    awaitingReturn: true,
                    returnDeadline: updateData.returnDeadline,
                    customerNotification: `Replacement request approved! Please return the product by ${returnDeadlineDate}. Replacement shipped after verification.`,
                    customerNotificationRead: false
                });

                toast.info('Replacement approved. Awaiting product return.');
            }

            // Update request status
            const result = await updateRequestStatus(request.id, updateData);

            if (result.success) {
                toast.success(`${getRequestTypeInfo(request.type).label} request approved!`);
                setShowDetailModal(false);
                setSelectedRequest(null);
                setActionNote('');
                loadRequests();
            } else {
                toast.error('Failed to update request');
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
        setProcessing(false);
    };

    const handleDecline = async (request) => {
        if (!actionNote.trim()) {
            toast.warning('Please provide a reason for declining');
            return;
        }

        setProcessing(true);
        try {
            const updateData = {
                status: 'declined',
                declinedAt: new Date().toISOString(),
                declinedBy: 'admin',
                adminNote: actionNote
            };

            // Update request status
            const result = await updateRequestStatus(request.id, updateData);

            if (result.success) {
                // Update order status back to original or appropriate status
                let orderStatus = 'processing'; // Default fallback
                if (request.type === 'cancel') {
                    orderStatus = request.originalOrderStatus || 'processing';
                } else {
                    orderStatus = 'delivered'; // For refund/replace, order was delivered
                }

                await updateOrderStatus(request.orderId, orderStatus, {
                    [`${request.type}RequestDeclined`]: true,
                    [`${request.type}DeclinedAt`]: new Date().toISOString(),
                    declineReason: actionNote
                });

                toast.success(`${getRequestTypeInfo(request.type).label} request declined`);
                setShowDetailModal(false);
                setSelectedRequest(null);
                setActionNote('');
                loadRequests();
            } else {
                toast.error('Failed to update request');
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
        setProcessing(false);
    };

    const handleMarkReturned = async (request) => {
        setProcessing(true);
        try {
            let refundResult = null;
            let updateData = {
                status: 'completed',
                productReturnedAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
            };

            if (request.type === 'refund') {
                // Process refund now that product is returned
                if (request.paymentMethod === 'online' && request.paymentId) {
                    toast.info('Processing refund...');
                    refundResult = await processRazorpayRefund(
                        request.paymentId,
                        request.refundAmount,
                        'Product returned - refund processed'
                    );

                    if (refundResult.success) {
                        updateData.refundId = refundResult.refundId;
                        updateData.refundStatus = 'processed';
                        toast.success(`Refund processed! ID: ${refundResult.refundId}`);
                    } else {
                        updateData.refundStatus = 'manual_processing';
                        toast.warning('Refund will be processed manually');
                    }
                } else {
                    updateData.refundStatus = 'manual_processing';
                }

                await updateOrderStatus(request.orderId, 'refunded', {
                    refundedAt: new Date().toISOString(),
                    refundAmount: request.refundAmount,
                    refundStatus: updateData.refundStatus,
                    refundId: updateData.refundId || null
                });

            } else if (request.type === 'replace') {
                // Mark as ready for replacement shipment
                await updateOrderStatus(request.orderId, 'replacement_processing', {
                    replacementProcessingAt: new Date().toISOString(),
                    readyForReplacement: true
                });

                toast.success('Product returned. Ready to ship replacement.');
            }

            const result = await updateRequestStatus(request.id, updateData);

            if (result.success) {
                toast.success('Request completed!');
                setShowDetailModal(false);
                setSelectedRequest(null);
                loadRequests();
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
        setProcessing(false);
    };

    const filteredRequests = requests.filter(req => {
        if (filter !== 'all' && req.status !== filter) return false;
        if (typeFilter !== 'all' && req.type !== typeFilter) return false;
        return true;
    });

    return (
        <div className="admin-requests-page">
            <div className="admin-requests-header">
                <div>
                    <h1>Customer Requests</h1>
                    <p>Manage cancellation, refund, and replacement requests</p>
                </div>
                <div className="request-stats">
                    <div className="stat-card pending">
                        <span className="stat-number">{requests.filter(r => r.status === 'pending').length}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat-card approved">
                        <span className="stat-number">{requests.filter(r => r.status === 'approved').length}</span>
                        <span className="stat-label">Approved</span>
                    </div>
                    <div className="stat-card declined">
                        <span className="stat-number">{requests.filter(r => r.status === 'declined').length}</span>
                        <span className="stat-label">Declined</span>
                    </div>
                </div>
            </div>

            <div className="filters-section">
                <div className="filter-group">
                    <label>Status:</label>
                    <div className="filter-buttons">
                        {['all', 'pending', 'approved', 'declined', 'completed'].map(status => (
                            <button
                                key={status}
                                className={`filter-btn ${filter === status ? 'active' : ''}`}
                                onClick={() => setFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="filter-group">
                    <label>Type:</label>
                    <div className="filter-buttons">
                        {['all', 'cancel', 'refund', 'replace'].map(type => (
                            <button
                                key={type}
                                className={`filter-btn ${typeFilter === type ? 'active' : ''}`}
                                onClick={() => setTypeFilter(type)}
                            >
                                {type === 'all' ? 'All' : getRequestTypeInfo(type).label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading requests...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No requests found</h3>
                    <p>There are no {filter !== 'all' ? filter : ''} {typeFilter !== 'all' ? getRequestTypeInfo(typeFilter).label.toLowerCase() : ''} requests</p>
                </div>
            ) : (
                <div className="requests-grid">
                    {filteredRequests.map(request => {
                        const typeInfo = getRequestTypeInfo(request.type);
                        const statusInfo = getStatusInfo(request.status);

                        return (
                            <motion.div
                                key={request.id}
                                className="request-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -4 }}
                                onClick={() => {
                                    setSelectedRequest(request);
                                    setShowDetailModal(true);
                                }}
                            >
                                <div className="request-card-header">
                                    <div className="request-type" style={{ background: typeInfo.color }}>
                                        <span className="type-icon">{typeInfo.icon}</span>
                                        <span>{typeInfo.label}</span>
                                    </div>
                                    <span className="request-status" style={{ background: statusInfo.color }}>
                                        {statusInfo.icon} {statusInfo.label}
                                    </span>
                                </div>

                                <div className="request-info">
                                    <div className="info-row">
                                        <span className="label">Order ID:</span>
                                        <span className="value">#{request.orderNumber || request.orderId.slice(0, 8)}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Customer:</span>
                                        <span className="value">{request.customerName}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Amount:</span>
                                        <span className="value amount">₹{request.amount?.toFixed(2) || request.refundAmount?.toFixed(2)}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Date:</span>
                                        <span className="value">{new Date(request.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="request-reason">
                                    <strong>Reason:</strong>
                                    <p>{request.reason}</p>
                                </div>

                                {request.status === 'pending' && (
                                    <div className="pending-badge">
                                        ⚠️ Awaiting Review
                                    </div>
                                )}

                                {request.awaitingReturn && (
                                    <div className="awaiting-badge">
                                        📦 Awaiting Product Return
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {showDetailModal && selectedRequest && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDetailModal(false)}
                    >
                        <motion.div
                            className="request-detail-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>{getRequestTypeInfo(selectedRequest.type).label} Request</h2>
                                <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
                            </div>

                            <div className="modal-body">
                                <div className="detail-section">
                                    <h3>Request Details</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Request ID:</span>
                                            <span className="detail-value">{selectedRequest.id.slice(0, 12)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Order Number:</span>
                                            <span className="detail-value">#{selectedRequest.orderNumber || selectedRequest.orderId.slice(0, 8)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Customer:</span>
                                            <span className="detail-value">{selectedRequest.customerName}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Email:</span>
                                            <span className="detail-value">{selectedRequest.customerEmail}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Request Date:</span>
                                            <span className="detail-value">{new Date(selectedRequest.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Payment Method:</span>
                                            <span className="detail-value">{selectedRequest.paymentMethod?.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Financial Details</h3>
                                    <div className="financial-breakdown">
                                        <div className="financial-row">
                                            <span>Order Total:</span>
                                            <span>₹{selectedRequest.orderTotal?.toFixed(2)}</span>
                                        </div>
                                        {selectedRequest.type === 'cancel' && (
                                            <>
                                                <div className="financial-row charge">
                                                    <span>Cancellation Charge ({selectedRequest.chargePercentage?.toFixed(1)}%):</span>
                                                    <span>- ₹{selectedRequest.chargeAmount?.toFixed(2)}</span>
                                                </div>
                                                <div className="financial-row total">
                                                    <span>Refund Amount:</span>
                                                    <span>₹{selectedRequest.refundAmount?.toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}
                                        {selectedRequest.type === 'refund' && (
                                            <div className="financial-row total">
                                                <span>Refund Amount:</span>
                                                <span>₹{selectedRequest.refundAmount?.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {selectedRequest.type === 'replace' && (
                                            <div className="financial-row info">
                                                <span>Replacement:</span>
                                                <span>No Charge</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Customer Reason</h3>
                                    <div className="reason-box">
                                        {selectedRequest.reason}
                                    </div>
                                </div>

                                {selectedRequest.status !== 'pending' && (
                                    <div className="detail-section">
                                        <h3>Admin Action</h3>
                                        <div className="action-info">
                                            <p><strong>Status:</strong> {getStatusInfo(selectedRequest.status).label}</p>
                                            {selectedRequest.adminNote && (
                                                <p><strong>Note:</strong> {selectedRequest.adminNote}</p>
                                            )}
                                            {selectedRequest.approvedAt && (
                                                <p><strong>Approved:</strong> {new Date(selectedRequest.approvedAt).toLocaleString()}</p>
                                            )}
                                            {selectedRequest.declinedAt && (
                                                <p><strong>Declined:</strong> {new Date(selectedRequest.declinedAt).toLocaleString()}</p>
                                            )}

                                            {/* Refund Status Display */}
                                            {selectedRequest.refundId && (
                                                <>
                                                    <p><strong>Refund ID:</strong> <code style={{
                                                        background: '#f3f4f6',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.9rem'
                                                    }}>{selectedRequest.refundId}</code></p>
                                                    <p><strong>Refund Status:</strong>
                                                        <span style={{
                                                            marginLeft: '8px',
                                                            padding: '4px 12px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '600',
                                                            background: selectedRequest.refundStatus === 'processed' ? '#d1fae5' :
                                                                selectedRequest.refundStatus === 'pending' ? '#fef3c7' : '#dbeafe',
                                                            color: selectedRequest.refundStatus === 'processed' ? '#065f46' :
                                                                selectedRequest.refundStatus === 'pending' ? '#92400e' : '#1e40af'
                                                        }}>
                                                            {selectedRequest.refundStatus === 'processed' && '✅ Processed'}
                                                            {selectedRequest.refundStatus === 'pending' && '⏳ Pending'}
                                                            {selectedRequest.refundStatus === 'manual_processing' && '👤 Manual'}
                                                            {selectedRequest.refundStatus === 'failed' && '❌ Failed'}
                                                        </span>
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedRequest.status === 'pending' && (
                                    <div className="detail-section">
                                        <h3>Admin Note (Optional)</h3>
                                        <textarea
                                            value={actionNote}
                                            onChange={(e) => setActionNote(e.target.value)}
                                            placeholder="Add a note about this decision..."
                                            rows="3"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                {selectedRequest.status === 'pending' && (
                                    <>
                                        <button
                                            className="btn btn-decline"
                                            onClick={() => handleDecline(selectedRequest)}
                                            disabled={processing}
                                        >
                                            {processing ? 'Processing...' : 'Decline Request'}
                                        </button>
                                        <button
                                            className="btn btn-approve"
                                            onClick={() => handleApprove(selectedRequest)}
                                            disabled={processing}
                                        >
                                            {processing ? 'Processing...' : 'Approve Request'}
                                        </button>
                                    </>
                                )}

                                {selectedRequest.status === 'approved' && selectedRequest.awaitingReturn && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleMarkReturned(selectedRequest)}
                                        disabled={processing}
                                    >
                                        {processing ? 'Processing...' : 'Mark Product as Returned'}
                                    </button>
                                )}

                                {selectedRequest.status !== 'pending' && !selectedRequest.awaitingReturn && (
                                    <button className="btn btn-outline" onClick={() => setShowDetailModal(false)}>
                                        Close
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminRequests;
