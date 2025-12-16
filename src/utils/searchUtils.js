/**
 * Advanced E-commerce Search Utility
 * Implements fuzzy matching, relevance scoring, and context-based search
 * Similar to Amazon, Flipkart, and other major e-commerce platforms
 */

/**
 * Calculate relevance score for a product based on search query
 * Higher score = more relevant
 */
export const calculateRelevanceScore = (product, searchQuery) => {
    if (!searchQuery || !product) return 0;

    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/);

    let score = 0;

    // Searchable fields with different weights
    const searchableFields = [
        { field: product.name, weight: 10 },
        { field: product.category, weight: 8 },
        { field: product.description, weight: 5 },
        { field: product.features, weight: 7 },
        { field: product.material, weight: 6 },
        { field: product.brand, weight: 6 },
        { field: product.tags?.join(' '), weight: 5 },
        { field: product.colors?.join(' '), weight: 3 },
        { field: product.sizes?.join(' '), weight: 2 }
    ];

    searchableFields.forEach(({ field, weight }) => {
        if (!field) return;

        const fieldValue = String(field).toLowerCase();

        // Exact match (highest priority)
        if (fieldValue === query) {
            score += weight * 10;
        }

        // Starts with query (high priority)
        if (fieldValue.startsWith(query)) {
            score += weight * 5;
        }

        // Contains exact query (medium priority)
        if (fieldValue.includes(query)) {
            score += weight * 3;
        }

        // Word-by-word matching (context-based)
        queryWords.forEach(word => {
            if (word.length < 2) return; // Skip very short words

            const fieldWords = fieldValue.split(/\s+/);

            fieldWords.forEach(fieldWord => {
                // Exact word match
                if (fieldWord === word) {
                    score += weight * 2;
                }
                // Word starts with query word
                else if (fieldWord.startsWith(word)) {
                    score += weight * 1.5;
                }
                // Word contains query word
                else if (fieldWord.includes(word)) {
                    score += weight;
                }
                // Fuzzy match (allows 1-2 character difference)
                else if (fuzzyMatch(fieldWord, word)) {
                    score += weight * 0.5;
                }
            });
        });
    });

    return score;
};

/**
 * Fuzzy matching - allows for typos and similar words
 * Returns true if words are similar enough
 */
const fuzzyMatch = (word1, word2) => {
    if (!word1 || !word2) return false;
    if (word1.length < 3 || word2.length < 3) return false;

    const distance = levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);

    // Allow 1 character difference for words up to 5 chars
    // Allow 2 character difference for longer words
    const threshold = maxLength <= 5 ? 1 : 2;

    return distance <= threshold;
};

/**
 * Levenshtein distance - measures difference between two strings
 * Used for fuzzy matching
 */
const levenshteinDistance = (str1, str2) => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
};

/**
 * Main search function - filters and sorts products by relevance
 */
export const searchProducts = (products, searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
        return products;
    }

    // Calculate relevance scores
    const productsWithScores = products.map(product => ({
        ...product,
        relevanceScore: calculateRelevanceScore(product, searchQuery)
    }));

    // Filter products with score > 0 (has some relevance)
    const relevantProducts = productsWithScores.filter(p => p.relevanceScore > 0);

    // Sort by relevance score (highest first)
    relevantProducts.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return relevantProducts;
};

/**
 * Get search suggestions based on partial query
 */
export const getSearchSuggestions = (products, partialQuery, limit = 5) => {
    if (!partialQuery || partialQuery.length < 2) return [];

    const suggestions = new Set();
    const query = partialQuery.toLowerCase();

    products.forEach(product => {
        // Add matching product names
        if (product.name?.toLowerCase().includes(query)) {
            suggestions.add(product.name);
        }

        // Add matching categories
        if (product.category?.toLowerCase().includes(query)) {
            suggestions.add(product.category);
        }

        // Add matching features
        if (product.features) {
            const features = product.features.split('|');
            features.forEach(feature => {
                if (feature.toLowerCase().includes(query)) {
                    suggestions.add(feature.trim());
                }
            });
        }
    });

    return Array.from(suggestions).slice(0, limit);
};
