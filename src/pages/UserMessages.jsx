import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserMessages } from '../firebase/firebaseService';
import './UserMessages.css';

const UserMessages = () => {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadMessages();
        }
    }, [currentUser]);

    const loadMessages = async () => {
        setLoading(true);
        const result = await getUserMessages(currentUser.uid);
        if (result.success) {
            setMessages(result.data);
        }
        setLoading(false);
    };

    return (
        <div className="user-messages-page">
            <div className="container">
                <div className="messages-header">
                    <h1>My Messages</h1>
                    <p>View your inquiry history and responses from our team.</p>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading your messages...</p>
                    </div>
                ) : (
                    <div className="messages-content">
                        {messages.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">✉️</div>
                                <h3>No messages yet</h3>
                                <p>You haven't sent any messages to our team yet.</p>
                            </div>
                        ) : (
                            <div className="messages-list">
                                {messages.map(msg => (
                                    <div key={msg.id} className="user-message-card">
                                        <div className="msg-card-header">
                                            <span className="msg-date">
                                                {new Date(msg.createdAt).toLocaleDateString(undefined, {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <span className={`msg-status ${msg.status}`}>
                                                {msg.status === 'replied' ? 'Replied' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="msg-body">
                                            <h4>{msg.subject}</h4>
                                            <p className="original-msg">"{msg.message}"</p>
                                        </div>
                                        {msg.status === 'replied' && msg.adminReply && (
                                            <div className="admin-reply-box">
                                                <div className="reply-header">
                                                    <h5>Response from DreamBoys Team</h5>
                                                    <span className="reply-date">
                                                        {msg.repliedAt && new Date(msg.repliedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p>{msg.adminReply}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserMessages;
