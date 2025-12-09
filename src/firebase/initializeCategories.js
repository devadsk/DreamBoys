import { addCategory } from './firebaseService';

// Categories to add
const categories = [
    {
        name: 'Premium Shirts',
        image: '👔',
        link: '/products?category=shirts',
        color: '#667eea',
        visible: true,
        createdAt: new Date().toISOString()
    },
    {
        name: 'Designer T-Shirts',
        image: '👕',
        link: '/products?category=tshirts',
        color: '#764ba2',
        visible: true,
        createdAt: new Date().toISOString()
    },
    {
        name: 'Luxury Jeans',
        image: '👖',
        link: '/products?category=jeans',
        color: '#d4af37',
        visible: true,
        createdAt: new Date().toISOString()
    },
    {
        name: 'Exclusive Jackets',
        image: '🧥',
        link: '/products?category=jackets',
        color: '#b76e79',
        visible: false,
        createdAt: new Date().toISOString()
    },
    {
        name: 'Casual Wear',
        image: '👟',
        link: '/products?category=casual',
        color: '#10b981',
        visible: false,
        createdAt: new Date().toISOString()
    },
    {
        name: 'Formal Wear',
        image: '🎩',
        link: '/products?category=formal',
        color: '#8b5cf6',
        visible: false,
        createdAt: new Date().toISOString()
    }
];

// Function to initialize categories
export const initializeCategories = async () => {
    try {
        console.log('🚀 Starting to add categories...');
        let successCount = 0;
        let errorCount = 0;

        for (const category of categories) {
            try {
                const result = await addCategory(category);
                if (result.success) {
                    console.log(`✅ Added: ${category.name} (ID: ${result.id})`);
                    successCount++;
                } else {
                    console.error(`❌ Failed to add ${category.name}:`, result.error);
                    errorCount++;
                }
            } catch (error) {
                console.error(`❌ Failed to add ${category.name}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`✅ Successfully added: ${successCount} categories`);
        console.log(`❌ Failed: ${errorCount} categories`);

        if (successCount === categories.length) {
            console.log('🎉 All categories added successfully!');
            return { success: true, message: `Added ${successCount} categories` };
        } else if (successCount > 0) {
            console.log('⚠️ Some categories were added, but some failed');
            return { success: true, message: `Added ${successCount}/${categories.length} categories` };
        } else {
            console.log('❌ Failed to add any categories. Check permissions!');
            return { success: false, error: 'Failed to add categories. Make sure you are logged in as admin.' };
        }
    } catch (error) {
        console.error('❌ Error initializing categories:', error);
        return { success: false, error: error.message };
    }
};

// Export categories for reference
export { categories };
