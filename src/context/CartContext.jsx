import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    saveCartToFirestore,
    getCartFromFirestore,
    clearCartInFirestore
} from '../firebase/firebaseService';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [cart, setCart] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Load cart when user logs in
    useEffect(() => {
        loadCart();
    }, [currentUser]);

    // Save cart whenever it changes (only for authenticated users after initial load)
    useEffect(() => {
        if (!isLoading && currentUser && hasLoaded) {
            syncCartToFirestore();
        }
    }, [cart, currentUser, isLoading, hasLoaded]);

    /**
     * Load cart from Firestore (authenticated users only)
     */
    const loadCart = async () => {
        setIsLoading(true);

        if (currentUser) {
            console.log('🔄 Loading cart from Firestore for user:', currentUser.uid);
            const result = await getCartFromFirestore(currentUser.uid);

            if (result.success) {
                console.log('✅ Cart loaded:', result.data.length, 'items');
                setCart(result.data);
            } else {
                console.error('❌ Error loading cart:', result.error);
                setCart([]);
            }
        } else {
            // No user logged in - empty cart
            console.log('👤 No user logged in - cart is empty');
            setCart([]);
        }

        setIsLoading(false);
        setHasLoaded(true);
    };

    /**
     * Save cart to Firestore
     */
    const syncCartToFirestore = async () => {
        if (currentUser) {
            console.log('💾 Saving cart to Firestore:', cart.length, 'items');
            await saveCartToFirestore(currentUser.uid, cart);
            console.log('✅ Cart saved to Firestore');
        }
    };

    /**
     * Add item to cart (requires authentication)
     */
    const addToCart = (product, selectedSize, selectedColor, quantity = 1) => {
        console.log('🛒 addToCart called with:', { productId: product?.id, selectedSize, selectedColor, quantity, currentUser: currentUser?.uid });

        if (!currentUser) {
            console.warn('⚠️ Cannot add to cart - user not logged in');
            return false; // Return false to indicate failure
        }

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

        return true; // Return true to indicate success
    };

    /**
     * Remove item from cart
     */
    const removeFromCart = (itemId, selectedSize, selectedColor) => {
        if (!currentUser) return;

        setCart(prev => prev.filter(
            item => !(item.id === itemId &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor)
        ));
    };

    /**
     * Update item quantity
     */
    const updateQuantity = (itemId, selectedSize, selectedColor, newQuantity) => {
        if (!currentUser) return;

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

    /**
     * Clear entire cart
     */
    const clearCart = async () => {
        if (!currentUser) return;

        setCart([]);
        await clearCartInFirestore(currentUser.uid);
    };

    /**
     * Get cart total
     */
    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    /**
     * Get cart item count
     */
    const getCartCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    /**
     * Check if item is in cart
     */
    const isInCart = (productId, size, color) => {
        return cart.some(
            item => item.id === productId &&
                item.selectedSize === size &&
                item.selectedColor === color
        );
    };

    /**
     * Get quantity of specific item in cart
     */
    const getCartQuantity = (productId, size, color) => {
        const item = cart.find(
            item => item.id === productId &&
                item.selectedSize === size &&
                item.selectedColor === color
        );
        return item ? item.quantity : 0;
    };

    /**
     * Move item from cart to wishlist (save for later)
     */
    const moveToWishlist = async (item, addToWishlistFn) => {
        if (!currentUser) return;

        // Import getProduct at the top if not already imported
        const { getProduct } = await import('../firebase/firebaseService');

        // Fetch the complete product data from Firestore to get all variant information
        const result = await getProduct(item.id);

        if (result.success && result.data) {
            // Use the complete product data from Firestore
            const fullProductData = result.data;

            console.log('📦 Moving to wishlist with full product data:', {
                id: fullProductData.id,
                hasColors: !!fullProductData.colors,
                hasSizes: !!fullProductData.sizes,
                hasColorSizeStock: !!fullProductData.colorSizeStock,
                hasImages: !!fullProductData.images,
                hasColorImages: !!fullProductData.colorImages
            });

            // Add to wishlist with complete product data
            addToWishlistFn(fullProductData);
        } else {
            // Fallback to item data if fetch fails
            console.warn('⚠️ Could not fetch full product data, using cart item data');
            const productData = {
                id: item.id,
                name: item.name,
                price: item.price,
                originalPrice: item.originalPrice,
                image: item.image,
                category: item.category,
                stock: item.stock,
                sizes: item.sizes,
                colors: item.colors,
                images: item.images,
                colorImages: item.colorImages,
                colorSizeStock: item.colorSizeStock
            };
            addToWishlistFn(productData);
        }

        // Remove from cart
        removeFromCart(item.id, item.selectedSize, item.selectedColor);
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
        getCartQuantity,
        moveToWishlist,
        cartCount: getCartCount(),
        isLoading,
        requiresAuth: true // Flag to indicate cart requires authentication
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
