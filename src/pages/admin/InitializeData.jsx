import React, { useState } from 'react';
import { initializeCategories } from '../../firebase/initializeCategories';
import { Rocket, Box, CheckCircle, AlertTriangle, AlertCircle, Info, Database } from 'lucide-react';
import '../admin/AdminDashboard.css'; // Use shared styles
import './InitializeData.css';

const InitializeData = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleInitialize = async () => {
        setLoading(true);
        setResult(null);

        try {
            const response = await initializeCategories();
            setResult(response);
        } catch (error) {
            setResult({ success: false, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page-content centered-content">
            <div className="initialize-card">
                <div className="card-header-center">
                    <div className="icon-badge">
                        <Rocket size={32} />
                    </div>
                    <h1>Initialize Categories</h1>
                    <p className="subtitle">
                        Automatically seed your database with default product categories.
                    </p>
                </div>

                <div className="info-section">
                    <h3><Database size={16} /> Data to be added:</h3>
                    <ul className="data-list">
                        <li><span>👔</span> Premium Shirts (visible)</li>
                        <li><span>👕</span> Designer T-Shirts (visible)</li>
                        <li><span>👖</span> Luxury Jeans (visible)</li>
                        <li><span>🧥</span> Exclusive Jackets (hidden)</li>
                        <li><span>👟</span> Casual Wear (hidden)</li>
                        <li><span>🎩</span> Formal Wear (hidden)</li>
                    </ul>
                </div>

                <div className="warning-section">
                    <div className="warning-header">
                        <AlertTriangle size={18} />
                        <strong>Prerequisites</strong>
                    </div>
                    <ul className="check-list">
                        <li><CheckCircle size={14} /> Firestore security rules deployed</li>
                        <li><CheckCircle size={14} /> User has "admin" role in Firebase</li>
                        <li><CheckCircle size={14} /> User is logged in</li>
                    </ul>
                </div>

                <button
                    className="btn btn-primary btn-large w-full"
                    onClick={handleInitialize}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="spinner-sm"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <Rocket size={18} /> Initialize Database
                        </>
                    )}
                </button>

                {result && (
                    <div className={`result-box ${result.success ? 'result-success' : 'result-error'}`}>
                        {result.success ? (
                            <div className="result-content">
                                <CheckCircle size={24} />
                                <div>
                                    <h3>Success!</h3>
                                    <p>{result.message}</p>
                                    <p className="mt-1 text-sm">Go to <strong>Admin &gt; Content</strong> to manage them.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="result-content">
                                <AlertCircle size={24} />
                                <div>
                                    <h3>Error Failed</h3>
                                    <p>{result.error}</p>
                                    <div className="tips text-sm mt-2 pt-2 border-t border-red-200">
                                        <strong>Try:</strong> Deploy rules, check admin role, relogin.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitializeData;
