/**
 * FAQ Search Utility
 * Context-based search for FAQ questions and answers
 * Similar to product search but optimized for Q&A content
 */

/**
 * Calculate relevance score for an FAQ based on search query
 */
export const calculateFAQRelevanceScore = (faq, searchQuery) => {
    if (!searchQuery || !faq) return 0;

    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(word => word.length > 1);

    let score = 0;

    const question = faq.question.toLowerCase();
    const answer = faq.answer.toLowerCase();

    // Exact phrase match in question (highest priority)
    if (question.includes(query)) {
        score += 100;
    }

    // Exact phrase match in answer
    if (answer.includes(query)) {
        score += 50;
    }

    // Question starts with query
    if (question.startsWith(query)) {
        score += 80;
    }

    // Word-by-word matching
    queryWords.forEach(word => {
        const questionWords = question.split(/\s+/);
        const answerWords = answer.split(/\s+/);

        // Check question words
        questionWords.forEach(qWord => {
            if (qWord === word) {
                score += 20; // Exact word match in question
            } else if (qWord.startsWith(word)) {
                score += 15; // Word starts with query word
            } else if (qWord.includes(word)) {
                score += 10; // Word contains query word
            } else if (fuzzyMatch(qWord, word)) {
                score += 5; // Fuzzy match (typo tolerance)
            }
        });

        // Check answer words (lower weight)
        answerWords.forEach(aWord => {
            if (aWord === word) {
                score += 10; // Exact word match in answer
            } else if (aWord.startsWith(word)) {
                score += 7; // Word starts with query word
            } else if (aWord.includes(word)) {
                score += 5; // Word contains query word
            } else if (fuzzyMatch(aWord, word)) {
                score += 2; // Fuzzy match
            }
        });
    });

    // Boost score for common question patterns
    const questionPatterns = ['how', 'what', 'when', 'where', 'why', 'can', 'do', 'does', 'is', 'are'];
    queryWords.forEach(word => {
        if (questionPatterns.includes(word) && question.includes(word)) {
            score += 5;
        }
    });

    return score;
};

/**
 * Fuzzy matching - allows for typos
 */
const fuzzyMatch = (word1, word2) => {
    if (!word1 || !word2) return false;
    if (word1.length < 3 || word2.length < 3) return false;

    const distance = levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);

    // Allow 1-2 character difference
    const threshold = maxLength <= 5 ? 1 : 2;

    return distance <= threshold;
};

/**
 * Levenshtein distance - measures difference between two strings
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
 * Main FAQ search function
 */
export const searchFAQs = (faqs, searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
        return faqs;
    }

    // Calculate relevance scores
    const faqsWithScores = faqs.map(faq => ({
        ...faq,
        relevanceScore: calculateFAQRelevanceScore(faq, searchQuery)
    }));

    // Filter FAQs with score > 0
    const relevantFAQs = faqsWithScores.filter(faq => faq.relevanceScore > 0);

    // Sort by relevance score (highest first)
    relevantFAQs.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return relevantFAQs;
};

/**
 * Get search suggestions based on partial query
 */
export const getFAQSuggestions = (faqs, partialQuery, limit = 5) => {
    if (!partialQuery || partialQuery.length < 2) return [];

    const suggestions = new Set();
    const query = partialQuery.toLowerCase();

    faqs.forEach(faq => {
        const questionWords = faq.question.toLowerCase().split(/\s+/);

        questionWords.forEach(word => {
            if (word.startsWith(query) && word.length > 2) {
                suggestions.add(word);
            }
        });

        // Add matching question if it contains the query
        if (faq.question.toLowerCase().includes(query)) {
            suggestions.add(faq.question);
        }
    });

    return Array.from(suggestions).slice(0, limit);
};
