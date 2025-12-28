import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    saveWishlistToFirestore,
    getWishlistFromFirestore,
    clearWishlistInFirestore
} from '../firebase/firebaseService';

const WishlistContext = createContext();

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within WishlistProvider');
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Load wishlist when user logs in
    useEffect(() => {
        loadWishlist();
    }, [currentUser]);

    // Save wishlist whenever it changes (only for authenticated users after initial load)
    useEffect(() => {
        if (!isLoading && currentUser && hasLoaded) {
            syncWishlistToFirestore();
        }
    }, [wishlist, currentUser, isLoading, hasLoaded]);

    /**
     * Load wishlist from Firestore (authenticated users only)
     */
    const loadWishlist = async () => {
        setIsLoading(true);

        if (currentUser) {
            console.log('🔄 Loading wishlist from Firestore for user:', currentUser.uid);
            const result = await getWishlistFromFirestore(currentUser.uid);

            if (result.success) {
                console.log('✅ Wishlist loaded:', result.data.length, 'items');
                setWishlist(result.data);
            } else {
                console.error('❌ Error loading wishlist:', result.error);
                setWishlist([]);
            }
        } else {
            // No user logged in - empty wishlist
            console.log('👤 No user logged in - wishlist is empty');
            setWishlist([]);
        }

        setIsLoading(false);
        setHasLoaded(true);
    };

    /**
     * Save wishlist to Firestore
     */
    const syncWishlistToFirestore = async () => {
        if (currentUser) {
            console.log('💾 Saving wishlist to Firestore:', wishlist.length, 'items');
            await saveWishlistToFirestore(currentUser.uid, wishlist);
            console.log('✅ Wishlist saved to Firestore');
        }
    };

    /**
     * Add item to wishlist (requires authentication)
     * Stores only product information without size/color variants
     */
    const addToWishlist = (product) => {
        console.log('❤️ addToWishlist called with:', {
            productId: product?.id,
            currentUser: currentUser?.uid,
            hasColors: !!product?.colors,
            hasSizes: !!product?.sizes,
            hasColorSizeStock: !!product?.colorSizeStock,
            hasImages: !!product?.images,
            hasColorImages: !!product?.colorImages,
            fullProduct: product
        });

        if (!currentUser) {
            console.warn('⚠️ Cannot add to wishlist - user not logged in');
            return false; // Return false to indicate failure
        }

        setWishlist(prev => {
            // Check if product already exists
            if (prev.find(item => item.id === product.id)) {
                console.log('Product already in wishlist');
                return prev;
            }
            console.log('Adding product to wishlist with all data:', {
                ...product,
                addedAt: new Date().toISOString()
            });
            return [...prev, {
                ...product,
                addedAt: new Date().toISOString()
            }];
        });

        return true; // Return true to indicate success
    };

    /**
     * Remove item from wishlist
     */
    const removeFromWishlist = (productId) => {
        if (!currentUser) return;

        setWishlist(prev => prev.filter(item => item.id !== productId));
    };

    /**
     * Check if item is in wishlist
     */
    const isInWishlist = (productId) => {
        return wishlist.some(item => item.id === productId);
    };

    /**
     * Clear entire wishlist
     */
    const clearWishlist = async () => {
        if (!currentUser) return;

        setWishlist([]);
        await clearWishlistInFirestore(currentUser.uid);
    };

    /**
     * Move item from wishlist to cart
     */
    const moveToCart = (item, size, color, quantity, addToCartFn) => {
        if (!currentUser) return;

        console.log('🛒 moveToCart called with item:', {
            itemId: item?.id,
            hasColors: !!item?.colors,
            hasSizes: !!item?.sizes,
            hasColorSizeStock: !!item?.colorSizeStock,
            hasImages: !!item?.images,
            hasColorImages: !!item?.colorImages,
            selectedSize: size,
            selectedColor: color,
            quantity: quantity
        });

        const productData = {
            id: item.id,
            name: item.name,
            price: item.price,
            originalPrice: item.originalPrice,
            image: item.image,
            category: item.category,
            stock: item.stock,
            // Include variant-related fields for proper cart functionality
            sizes: item.sizes,
            colors: item.colors,
            images: item.images,
            colorImages: item.colorImages,
            colorSizeStock: item.colorSizeStock
        };

        console.log('🛒 Passing productData to addToCart:', productData);

        addToCartFn(productData, size, color, quantity);
        removeFromWishlist(item.id);
    };

    const value = {
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        moveToCart,
        wishlistCount: wishlist.length,
        isLoading,
        requiresAuth: true // Flag to indicate wishlist requires authentication
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};
