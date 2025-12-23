
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMessages, updateMessage } from '../../firebase/firebaseService';
import './AdminMessages.css';

const AdminMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, replied
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
            setMessages(result.data);
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
            // Update local state
            setMessages(messages.map(msg =>
                msg.id === selectedMessage.id
                    ? { ...msg, status: 'replied', adminReply: replyText, repliedAt: new Date().toISOString() }
                    : msg
            ));
            setSelectedMessage(null);
            setReplyText('');
            alert('Reply sent successfully!');
        } else {
            alert('Error sending reply: ' + result.error);
        }
        setSendingReply(false);
    };

    const openReplyModal = (msg) => {
        setSelectedMessage(msg);
        setReplyText(msg.adminReply || '');
    };

    const filteredMessages = messages.filter(msg => {
        if (filter === 'all') return true;
        return msg.status === filter;
    });

    return (
        <div className="admin-messages-page">
            <div className="admin-header">
                <h1>Customer Messages</h1>
                <div className="filter-controls">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={`filter-btn ${filter === 'replied' ? 'active' : ''}`}
                        onClick={() => setFilter('replied')}
                    >
                        Replied
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading messages...</div>
            ) : (
                <div className="messages-list">
                    {filteredMessages.length === 0 ? (
                        <div className="empty-state">No messages found.</div>
                    ) : (
                        filteredMessages.map(msg => (
                            <motion.div
                                key={msg.id}
                                className={`message-card ${msg.status}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="message-header">
                                    <div className="sender-info">
                                        <h3>{msg.name}</h3>
                                        <span className="email">{msg.email}</span>
                                        {msg.userId && <span className="badge-user">User</span>}
                                    </div>
                                    <span className="message-date">
                                        {new Date(msg.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="message-subject">
                                    <strong>Subject:</strong> {msg.subject}
                                </div>
                                <p className="message-body">{msg.message}</p>

                                {msg.adminReply && (
                                    <div className="admin-reply-preview">
                                        <strong>Admin Reply:</strong> {msg.adminReply}
                                    </div>
                                )}

                                {/* <div className="message-actions">
                                    <span className={`status-badge ${msg.status}`}>
                                        {msg.status === 'replied' ? 'Replied' : 'Pending'}
                                    </span>
                                    <button
                                        className="btn-reply"
                                        onClick={() => openReplyModal(msg)}
                                    >
                                        {msg.status === 'replied' ? 'Edit Reply' : 'Reply'}
                                    </button>
                                </div> */}
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            <AnimatePresence>
                {selectedMessage && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedMessage(null)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h2>Reply to {selectedMessage.name}</h2>
                            <div className="original-message">
                                <p>"{selectedMessage.message}"</p>
                            </div>
                            <form onSubmit={handleReply}>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply here..."
                                    rows="5"
                                    required
                                ></textarea>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => setSelectedMessage(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-send"
                                        disabled={sendingReply}
                                    >
                                        {sendingReply ? 'Sending...' : 'Send Reply'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminMessages;
