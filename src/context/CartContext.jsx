import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('dreamboys_cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('dreamboys_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, selectedSize, selectedColor, quantity = 1) => {
        setCart(prev => {
            // Check if item with same product, size, and color already exists
            const existingItemIndex = prev.findIndex(
                item => item.id === product.id &&
                    item.selectedSize === selectedSize &&
                    item.selectedColor === selectedColor
            );

            if (existingItemIndex > -1) {
                // Update quantity of existing item
                const updated = [...prev];
                updated[existingItemIndex].quantity += quantity;
                return updated;
            } else {
                // Add new item
                return [...prev, {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    image: product.image || product.images?.[0],
                    selectedSize,
                    selectedColor,
                    quantity,
                    stock: product.stock,
                    category: product.category
                }];
            }
        });
    };

    const removeFromCart = (itemId, selectedSize, selectedColor) => {
        setCart(prev => prev.filter(
            item => !(item.id === itemId &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor)
        ));
    };

    const updateQuantity = (itemId, selectedSize, selectedColor, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId, selectedSize, selectedColor);
            return;
        }

        setCart(prev => prev.map(item => {
            if (item.id === itemId &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor) {
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    const isInCart = (productId, size, color) => {
        return cart.some(
            item => item.id === productId &&
                item.selectedSize === size &&
                item.selectedColor === color
        );
    };

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        isInCart,
        cartCount: getCartCount()
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
