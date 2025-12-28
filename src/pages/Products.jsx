import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../firebase/firebaseService';
import { searchProducts } from '../utils/searchUtils';
import InlineLoader from '../components/InlineLoader';
import './Products.css';

const Products = () => {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [sortBy, setSortBy] = useState('default');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false); // Mobile filter drawer
    const [categoryMap, setCategoryMap] = useState({}); // value -> name mapping


    useEffect(() => {
        loadProducts();
    }, []);

    // Handle URL search parameter
    useEffect(() => {
        const searchParam = searchParams.get('search');
        if (searchParam) {
            setSearchQuery(searchParam);
        }
    }, [searchParams]);

    const loadProducts = async () => {
        const [productsRes, categoriesRes] = await Promise.all([
            getProducts(),
            getCategories()
        ]);

        if (productsRes.success) {
            setProducts(productsRes.data);
        }

        if (categoriesRes.success && categoriesRes.data.length > 0) {
            const map = {};
            categoriesRes.data.forEach(c => {
                map[c.value] = c.name;
            });
            setCategoryMap(map);
        }

        setLoading(false);
    };

    // Extract available options
    const { availableCategories, availableColors, availableSizes, minPrice, maxPrice } = useMemo(() => {
        const cats = new Set();
        const colors = new Set();
        const sizes = new Set();
        let min = Infinity;
        let max = 0;

        products.forEach(p => {
            if (p.category) cats.add(p.category);
            if (p.colors) p.colors.forEach(c => colors.add(c));
            if (p.sizes) p.sizes.forEach(s => sizes.add(s));
            else if (p.sizeStock) Object.keys(p.sizeStock).forEach(s => sizes.add(s));

            if (p.price) {
                min = Math.min(min, p.price);
                max = Math.max(max, p.price);
            }
        });

        // Custom size sorting - standard sizes first, then numeric
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];
        const sortedSizes = Array.from(sizes).sort((a, b) => {
            const aIndex = sizeOrder.indexOf(a);
            const bIndex = sizeOrder.indexOf(b);

            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;

            // For numeric sizes, sort numerically
            const aNum = parseInt(a);
            const bNum = parseInt(b);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;

            return a.localeCompare(b);
        });

        return {
            availableCategories: Array.from(cats).sort(),
            availableColors: Array.from(colors).sort(),
            availableSizes: sortedSizes,
            minPrice: min === Infinity ? 0 : Math.floor(min),
            maxPrice: max === 0 ? 10000 : Math.ceil(max)
        };
    }, [products]);

    // Initialize price range
    useEffect(() => {
        if (products.length > 0 && priceRange[0] === 0 && priceRange[1] === 10000) {
            setPriceRange([minPrice, maxPrice]);
        }
    }, [minPrice, maxPrice, products.length]);

    // Filter products with advanced search
    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Apply advanced context-based search
        if (searchQuery) {
            filtered = searchProducts(filtered, searchQuery);
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

        if (selectedColors.length > 0) {
            filtered = filtered.filter(p => p.colors && p.colors.some(c => selectedColors.includes(c)));
        }

        if (selectedSizes.length > 0) {
            filtered = filtered.filter(p => {
                if (p.sizes) return p.sizes.some(s => selectedSizes.includes(s));
                if (p.sizeStock) return Object.keys(p.sizeStock).some(s => selectedSizes.includes(s));
                return false;
            });
        }

        if (inStockOnly) {
            filtered = filtered.filter(p => p.stock > 0);
        }

        switch (sortBy) {
            case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
            case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
            case 'name-asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
            default: break;
        }

        return filtered;
    }, [products, categoryFilter, searchQuery, priceRange, selectedColors, selectedSizes, sortBy, inStockOnly]);

    const toggleColor = (color) => {
        setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
    };

    const toggleSize = (size) => {
        setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    };

    const resetFilters = () => {
        setCategoryFilter('all');
        setSearchQuery('');
        setPriceRange([minPrice, maxPrice]);
        setSelectedColors([]);
        setSelectedSizes([]);
        setInStockOnly(false);
        setSortBy('default');
    };

    const getColorHex = (name) => {
        const colors = {
            black: '#000', white: '#fff', red: '#dc2626', blue: '#2563eb',
            green: '#16a34a', yellow: '#eab308', purple: '#9333ea', pink: '#db2777',
            gray: '#6b7280', navy: '#1e3a8a', orange: '#ea580c', brown: '#78350f'
        };
        return colors[name.toLowerCase()] || '#ccc';
    };

    if (loading) return <InlineLoader message="Loading..." />;

    return (
        <div className="products-page">
            <div className="container">
                <div className="products-header">
                    <h1>Our Collection</h1>
                    <p>Discover premium apparel</p>
                </div>

                <div className="products-layout">
                    {/* Sidebar Filters */}
                    <aside className={`products-sidebar ${filterOpen ? 'filter-open' : ''}`}>
                        {/* Sidebar Header */}
                        <div className="sidebar-header">
                            <h2>FILTERS</h2>
                            <button className="filter-close-btn" onClick={() => setFilterOpen(false)} aria-label="Close Filters">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                            <button className="clear-all-btn" onClick={resetFilters}>
                                CLEAR ALL
                            </button>
                        </div>

                        <div className="filter-section">
                            <h3>Search</h3>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filter-section">
                            <h3>Categories</h3>
                            <div className="filter-options">
                                {availableCategories.map(cat => (
                                    <div key={cat} className="filter-option-item">
                                        <input
                                            type="checkbox"
                                            id={`cat-${cat}`}
                                            checked={categoryFilter === cat}
                                            onChange={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                                        />
                                        <label htmlFor={`cat-${cat}`}>
                                            {categoryMap[cat] || cat}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3>Price Range</h3>
                            <div className="price-range">
                                <div className="price-values">
                                    <span>₹{priceRange[0]}</span>
                                    <span>₹{priceRange[1]}</span>
                                </div>
                                <input
                                    type="range"
                                    min={minPrice}
                                    max={maxPrice}
                                    value={priceRange[1]}
                                    onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    className="range-slider"
                                />
                            </div>
                        </div>

                        {availableColors.length > 0 && (
                            <div className="filter-section">
                                <h3>Colors</h3>
                                <div className="color-options">
                                    {availableColors.map(color => (
                                        <div key={color} className="filter-option-item">
                                            <input
                                                type="checkbox"
                                                id={`color-${color}`}
                                                checked={selectedColors.includes(color)}
                                                onChange={() => toggleColor(color)}
                                            />
                                            <label htmlFor={`color-${color}`}>
                                                {color}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableSizes.length > 0 && (
                            <div className="filter-section">
                                <h3>Sizes</h3>
                                <div className="size-options">
                                    {availableSizes.map(size => (
                                        <button
                                            key={size}
                                            className={`size-btn ${selectedSizes.includes(size) ? 'active' : ''}`}
                                            onClick={() => toggleSize(size)}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="filter-section">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={inStockOnly}
                                    onChange={e => setInStockOnly(e.target.checked)}
                                />
                                <span>In Stock Only</span>
                            </label>
                        </div>

                        <button className="reset-btn" onClick={resetFilters}>
                            Reset All Filters
                        </button>
                    </aside>

                    {/* Backdrop for mobile */}
                    {filterOpen && <div className="filter-backdrop" onClick={() => setFilterOpen(false)}></div>}


                    {/* Main Products */}
                    <main className="products-main">
                        <div className="products-controls">
                            <div className="controls-left">
                                <button className="filter-toggle-btn" onClick={() => setFilterOpen(true)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="4" y1="21" x2="4" y2="14"></line>
                                        <line x1="4" y1="10" x2="4" y2="3"></line>
                                        <line x1="12" y1="21" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12" y2="3"></line>
                                        <line x1="20" y1="21" x2="20" y2="16"></line>
                                        <line x1="20" y1="12" x2="20" y2="3"></line>
                                        <line x1="1" y1="14" x2="7" y2="14"></line>
                                        <line x1="9" y1="8" x2="15" y2="8"></line>
                                        <line x1="17" y1="16" x2="23" y2="16"></line>
                                    </svg>
                                    FILTERS
                                </button>
                                <span className="results-count">{filteredProducts.length} Products</span>
                            </div>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-select">
                                <option value="default">Featured</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="name-asc">Name: A to Z</option>
                            </select>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div className="no-products">
                                <h3>No products found</h3>
                                <button onClick={resetFilters}>Clear Filters</button>
                            </div>
                        ) : (
                            <div className="products-grid">
                                {filteredProducts.map(product => (
                                    <Link to={`/product/${product.id}`} key={product.id} className="product-card">
                                        <div className="product-image">
                                            <img src={product.image || '/placeholder.jpg'} alt={product.name} />
                                            {product.discount > 0 && (
                                                <span className="discount-badge">-{product.discount}%</span>
                                            )}
                                            {product.stock <= 0 && (
                                                <span className="stock-badge">Out of Stock</span>
                                            )}
                                        </div>
                                        <div className="product-info">
                                            <span className="category">{product.category}</span>
                                            <h3>{product.name}</h3>
                                            <div className="price-row">
                                                <span className="price">₹{product.price}</span>
                                                {product.originalPrice && (
                                                    <span className="original-price">₹{product.originalPrice}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Products;
