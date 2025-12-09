import React from 'react';
import '../admin/AdminDashboard.css';

const AdminUsers = () => {
    return (
        <div className="admin-dashboard">
            <div className="container">
                <div className="admin-header">
                    <h1>Manage Users</h1>
                </div>

                <div className="admin-card">
                    <p>User management interface - View users, manage roles and permissions</p>
                    <p className="text-muted">To be implemented with Firebase integration</p>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
