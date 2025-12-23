import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserData } from '../firebase/firebaseService';
import './Profile.css';

const Profile = () => {
    const { currentUser, userData } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        displayName: userData?.displayName || '',
        phone: userData?.phone || '',
        dateOfBirth: userData?.dateOfBirth || '',
        street: userData?.address?.street || '',
        city: userData?.address?.city || '',
        state: userData?.address?.state || '',
        postalCode: userData?.address?.postalCode || '',
        country: userData?.address?.country || ''
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        const result = await updateUserData(currentUser.uid, {
            displayName: formData.displayName,
            phone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
            address: {
                street: formData.street,
                city: formData.city,
                state: formData.state,
                postalCode: formData.postalCode,
                country: formData.country
            },
            updatedAt: new Date().toISOString()
        });

        if (result.success) {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
            // Reload the page to refresh user data
            setTimeout(() => window.location.reload(), 1500);
        } else {
            setMessage({ type: 'error', text: result.error });
        }

        setSaving(false);
    };

    const handleCancel = () => {
        setFormData({
            displayName: userData?.displayName || '',
            phone: userData?.phone || '',
            dateOfBirth: userData?.dateOfBirth || '',
            street: userData?.address?.street || '',
            city: userData?.address?.city || '',
            state: userData?.address?.state || '',
            postalCode: userData?.address?.postalCode || '',
            country: userData?.address?.country || ''
        });
        setIsEditing(false);
        setMessage({ type: '', text: '' });
    };

    return (
        <div className="profile-page">
            <div className="container">
                <h1>My Profile</h1>

                {message.text && (
                    <div className={`profile-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="profile-grid">
                    {/* Left Column: User Info Card */}
                    <div className="profile-card">
                        <div className="profile-avatar-large">
                            {userData?.photoURL ? (
                                <img src={userData.photoURL} alt={userData.displayName} />
                            ) : (
                                <span>{userData?.displayName?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                        <h2>{userData?.displayName || 'User'}</h2>
                        <p>{currentUser?.email}</p>
                        <p className="profile-role">Role: {userData?.role || 'Customer'}</p>
                        <p className="profile-member-since">
                            Member since {new Date(userData?.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Right Column: Content */}
                    <div className="profile-details">
                        <div className="profile-details-header">
                            <h2>Account Information</h2>
                            {!isEditing && (
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="profile-form">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        name="displayName"
                                        className="form-input"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            className="form-input"
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Street Address</label>
                                    <input
                                        type="text"
                                        name="street"
                                        className="form-input"
                                        value={formData.street}
                                        onChange={handleChange}
                                        placeholder="123 Main Street, Apt 4B"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            className="form-input"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="New York"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">State/Province</label>
                                        <input
                                            type="text"
                                            name="state"
                                            className="form-input"
                                            value={formData.state}
                                            onChange={handleChange}
                                            placeholder="NY"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Postal Code</label>
                                        <input
                                            type="text"
                                            name="postalCode"
                                            className="form-input"
                                            value={formData.postalCode}
                                            onChange={handleChange}
                                            placeholder="10001"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Country</label>
                                        <input
                                            type="text"
                                            name="country"
                                            className="form-input"
                                            value={formData.country}
                                            onChange={handleChange}
                                            placeholder="United States"
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={handleCancel}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-info">
                                <div className="detail-row">
                                    <span>Email:</span>
                                    <span>{currentUser?.email}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Phone:</span>
                                    <span>{userData?.phone || 'Not provided'}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Date of Birth:</span>
                                    <span>
                                        {userData?.dateOfBirth
                                            ? new Date(userData.dateOfBirth).toLocaleDateString()
                                            : 'Not provided'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span>Address:</span>
                                    <span>
                                        {userData?.address?.street ? (
                                            <>
                                                {userData.address.street}<br />
                                                {userData.address.city && `${userData.address.city}, `}
                                                {userData.address.state && `${userData.address.state} `}
                                                {userData.address.postalCode}<br />
                                                {userData.address.country}
                                            </>
                                        ) : (
                                            'Not provided'
                                        )}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span>Account Status:</span>
                                    <span className="status-active">Active</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
