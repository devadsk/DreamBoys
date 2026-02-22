import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import './VariantSelectionModal.css';

const VariantSelectionModal = ({ product, onConfirm, onCancel }) => {
    const toast = useToast();
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Helper function for color hex codes
    const getColorHex = (name) => {
        const colors = {
            black: '#000', white: '#fff', red: '#dc2626', blue: '#2563eb',
            green: '#16a34a', yellow: '#eab308', purple: '#9333ea', pink: '#db2777',
            gray: '#6b7280', navy: '#1e3a8a', orange: '#ea580c', brown: '#78350f',
            beige: '#D4C5B9', khaki: '#C3B091'
        };
        return colors[name.toLowerCase()] || '#ccc';
    };

    // Get available sizes based on selected color
    const getAvailableSizes = () => {
        if (!product || !product.colorSizeStock) return product?.sizes || ['S', 'M', 'L', 'XL'];

        // If color specified, check stock for that color
        if (selectedColor && product.colorSizeStock[selectedColor]) {
            return Object.keys(product.colorSizeStock[selectedColor]).filter(
                size => product.colorSizeStock[selectedColor][size] > 0
            );
        }

        // Fallback for simple stock (key 'default')
        if (product.colorSizeStock['default']) {
            return Object.keys(product.colorSizeStock['default']).filter(
                size => product.colorSizeStock['default'][size] > 0
            );
        }

        return product.sizes || [];
    };

    // Get stock level for selected size and color
    const getStockLevel = () => {
        if (!product || !product.colorSizeStock || !selectedSize) return 0;

        // Matrix mode
        if (selectedColor && product.colorSizeStock[selectedColor]) {
            return product.colorSizeStock[selectedColor][selectedSize] || 0;
        }

        // Simple mode
        if (product.colorSizeStock['default']) {
            return product.colorSizeStock['default'][selectedSize] || 0;
        }

        return 0;
    };

    // Initialize selections
    useEffect(() => {
        if (product) {
            // Set initial color
            if (product.colors?.length > 0) {
                const firstColor = product.colors[0];
                setSelectedColor(firstColor);

                // Set size available for this color
                const availableSizes = getAvailableSizes();
                if (availableSizes.length > 0) {
                    setSelectedSize(availableSizes[0]);
                }
            } else if (product.sizes?.length > 0) {
                // Products without color variants
                setSelectedSize(product.sizes[0]);
            }
        }
    }, [product]);

    // Update available sizes when color changes
    useEffect(() => {
        if (selectedColor) {
            const availableSizes = getAvailableSizes();
            if (!availableSizes.includes(selectedSize)) {
                setSelectedSize(availableSizes[0] || '');
            }
        }
    }, [selectedColor]);

    const handleConfirm = () => {
        if (!selectedSize) {
            toast.warning('Please select a size');
            return;
        }
        onConfirm(selectedSize, selectedColor, quantity);
    };

    const availableSizes = getAvailableSizes();
    const stockLevel = getStockLevel();

    return (
        <div className="variant-modal-overlay" onClick={onCancel}>
            <div className="variant-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onCancel}>×</button>

                <h2>Select Options</h2>

                <div className="modal-product-info">
                    <img src={product.image || product.images?.[0]} alt={product.name} />
                    <div>
                        <h3>{product.name}</h3>
                        <p className="modal-price">₹{product.price}</p>
                    </div>
                </div>

                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                    <div className="modal-selection-section">
                        <label>Color: <strong>{selectedColor}</strong></label>
                        <div className="modal-color-options">
                            {product.colors.map((color) => (
                                <button
                                    key={color}
                                    className={`modal-color-btn ${selectedColor === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: getColorHex(color) }}
                                    onClick={() => setSelectedColor(color)}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Size Selection */}
                <div className="modal-selection-section">
                    <label>Size: <strong>{selectedSize || 'Select a size'}</strong></label>
                    <div className="modal-size-options">
                        {availableSizes.length > 0 ? (
                            availableSizes.map((size) => (
                                <button
                                    key={size}
                                    className={`modal-size-btn ${selectedSize === size ? 'selected' : ''}`}
                                    onClick={() => setSelectedSize(size)}
                                >
                                    {size}
                                </button>
                            ))
                        ) : (
                            <p className="no-stock-msg">Out of stock for this color</p>
                        )}
                    </div>
                    {selectedSize && stockLevel > 0 && (
                        <p className={`modal-stock-info ${stockLevel <= 5 ? 'low-stock' : ''}`}>
                            {stockLevel <= 5 ? `Only ${stockLevel} left!` : `${stockLevel} available`}
                        </p>
                    )}
                </div>

                {/* Quantity Selection */}
                <div className="modal-selection-section">
                    <label>Quantity</label>
                    <div className="modal-quantity-selector">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                        >
                            −
                        </button>
                        <span>{quantity}</span>
                        <button
                            onClick={() => setQuantity(Math.min(quantity + 1, stockLevel))}
                            disabled={quantity >= stockLevel}
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="modal-actions">
                    <button className="modal-cancel-btn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className="modal-confirm-btn"
                        onClick={handleConfirm}
                        disabled={!selectedSize || stockLevel === 0}
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VariantSelectionModal;
