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
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
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
        await deleteDoc(doc(db, 'products', productId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Create order
export const createOrder = async (orderData) => {
    try {
        const docRef = await addDoc(collection(db, 'orders'), {
            ...orderData,
            createdAt: new Date().toISOString(),
            status: 'pending'
        });
        return { success: true, id: docRef.id };
    } catch (error) {
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
        return { success: true, data: orders };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Update order status (Admin only)
export const updateOrderStatus = async (orderId, status) => {
    try {
        await updateDoc(doc(db, 'orders', orderId), { status });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
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
