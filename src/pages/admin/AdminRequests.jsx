import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCcw,
    Inbox,
    Clock,
    DollarSign,
    Package,
    ArrowRight,
    Search,
    Filter,
    X,
    MessageSquare
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
    getAllRequests,
    updateRequestStatus,
    updateOrderStatus
} from '../../firebase/firebaseService';
import { processRazorpayRefund } from '../../utils/razorpayRefund';
import '../admin/AdminDashboard.css'; // Shared styles
import './AdminRequests.css';

const AdminRequests = () => {
    const toast = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, declined
    const [activeTab, setActiveTab] = useState('all'); // all, cancel, refund, replace request types
    const [selectedRequest, setSelectedRequest] = useState(null);
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
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
        setLoading(false);
    };

    const getRequestTypeInfo = (type) => {
        // Updated colors to match enterprise palette
        const typeMap = {
            cancel: { label: 'Cancellation', icon: <XCircle size={16} />, className: 'type-cancel' },
            refund: { label: 'Refund', icon: <DollarSign size={16} />, className: 'type-refund' },
            replace: { label: 'Replacement', icon: <RefreshCcw size={16} />, className: 'type-replace' }
        };
        return typeMap[type] || typeMap.cancel;
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Pending Review', icon: <Clock size={14} />, className: 'status-pending' },
            approved: { label: 'Approved', icon: <CheckCircle size={14} />, className: 'status-success' },
            declined: { label: 'Declined', icon: <XCircle size={14} />, className: 'status-danger' },
            completed: { label: 'Completed', icon: <CheckCircle size={14} />, className: 'status-neutral' }
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
                approvedBy: 'admin',
                adminNote: actionNote
            };

            // Process logic based on type (Keep existing logic, just cleaner)
            if (request.type === 'cancel') {
                newOrderStatus = 'cancelled';
                if (request.paymentMethod !== 'cod' && request.paymentId) {
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

                let customerMessage = updateData.refundStatus === 'processed'
                    ? `Cancellation approved! Refund of ₹${request.refundAmount.toFixed(2)} initiated.`
                    : `Cancellation approved! Contacting regarding refund of ₹${request.refundAmount.toFixed(2)}.`;

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

            } else if (request.type === 'refund' || request.type === 'replace') {
                newOrderStatus = request.type === 'refund' ? 'refund_approved' : 'replacement_approved';
                updateData.awaitingReturn = true;
                updateData.returnDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                const deadlineDate = new Date(updateData.returnDeadline).toLocaleDateString();
                const note = request.type === 'refund'
                    ? `Refund approved! Return by ${deadlineDate}.`
                    : `Replacement approved! Return by ${deadlineDate}.`;

                await updateOrderStatus(request.orderId, newOrderStatus, {
                    [request.type === 'refund' ? 'refundApprovedAt' : 'replacementApprovedAt']: new Date().toISOString(),
                    awaitingReturn: true,
                    returnDeadline: updateData.returnDeadline,
                    customerNotification: note,
                    customerNotificationRead: false
                });

                toast.info(`${request.type === 'refund' ? 'Refund' : 'Replacement'} approved. Awaiting return.`);
            }

            const result = await updateRequestStatus(request.id, updateData);

            if (result.success) {
                toast.success('Request approved!');
                setSelectedRequest(null);
                setActionNote('');
                loadRequests();
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

            const result = await updateRequestStatus(request.id, updateData);

            if (result.success) {
                let orderStatus = request.type === 'cancel' ? (request.originalOrderStatus || 'processing') : 'delivered';

                await updateOrderStatus(request.orderId, orderStatus, {
                    [`${request.type}RequestDeclined`]: true,
                    [`${request.type}DeclinedAt`]: new Date().toISOString(),
                    declineReason: actionNote
                });

                toast.success('Request declined');
                setSelectedRequest(null);
                setActionNote('');
                loadRequests();
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
        setProcessing(false);
    };

    const handleMarkReturned = async (request) => {
        setProcessing(true);
        try {
            // (Same logic as before, just kept minimal here for brevity while refactoring UI)
            // ... Logic to mark returned and process refund if needed ...
            // Integrating the logic from previous file:
            let refundResult = null;
            let updateData = {
                status: 'completed',
                productReturnedAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
            };

            if (request.type === 'refund') {
                if (request.paymentMethod !== 'cod' && request.paymentId) {
                    refundResult = await processRazorpayRefund(request.paymentId, request.refundAmount, 'Product returned');
                    if (refundResult.success) {
                        updateData.refundId = refundResult.refundId;
                        updateData.refundStatus = 'processed';
                    } else {
                        updateData.refundStatus = 'manual_processing';
                    }
                } else {
                    updateData.refundStatus = 'manual_processing';
                }

                await updateOrderStatus(request.orderId, 'refunded', {
                    refundedAt: new Date().toISOString(),
                    refundAmount: request.refundAmount,
                    refundStatus: updateData.refundStatus,
                    refundId: updateData.refundId || null,
                    awaitingReturn: false,
                    customerNotification: `Refund successful!`,
                    customerNotificationRead: false
                });
            } else if (request.type === 'replace') {
                await updateOrderStatus(request.orderId, 'replacement_processing', {
                    replacementProcessingAt: new Date().toISOString(),
                    readyForReplacement: true,
                    awaitingReturn: false,
                    customerNotification: 'Product returned. Replacement processing.',
                    customerNotificationRead: false
                });
            }

            const result = await updateRequestStatus(request.id, updateData);
            if (result.success) {
                toast.success('Request completed!');
                loadRequests();
                setSelectedRequest(null);
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
        setProcessing(false);
    };

    const filteredRequests = requests.filter(req => {
        if (filter !== 'all' && req.status !== filter) return false;
        if (activeTab !== 'all' && req.type !== activeTab) return false;
        return true;
    });

    return (
        <div className="admin-page-content">
            <div className="page-header">
                <div>
                    <h1>Customer Requests</h1>
                    <p className="subtitle">Manage cancellations, refunds, and replacements</p>
                </div>
            </div>

            {/* Statistics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper icon-yellow">
                        <Inbox size={24} />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Pending</p>
                        <h3 className="stat-value">{requests.filter(r => r.status === 'pending').length}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper icon-green">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Approved</p>
                        <h3 className="stat-value">{requests.filter(r => r.status === 'approved').length}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper icon-blue">
                        <RefreshCcw size={24} />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Active Returns</p>
                        <h3 className="stat-value">{requests.filter(r => r.awaitingReturn).length}</h3>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="table-filters-bar flex-wrap gap-y-4">
                <div className="filter-group-row">
                    <span className="text-secondary text-sm font-medium mr-2">Status:</span>
                    <div className="filter-tabs-container">
                        {['all', 'pending', 'approved', 'declined', 'completed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`filter-tab-pill ${filter === status ? 'active' : ''}`}
                            >
                                {filter === status && (
                                    <motion.div
                                        layoutId="activeTabRequestStatus"
                                        className="active-pill-bg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="capitalize">{status}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="filter-group-row ml-auto">
                    <span className="text-secondary text-sm font-medium mr-2">Type:</span>
                    {/* NEW PILL TABS */}
                    <div className="mb-6">
                        <div className="filter-tabs-container">
                            {['all', 'cancel', 'refund', 'replace'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`filter-tab-pill ${activeTab === tab ? 'active' : ''}`}
                                >
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTabRequest"
                                            className="active-pill-bg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="capitalize">{tab === 'all' ? 'All Requests' : tab}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Requests Grid */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading requests...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="empty-state">
                    <Inbox size={48} className="text-muted mb-2" />
                    <p>No requests found.</p>
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
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedRequest(request)}
                            >
                                <div className="request-card-header">
                                    <div className={`request-type-badge ${typeInfo.className}`}>
                                        {typeInfo.icon} {typeInfo.label}
                                    </div>
                                    <div className={`status-pill ${statusInfo.className}`}>
                                        {statusInfo.icon} {statusInfo.label}
                                    </div>
                                </div>

                                <div className="request-card-body">
                                    <div className="request-info-row">
                                        <span className="label">Order</span>
                                        <span className="value font-mono">#{request.orderNumber || request.orderId.slice(0, 8)}</span>
                                    </div>
                                    <div className="request-info-row">
                                        <span className="label">Customer</span>
                                        <span className="value truncate" title={request.customerName}>{request.customerName}</span>
                                    </div>
                                    <div className="request-info-row">
                                        <span className="label">Amount</span>
                                        <span className="value font-medium">₹{request.amount?.toFixed(2) || request.refundAmount?.toFixed(2)}</span>
                                    </div>
                                    <div className="request-reason-preview">
                                        <span className="label mb-1 block">Reason:</span>
                                        <p className="reason-text">{request.reason}</p>
                                    </div>

                                    {request.status === 'pending' && (
                                        <div className="alert-badge warning mt-2">
                                            <AlertCircle size={14} /> Action Required
                                        </div>
                                    )}
                                    {request.awaitingReturn && (
                                        <div className="alert-badge info mt-2">
                                            <Package size={14} /> Awaiting Return
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="modal-backdrop" onClick={() => setSelectedRequest(null)}>
                        <motion.div
                            className="modal-content"
                            style={{ maxWidth: '700px' }}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <div className="flex items-center gap-3">
                                    <h2>Request Details</h2>
                                    <span className={`status-pill ${getStatusInfo(selectedRequest.status).className}`}>
                                        {selectedRequest.status}
                                    </span>
                                </div>
                                <button className="btn-icon-small" onClick={() => setSelectedRequest(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[70vh]">
                                <div className="details-grid">
                                    <div className="detail-card">
                                        <h3><FileText size={16} /> Request Info</h3>
                                        <div className="info-list">
                                            <div className="info-item">
                                                <span className="label">Type</span>
                                                <span className="value flex items-center gap-2">
                                                    {getRequestTypeInfo(selectedRequest.type).icon}
                                                    {getRequestTypeInfo(selectedRequest.type).label}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Order #</span>
                                                <span className="value font-mono">#{selectedRequest.orderNumber || selectedRequest.orderId.slice(0, 8)}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Date</span>
                                                <span className="value">{new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-card">
                                        <h3><DollarSign size={16} /> Financial</h3>
                                        <div className="info-list">
                                            <div className="info-item">
                                                <span className="label">Refund Amount</span>
                                                <span className="value font-bold text-lg">₹{selectedRequest.refundAmount?.toFixed(2) || selectedRequest.amount?.toFixed(2)}</span>
                                            </div>

                                            {selectedRequest.type === 'cancel' && (
                                                <div className="info-item">
                                                    <span className="label text-danger">Charge ({selectedRequest.chargePercentage}%)</span>
                                                    <span className="value text-danger">- ₹{selectedRequest.chargeAmount?.toFixed(2)}</span>
                                                </div>
                                            )}

                                            <div className="info-item mt-2 pt-2 border-t border-dashed">
                                                <span className="label">Payment Status</span>
                                                <span className="badge badge-neutral">{selectedRequest.refundStatus || 'Pending'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-card full-width">
                                        <h3><MessageSquare size={16} /> Customer Reason</h3>
                                        <div className="bg-gray-50 p-3 rounded-md border border-gray-100 italic text-secondary">
                                            "{selectedRequest.reason}"
                                        </div>
                                    </div>

                                    {/* Admin Action Section */}
                                    <div className="detail-card full-width">
                                        <h3>Actions</h3>

                                        {selectedRequest.status === 'pending' ? (
                                            <div className="flex flex-col gap-4">
                                                <textarea
                                                    className="form-textarea"
                                                    value={actionNote}
                                                    onChange={(e) => setActionNote(e.target.value)}
                                                    placeholder="Add a note (required for decline)..."
                                                    rows="3"
                                                />
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        className="btn btn-outline text-danger border-danger-light hover:bg-red-50"
                                                        onClick={() => handleDecline(selectedRequest)}
                                                        disabled={processing}
                                                    >
                                                        Decline
                                                    </button>
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleApprove(selectedRequest)}
                                                        disabled={processing}
                                                    >
                                                        {processing ? 'Processing...' : 'Approve Request'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm">
                                                    Processed on <strong>{new Date(selectedRequest.approvedAt || selectedRequest.declinedAt).toLocaleString()}</strong>
                                                </p>
                                                {selectedRequest.adminNote && (
                                                    <p className="text-sm mt-1 text-secondary">Note: {selectedRequest.adminNote}</p>
                                                )}

                                                {selectedRequest.awaitingReturn && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-primary font-medium">
                                                                <Package size={18} /> Product return pending
                                                            </div>
                                                            <button
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => handleMarkReturned(selectedRequest)}
                                                                disabled={processing}
                                                            >
                                                                Mark Returned & Complete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminRequests;
