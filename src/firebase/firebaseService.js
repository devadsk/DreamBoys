import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { firebaseConfig } from './config';
import { runTransaction } from "firebase/firestore";


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Provider
const googleProvider = new GoogleAuthProvider();

// ===== AUTHENTICATION FUNCTIONS =====

// Register with Email and Password
export const registerWithEmail = async (email, password, displayName, additionalData = {}) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName });

        // Create user document in Firestore with all customer data
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            phone: additionalData.phone || '',
            dateOfBirth: additionalData.dateOfBirth || '',
            address: additionalData.address || {
                street: '',
                city: '',
                state: '',
                postalCode: '',
                country: ''
            },
            role: 'customer',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            cart: [],
            wishlist: [],
            addresses: [] // For multiple shipping addresses
        });

        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Sign in with Email and Password
export const loginWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Sign in with Google
export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        // If new user, create document with full customer data structure
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                phone: user.phoneNumber || '',
                dateOfBirth: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: ''
                },
                role: 'customer',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                cart: [],
                wishlist: [],
                addresses: []
            });
        }

        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Sign out
export const logout = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Auth state observer
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// ===== FIRESTORE FUNCTIONS =====

// Get user data
export const getUserData = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return { success: true, data: userDoc.data() };
        }
        return { success: false, error: 'User not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Update user data
export const updateUserData = async (uid, data) => {
    try {
        await updateDoc(doc(db, 'users', uid), data);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get all products
export const getProducts = async () => {
    try {
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, data: products };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get all products (returns array directly for admin)
export const getAllProducts = async () => {
    try {
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

// Get single product
export const getProduct = async (productId) => {
    try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (!productDoc.exists()) {
            return { success: false, error: 'Product not found' };
        }

        const productData = productDoc.data();

        // Check if product data already has complete information (new format from bulk import)
        const hasCompleteData = productData.colors && productData.sizes &&
            productData.colorSizeStock && productData.colorImages;

        if (hasCompleteData) {
            // Use data from main document (new format)
            return {
                success: true,
                data: {
                    id: productId,
                    ...productData
                }
            };
        }

        // Fallback: Build from variants subcollection (old format)
        const variantsSnap = await getDocs(
            collection(db, 'products', productId, 'variants')
        );

        const variants = variantsSnap.docs.map(d => d.data());

        const colors = [...new Set(variants.map(v => v.color))];
        const sizes = [...new Set(variants.map(v => v.size))];

        const colorSizeStock = {};
        const colorImages = {};

        variants.forEach(v => {
            if (!colorSizeStock[v.color]) colorSizeStock[v.color] = {};
            colorSizeStock[v.color][v.size] = v.stock;

            if (!colorImages[v.color]) {
                colorImages[v.color] = v.images;
            }
        });

        return {
            success: true,
            data: {
                id: productId,
                ...productData,
                colors,
                sizes,
                colorSizeStock,
                colorImages
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Add product (Admin only)
export const addProduct = async (productData) => {
    try {
        const {
            name,
            category,
            price,
            description,
            colorSizeStock,
            colorImages = {},
            colors = [],
            sizes = [],
            image = '',
            images = [],
            stock = 0
        } = productData;

        // Calculate derived fields if not provided
        const finalColors = colors.length > 0 ? colors : Object.keys(colorSizeStock);
        const finalSizes = sizes.length > 0 ? sizes : [...new Set(
            Object.values(colorSizeStock).flatMap(sizeMap => Object.keys(sizeMap))
        )];
        const finalStock = stock > 0 ? stock : Object.values(colorSizeStock).reduce((acc, sizes) =>
            acc + Object.values(sizes).reduce((s, q) => s + q, 0), 0
        );
        const finalImage = image || Object.values(colorImages)[0]?.[0] || '';
        const finalImages = images.length > 0 ? images : Object.values(colorImages)[0] || [];

        // Create product doc with ALL fields
        const productRef = await addDoc(collection(db, 'products'), {
            name,
            category,
            price,
            description,
            colors: finalColors,
            sizes: finalSizes,
            colorSizeStock,
            colorImages,
            image: finalImage,
            images: finalImages,
            stock: finalStock,
            rating: 0,
            reviewCount: 0,
            createdAt: new Date().toISOString()
        });

        // Create variants subcollection for detailed tracking
        for (const [color, sizes] of Object.entries(colorSizeStock)) {
            for (const [size, stock] of Object.entries(sizes)) {
                if (stock <= 0) continue;

                const sku = `${productRef.id}-${size}-${color}`.toUpperCase();

                await setDoc(
                    doc(db, 'products', productRef.id, 'variants', sku),
                    {
                        sku,
                        size,
                        color,
                        stock,
                        images: colorImages[color] || [],
                        createdAt: new Date().toISOString()
                    }
                );
            }
        }

        return { success: true, id: productRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};


// Update product (Admin only)
export const updateProduct = async (productId, productData) => {
    try {
        await updateDoc(doc(db, 'products', productId), productData);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Delete product (Admin only)
export const deleteProduct = async (productId) => {
    try {
        // First, get the product data to extract image URLs
        const productDoc = await getDoc(doc(db, 'products', productId));

        if (productDoc.exists()) {
            const productData = productDoc.data();
            const storage = getStorage();
            const imageUrls = [];

            // Collect all image URLs
            if (productData.image) imageUrls.push(productData.image);
            if (productData.images && Array.isArray(productData.images)) {
                imageUrls.push(...productData.images);
            }
            if (productData.colorImages && typeof productData.colorImages === 'object') {
                Object.values(productData.colorImages).forEach(urls => {
                    if (Array.isArray(urls)) imageUrls.push(...urls);
                });
            }

            // Delete unique images from Firebase Storage
            const uniqueUrls = [...new Set(imageUrls)];
            const deletePromises = uniqueUrls.map(async (url) => {
                try {
                    if (url && url.includes('firebase')) {
                        // Extract path from Firebase Storage URL
                        const decodedUrl = decodeURIComponent(url);
                        const pathMatch = decodedUrl.match(/\/o\/(.*?)\?/);
                        if (pathMatch && pathMatch[1]) {
                            const imagePath = pathMatch[1];
                            const imageRef = ref(storage, imagePath);
                            await deleteObject(imageRef);
                            console.log(`Deleted image: ${imagePath}`);
                        }
                    }
                } catch (imgError) {
                    // Continue even if individual image deletion fails
                    console.warn(`Failed to delete image ${url}:`, imgError.message);
                }
            });

            // Wait for all image deletions
            await Promise.all(deletePromises);
        }

        // Delete the product document
        await deleteDoc(doc(db, 'products', productId));
        return { success: true };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, error: error.message };
    }
};

// Create order with stock deduction
export const createOrder = async (orderData) => {
    try {
        return await runTransaction(db, async (transaction) => {
            // 1. Read all product documents first
            const productReads = [];
            for (const item of orderData.items) {
                const productRef = doc(db, 'products', item.id);
                productReads.push({ ref: productRef, item });
            }

            const productDocs = await Promise.all(
                productReads.map(async (pr) => {
                    const docSnap = await transaction.get(pr.ref);
                    return { ...pr, doc: docSnap };
                })
            );

            // 2. Check stock and calculate updates
            for (const { doc, item } of productDocs) {
                if (!doc.exists()) {
                    throw new Error(`Product ${item.name} no longer exists.`);
                }

                const data = doc.data();
                const color = item.selectedColor || 'default';
                const size = item.selectedSize || 'default';

                // Locate stock
                let currentStock = 0;
                let stockPathConfirmed = false;

                // Check complex structure: colorSizeStock[color][size]
                if (data.colorSizeStock && data.colorSizeStock[color] && data.colorSizeStock[color][size] !== undefined) {
                    currentStock = Number(data.colorSizeStock[color][size]);
                    stockPathConfirmed = true;
                } else if (data.stock !== undefined) {
                    // Fallback to simple stock if complex structure not found (though items should have it)
                    currentStock = Number(data.stock);
                } else {
                    // If we can't find stock, assume 0 to be safe, or allow if we don't track it?
                    // Assuming we track it:
                    throw new Error(`Stock information missing for ${item.name}`);
                }

                if (currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for ${item.name} (${item.selectedColor}/${item.selectedSize}). Available: ${currentStock}`);
                }

                // 3. Queue update
                let updates = {};
                if (stockPathConfirmed) {
                    updates[`colorSizeStock.${color}.${size}`] = currentStock - item.quantity;
                } else {
                    updates['stock'] = currentStock - item.quantity;
                }

                transaction.update(doc.ref, updates);
            }

            // 4. Create Order
            const ordersRef = collection(db, 'orders');
            const newOrderRef = doc(ordersRef); // Auto-ID
            const orderNumber = 'ORD-' + Date.now();

            // Helper function to remove undefined values recursively
            const removeUndefined = (obj) => {
                if (obj === null || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(removeUndefined);

                return Object.entries(obj).reduce((acc, [key, value]) => {
                    if (value !== undefined) {
                        acc[key] = typeof value === 'object' ? removeUndefined(value) : value;
                    }
                    return acc;
                }, {});
            };

            const newOrder = removeUndefined({
                ...orderData,
                orderNumber,
                status: 'pending',
                createdAt: new Date().toISOString(),
                id: newOrderRef.id // Save ID inside doc too if needed
            });

            transaction.set(newOrderRef, newOrder);

            return { success: true, orderId: newOrderRef.id, orderNumber };
        });

    } catch (error) {
        console.error('Error creating order:', error);
        return { success: false, error: error.message };
    }
};

// Get user orders
export const getUserOrders = async (userId) => {
    try {
        const ordersRef = collection(db, 'orders');

        // Simple query (no composite index needed)
        const q = query(ordersRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Client-side sort by createdAt desc
        orders.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date);
            const dateB = new Date(b.createdAt || b.date);
            return dateB - dateA;
        });

        return { success: true, data: orders };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get all orders (Admin only)
export const getAllOrders = async () => {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return orders; // Return array directly
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
};

// Update order status (Admin only)
export const updateOrderStatus = async (orderId, status) => {
    try {
        await updateDoc(doc(db, 'orders', orderId), {
            status,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get all users (Admin only)
export const getAllUsers = async () => {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

// ===== TESTIMONIALS FUNCTIONS =====

// Get all testimonials
export const getTestimonials = async () => {
    try {
        const testimonialsRef = collection(db, 'testimonials');
        const snapshot = await getDocs(testimonialsRef);
        const testimonials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, data: testimonials };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Add testimonial (Admin only)
export const addTestimonial = async (testimonialData) => {
    try {
        const docRef = await addDoc(collection(db, 'testimonials'), {
            ...testimonialData,
            createdAt: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Update testimonial (Admin only)
export const updateTestimonial = async (testimonialId, testimonialData) => {
    try {
        await updateDoc(doc(db, 'testimonials', testimonialId), {
            ...testimonialData,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Delete testimonial (Admin only)
export const deleteTestimonial = async (testimonialId) => {
    try {
        await deleteDoc(doc(db, 'testimonials', testimonialId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ===== CATEGORIES FUNCTIONS =====

// Get all categories
export const getCategories = async () => {
    try {
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, data: categories };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Add category (Admin only)
export const addCategory = async (categoryData) => {
    try {
        const docRef = await addDoc(collection(db, 'categories'), {
            ...categoryData,
            createdAt: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Update category (Admin only)
export const updateCategory = async (categoryId, categoryData) => {
    try {
        await updateDoc(doc(db, 'categories', categoryId), {
            ...categoryData,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Delete category (Admin only)
export const deleteCategory = async (categoryId) => {
    try {
        await deleteDoc(doc(db, 'categories', categoryId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ===== REVIEWS FUNCTIONS =====

// Add review for a product
export const addReview = async (reviewData) => {
    try {
        const { productId, userId, userName, rating, comment } = reviewData;

        // Add review to reviews collection
        const docRef = await addDoc(collection(db, 'reviews'), {
            productId,
            userId,
            userName,
            rating: parseFloat(rating),
            comment,
            verified: false, // Can be set to true if user purchased the product
            createdAt: new Date().toISOString(),
            helpful: 0
        });

        // Update product's average rating and review count
        await updateProductRating(productId);

        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get reviews for a specific product
export const getProductReviews = async (productId) => {
    try {
        const reviewsRef = collection(db, 'reviews');

        // Try with orderBy first
        try {
            const q = query(reviewsRef, where('productId', '==', productId), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: reviews };
        } catch (indexError) {
            // If index doesn't exist, query without orderBy and sort in JavaScript
            console.log('Firestore index not found, sorting in JavaScript');
            const q = query(reviewsRef, where('productId', '==', productId));
            const snapshot = await getDocs(q);
            const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort by createdAt in JavaScript
            reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return { success: true, data: reviews };
        }
    } catch (error) {
        console.error('Error getting product reviews:', error);
        return { success: false, error: error.message };
    }
};

// Get reviews by a specific user
export const getUserReviews = async (userId) => {
    try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, data: reviews };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Update review
export const updateReview = async (reviewId, reviewData) => {
    try {
        await updateDoc(doc(db, 'reviews', reviewId), {
            ...reviewData,
            updatedAt: new Date().toISOString()
        });

        // Update product rating if rating changed
        if (reviewData.productId) {
            await updateProductRating(reviewData.productId);
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Delete review
export const deleteReview = async (reviewId, productId) => {
    try {
        await deleteDoc(doc(db, 'reviews', reviewId));

        // Update product rating after deletion
        if (productId) {
            await updateProductRating(productId);
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Helper function to update product's average rating and review count
const updateProductRating = async (productId) => {
    try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, where('productId', '==', productId));
        const snapshot = await getDocs(q);

        const reviews = snapshot.docs.map(doc => doc.data());
        const reviewCount = reviews.length;

        let averageRating = 0;
        if (reviewCount > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            averageRating = totalRating / reviewCount;
        }

        // Update product document
        await updateDoc(doc(db, 'products', productId), {
            rating: parseFloat(averageRating.toFixed(1)),
            reviewCount: reviewCount
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating product rating:', error);
        return { success: false, error: error.message };
    }
};

// Mark review as helpful
export const markReviewHelpful = async (reviewId) => {
    try {
        const reviewDoc = await getDoc(doc(db, 'reviews', reviewId));
        if (reviewDoc.exists()) {
            const currentHelpful = reviewDoc.data().helpful || 0;
            await updateDoc(doc(db, 'reviews', reviewId), {
                helpful: currentHelpful + 1
            });
            return { success: true };
        }
        return { success: false, error: 'Review not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};


export const decrementVariantStock = async (productId, sku, qty) => {
    const variantRef = doc(db, 'products', productId, 'variants', sku);

    return await runTransaction(db, async (transaction) => {
        const variantSnap = await transaction.get(variantRef);

        if (!variantSnap.exists()) {
            throw new Error("Variant not found");
        }

        const currentStock = variantSnap.data().stock;

        if (currentStock < qty) {
            throw new Error("Insufficient stock");
        }

        transaction.update(variantRef, {
            stock: currentStock - qty
        });
    });
};

// ===== CART MANAGEMENT FUNCTIONS =====

/**
 * Save entire cart to Firestore for authenticated user
 * @param {string} userId - User ID
 * @param {Array} cartItems - Array of cart items
 */
export const saveCartToFirestore = async (userId, cartItems) => {
    try {
        // Store cart as a subcollection under user document
        const cartRef = collection(db, 'users', userId, 'cart');

        // Clear existing cart first
        const existingCart = await getDocs(cartRef);
        const deletePromises = existingCart.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Add new cart items (filter out undefined values)
        const addPromises = cartItems.map(item => {
            const itemKey = `${item.id}-${item.selectedSize}-${item.selectedColor}`;

            // Remove undefined values (Firestore doesn't allow them)
            const cleanItem = Object.fromEntries(
                Object.entries(item).filter(([_, value]) => value !== undefined)
            );

            return setDoc(doc(cartRef, itemKey), {
                ...cleanItem,
                addedAt: new Date().toISOString()
            });
        });

        await Promise.all(addPromises);
        return { success: true };
    } catch (error) {
        console.error('Error saving cart to Firestore:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get cart from Firestore for authenticated user
 * @param {string} userId - User ID
 */
export const getCartFromFirestore = async (userId) => {
    try {
        const cartRef = collection(db, 'users', userId, 'cart');
        const snapshot = await getDocs(cartRef);
        const cartItems = snapshot.docs.map(doc => {
            const data = doc.data();
            // Remove addedAt from the returned object to keep it clean
            const { addedAt, ...item } = data;
            return item;
        });
        return { success: true, data: cartItems };
    } catch (error) {
        console.error('Error getting cart from Firestore:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update a specific cart item in Firestore
 * @param {string} userId - User ID
 * @param {string} itemKey - Item key (productId-size-color)
 * @param {Object} updates - Fields to update
 */
export const updateCartItemInFirestore = async (userId, itemKey, updates) => {
    try {
        const itemRef = doc(db, 'users', userId, 'cart', itemKey);
        await updateDoc(itemRef, updates);
        return { success: true };
    } catch (error) {
        console.error('Error updating cart item in Firestore:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Remove a specific cart item from Firestore
 * @param {string} userId - User ID
 * @param {string} itemKey - Item key (productId-size-color)
 */
export const removeCartItemFromFirestore = async (userId, itemKey) => {
    try {
        const itemRef = doc(db, 'users', userId, 'cart', itemKey);
        await deleteDoc(itemRef);
        return { success: true };
    } catch (error) {
        console.error('Error removing cart item from Firestore:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clear entire cart from Firestore
 * @param {string} userId - User ID
 */
export const clearCartInFirestore = async (userId) => {
    try {
        const cartRef = collection(db, 'users', userId, 'cart');
        const snapshot = await getDocs(cartRef);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        return { success: true };
    } catch (error) {
        console.error('Error clearing cart in Firestore:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Validate cart items against current stock levels
 * @param {Array} cartItems - Array of cart items to validate
 * @returns {Object} - Validation results with stock status for each item
 */
export const validateCartStock = async (cartItems) => {
    try {
        const validationResults = await Promise.all(
            cartItems.map(async (item) => {
                try {
                    // Get current product data
                    const productResult = await getProduct(item.id);

                    if (!productResult.success) {
                        return {
                            ...item,
                            stockStatus: 'unavailable',
                            availableStock: 0,
                            message: 'Product not found'
                        };
                    }

                    const product = productResult.data;

                    // Check stock for specific size/color combination
                    let availableStock = 0;

                    if (product.colorSizeStock) {
                        if (item.selectedColor && product.colorSizeStock[item.selectedColor]) {
                            availableStock = product.colorSizeStock[item.selectedColor][item.selectedSize] || 0;
                        } else if (product.colorSizeStock['default']) {
                            availableStock = product.colorSizeStock['default'][item.selectedSize] || 0;
                        }
                    }

                    // Determine stock status
                    let stockStatus = 'available';
                    let message = '';

                    if (availableStock === 0) {
                        stockStatus = 'out_of_stock';
                        message = 'Out of stock';
                    } else if (availableStock < item.quantity) {
                        stockStatus = 'insufficient';
                        message = `Only ${availableStock} available`;
                    } else if (availableStock <= 5) {
                        stockStatus = 'low_stock';
                        message = `Low stock (${availableStock} left)`;
                    }

                    return {
                        ...item,
                        stockStatus,
                        availableStock,
                        message
                    };
                } catch (error) {
                    console.error(`Error validating item ${item.id}:`, error);
                    return {
                        ...item,
                        stockStatus: 'error',
                        availableStock: 0,
                        message: 'Error checking stock'
                    };
                }
            })
        );

        return { success: true, data: validationResults };
    } catch (error) {
        console.error('Error validating cart stock:', error);
        return { success: false, error: error.message };
    }
};

// ===== WISHLIST MANAGEMENT FUNCTIONS =====

/**
 * Save entire wishlist to Firestore for authenticated user
 */
export const saveWishlistToFirestore = async (userId, wishlistItems) => {
    try {
        const wishlistRef = collection(db, 'users', userId, 'wishlist');
        const existingWishlist = await getDocs(wishlistRef);
        const deletePromises = existingWishlist.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        const addPromises = wishlistItems.map(item => {
            const cleanItem = Object.fromEntries(
                Object.entries(item).filter(([_, value]) => value !== undefined)
            );
            return setDoc(doc(wishlistRef, item.id), {
                ...cleanItem,
                addedAt: new Date().toISOString()
            });
        });

        await Promise.all(addPromises);
        return { success: true };
    } catch (error) {
        console.error('Error saving wishlist to Firestore:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get wishlist from Firestore for authenticated user
 */
export const getWishlistFromFirestore = async (userId) => {
    try {
        const wishlistRef = collection(db, 'users', userId, 'wishlist');
        const snapshot = await getDocs(wishlistRef);
        const wishlistItems = snapshot.docs.map(doc => {
            const data = doc.data();
            const { addedAt, ...item } = data;
            return item;
        });
        return { success: true, data: wishlistItems };
    } catch (error) {
        console.error('Error getting wishlist from Firestore:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clear entire wishlist from Firestore
 */
export const clearWishlistInFirestore = async (userId) => {
    try {
        const wishlistRef = collection(db, 'users', userId, 'wishlist');
        const snapshot = await getDocs(wishlistRef);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        return { success: true };
    } catch (error) {
        console.error('Error clearing wishlist in Firestore:', error);
        return { success: false, error: error.message };
    }
};


// ============================================
// USER PROFILE & ADDRESS MANAGEMENT
// ============================================



// Get saved addresses
export const getSavedAddresses = async (userId) => {
    try {
        const addressesRef = collection(db, 'users', userId, 'addresses');
        const snapshot = await getDocs(addressesRef);
        const addresses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, data: addresses };
    } catch (error) {
        console.error('Error getting saved addresses:', error);
        return { success: false, error: error.message };
    }
};

// Save new address
export const saveAddress = async (userId, addressData) => {
    try {
        const addressesRef = collection(db, 'users', userId, 'addresses');
        const newAddress = {
            ...addressData,
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(addressesRef, newAddress);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error saving address:', error);
        return { success: false, error: error.message };
    }
};

// Delete address
export const deleteAddress = async (userId, addressId) => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'addresses', addressId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting address:', error);
        return { success: false, error: error.message };
    }
};
// ===== MESSAGES FUNCTIONS =====

// Add a new message
export const addMessage = async (messageData) => {
    try {
        const docRef = await addDoc(collection(db, 'messages'), {
            ...messageData,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get all messages (Admin only)
export const getMessages = async () => {
    try {
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, data: messages };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get messages for a specific user
export const getUserMessages = async (userId) => {
    try {
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, data: messages };
    } catch (error) {
        // Fallback for missing index
        if (error.code === 'failed-precondition') {
            const messagesRef = collection(db, 'messages');
            const q = query(messagesRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return { success: true, data: messages };
        }
        return { success: false, error: error.message };
    }
};

// Update message (Reply)
export const updateMessage = async (messageId, updateData) => {
    try {
        await updateDoc(doc(db, 'messages', messageId), {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
