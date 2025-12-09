import React, { useState } from 'react';
import { initializeCategories } from '../../firebase/initializeCategories';
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
        <div className="initialize-data-page">
            <div className="initialize-container">
                <h1>🚀 Initialize Categories</h1>
                <p className="description">
                    Click the button below to automatically add 6 product categories to your Firebase database.
                </p>

                <div className="info-box">
                    <h3>📦 What will be added:</h3>
                    <ul>
                        <li>👔 Premium Shirts (visible)</li>
                        <li>👕 Designer T-Shirts (visible)</li>
                        <li>👖 Luxury Jeans (visible)</li>
                        <li>🧥 Exclusive Jackets (hidden)</li>
                        <li>👟 Casual Wear (hidden)</li>
                        <li>🎩 Formal Wear (hidden)</li>
                    </ul>
                </div>

                <div className="warning-box">
                    <strong>⚠️ Before clicking:</strong>
                    <ol>
                        <li>Make sure you've deployed Firestore security rules</li>
                        <li>Make sure your user has <code>role: "admin"</code> in Firebase</li>
                        <li>Make sure you're logged in to the app</li>
                    </ol>
                </div>

                <button
                    className="btn-initialize"
                    onClick={handleInitialize}
                    disabled={loading}
                >
                    {loading ? '⏳ Adding Categories...' : '🚀 Add Categories Now'}
                </button>

                {result && (
                    <div className={`result-box ${result.success ? 'success' : 'error'}`}>
                        {result.success ? (
                            <>
                                <h3>✅ Success!</h3>
                                <p>{result.message}</p>
                                <p>Go to <strong>/admin/content</strong> to manage them!</p>
                            </>
                        ) : (
                            <>
                                <h3>❌ Error</h3>
                                <p>{result.error}</p>
                                <p><strong>Common fixes:</strong></p>
                                <ul>
                                    <li>Deploy security rules to Firebase Console</li>
                                    <li>Set your user's role to "admin" in Firebase</li>
                                    <li>Make sure you're logged in</li>
                                </ul>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitializeData;
