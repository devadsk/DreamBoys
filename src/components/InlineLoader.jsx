import React from 'react';
import './InlineLoader.css';
import logo from '../assets/logo.jpg';

const InlineLoader = ({ message = "Loading..." }) => {
    return (
        <div className="inline-loader-container">
            <div className="inline-loader-content">
                <div className="inline-loader-logo">
                    <img src={logo} alt="DreamBoys Logo" className="inline-logo-image" />
                </div>
                <div className="inline-loader-spinner">
                    <div className="inline-spinner-ring"></div>
                    <div className="inline-spinner-ring"></div>
                    <div className="inline-spinner-ring"></div>
                </div>
                <p className="inline-loader-text">{message}</p>
            </div>
        </div>
    );
};

export default InlineLoader;
