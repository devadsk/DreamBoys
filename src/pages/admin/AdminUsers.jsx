import React from 'react';
import { Users, AlertCircle } from 'lucide-react';
import '../admin/AdminDashboard.css';

const AdminUsers = () => {
    return (
        <div className="admin-page-content">
            <div className="page-header">
                <div>
                    <h1>Manage Users</h1>
                    <p className="subtitle">User roles and permission management</p>
                </div>
            </div>

            <div className="empty-state">
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Users size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
                    <p className="text-gray-500 max-w-md">
                        User management functionality including role assignment and permissions will be available in the next update.
                    </p>
                    <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-3 text-sm max-w-md">
                        <AlertCircle size={18} />
                        <span>This feature requires additional Firebase Admin SDK integration.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
