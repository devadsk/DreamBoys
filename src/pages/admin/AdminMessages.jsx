import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Search,
    Filter,
    Check,
    Clock,
    Reply,
    User,
    Mail,
    Calendar,
    X
} from 'lucide-react';
import { getMessages, updateMessage } from '../../firebase/firebaseService';
import { useToast } from '../../context/ToastContext';
import '../admin/AdminDashboard.css'; // Shared styles
import './AdminMessages.css';

const AdminMessages = () => {
    const toast = useToast();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, pending, replied
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        setLoading(true);
        const result = await getMessages();
        if (result.success) {
            // Sort by date, newest first
            const sorted = result.data.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setMessages(sorted);
        }
        setLoading(false);
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedMessage) return;

        setSendingReply(true);
        const result = await updateMessage(selectedMessage.id, {
            status: 'replied',
            adminReply: replyText,
            repliedAt: new Date().toISOString()
        });

        if (result.success) {
            setMessages(messages.map(msg =>
                msg.id === selectedMessage.id
                    ? { ...msg, status: 'replied', adminReply: replyText, repliedAt: new Date().toISOString() }
                    : msg
            ));
            setSelectedMessage(null);
            setReplyText('');
            toast.success('Reply sent successfully!');
        } else {
            toast.error(`Error sending reply: ${result.error}`);
        }
        setSendingReply(false);
    };

    const filteredMessages = messages.filter(msg => {
        if (activeTab === 'all') return true;
        return msg.status === activeTab;
    });

    return (
        <div className="admin-page-content">
            <div className="page-header">
                <div>
                    <h1>Customer Messages</h1>
                    <p className="subtitle">View and reply to customer inquiries</p>
                </div>
            </div>

            {/* NEW PILL TABS */}
            <div className="mb-6">
                <div className="filter-tabs-container">
                    {['all', 'pending', 'replied'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`filter-tab-pill ${activeTab === tab ? 'active' : ''}`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabMessage"
                                    className="active-pill-bg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="capitalize">{tab}</span>
                            <span className="ml-2 text-xs opacity-70">
                                {tab === 'all' ? messages.length : messages.filter(m => m.status === tab).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages List - Using Grid/Cards instead of table for better readability of text */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading messages...</p>
                </div>
            ) : filteredMessages.length === 0 ? (
                <div className="empty-state">
                    <MessageSquare size={48} className="text-muted mb-2" />
                    <p>No messages found.</p>
                </div>
            ) : (
                <div className="messages-grid">
                    {filteredMessages.map(msg => (
                        <motion.div
                            key={msg.id}
                            className={`message-card ${msg.status === 'pending' ? 'status-pending-border' : ''}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            layout
                        >
                            <div className="message-card-header">
                                <div className="sender-profile">
                                    <div className="avatar-placeholder">
                                        {msg.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="sender-details">
                                        <h3>{msg.name}</h3>
                                        <span className="text-xs text-secondary flex items-center gap-1">
                                            <Mail size={10} /> {msg.email}
                                        </span>
                                    </div>
                                </div>
                                <div className="message-meta">
                                    <span className={`status-pill ${msg.status === 'replied' ? 'status-delivered' : 'status-pending'}`}>
                                        {msg.status === 'replied' ? <Check size={12} /> : <Clock size={12} />}
                                        {msg.status}
                                    </span>
                                    <span className="text-xs text-secondary flex items-center gap-1 mt-1">
                                        <Calendar size={10} />
                                        {new Date(msg.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="message-content">
                                <h4 className="subject">{msg.subject}</h4>
                                <p className="body">{msg.message}</p>
                            </div>

                            {msg.adminReply ? (
                                <div className="admin-reply-box">
                                    <div className="reply-header">
                                        <Reply size={14} /> <span>Replied on {new Date(msg.repliedAt).toLocaleDateString()}</span>
                                    </div>
                                    <p>{msg.adminReply}</p>
                                </div>
                            ) : (
                                <div className="message-actions">
                                    <button
                                        className="btn btn-outline btn-sm w-full"
                                        onClick={() => {
                                            setSelectedMessage(msg);
                                            setReplyText('');
                                        }}
                                    >
                                        <Reply size={16} /> Reply
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Reply Modal */}
            <AnimatePresence>
                {selectedMessage && (
                    <div className="modal-backdrop" onClick={() => setSelectedMessage(null)}>
                        <motion.div
                            className="modal-content"
                            style={{ maxWidth: '600px' }}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Reply to {selectedMessage.name}</h2>
                                <button className="btn-icon-small" onClick={() => setSelectedMessage(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleReply} className="p-6 pt-0">
                                <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">{selectedMessage.subject}</p>
                                    <p className="text-sm text-gray-600 italic">"{selectedMessage.message}"</p>
                                </div>

                                <div className="form-group mb-4">
                                    <label className="form-label">Your Reply</label>
                                    <textarea
                                        className="form-textarea w-full"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your response to the customer..."
                                        rows="6"
                                        required
                                        autoFocus
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setSelectedMessage(null)}
                                        disabled={sendingReply}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={sendingReply}
                                    >
                                        {sendingReply ? 'Sending...' : 'Send Reply'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminMessages;
