'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Product, SortKey } from '../types';
import { sortProducts } from '../utils/productUtils';

interface SuggestionsPanelProps {
    products: Product[];
    currentSortKey: SortKey;
    onSortChange: (sortKey: SortKey) => void;
    onProductClick: (product: Product) => void;
    onAddToCart: (productName: string) => void;
    onFeedback: (productName: string, type: 'like' | 'dislike') => void;
    likedProducts: Set<string>;
    dislikedProducts: Set<string>;
    favorites: Set<string>;
}

export default function SuggestionsPanel({
    products,
    currentSortKey,
    onSortChange,
    onProductClick,
    onAddToCart,
    onFeedback,
    likedProducts,
    dislikedProducts,
    favorites
}: SuggestionsPanelProps) {
    const [renderedCount, setRenderedCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const suggestionsPanelRef = useRef<HTMLDivElement>(null);
    const batchSize = 8;

    const sortedProducts = sortProducts(products, currentSortKey);

    useEffect(() => {
        setRenderedCount(0);
        setShowScrollToTop(false);
        if (suggestionsPanelRef.current) {
            suggestionsPanelRef.current.scrollTop = 0;
        }
    }, [currentSortKey, products]);

    const renderBatch = () => {
        setLoading(true);
        setTimeout(() => {
            const end = Math.min(renderedCount + batchSize, sortedProducts.length);
            setRenderedCount(end);
            setLoading(false);
        }, 600);
    };

    // Throttled scroll handler for better performance
    const handleScroll = useCallback(() => {
        if (!suggestionsPanelRef.current) return;

        const { scrollTop, clientHeight, scrollHeight } = suggestionsPanelRef.current;

        // Show/hide scroll to top button (throttled to reduce re-renders)
        const shouldShowButton = scrollTop > 200;
        if (shouldShowButton !== showScrollToTop) {
            setShowScrollToTop(shouldShowButton);
        }

        // Load more products when near bottom
        if (!loading && scrollTop + clientHeight >= scrollHeight - 10 && renderedCount < sortedProducts.length) {
            renderBatch();
        }
    }, [showScrollToTop, loading, renderedCount, sortedProducts.length]);

    useEffect(() => {
        if (sortedProducts.length > 0 && renderedCount === 0) {
            renderBatch();
        }
    }, [sortedProducts.length, renderedCount]);

    // Add throttled scroll listener for better performance
    useEffect(() => {
        const scrollElement = suggestionsPanelRef.current;
        if (!scrollElement) return;

        let timeoutId: NodeJS.Timeout;
        const throttledScrollHandler = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleScroll, 16); // ~60fps throttling
        };

        scrollElement.addEventListener('scroll', throttledScrollHandler, { passive: true });

        return () => {
            scrollElement.removeEventListener('scroll', throttledScrollHandler);
            clearTimeout(timeoutId);
        };
    }, [handleScroll]);

    const scrollToTop = () => {
        if (suggestionsPanelRef.current) {
            suggestionsPanelRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    const visibleProducts = sortedProducts.slice(0, renderedCount);

    return (
        <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-xl p-4 sm:p-6 relative">
            {/* Add drag handle for mobile */}
            <div className="suggestions-handle lg:hidden"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                <span className="text-accent">Meilleures Suggestions</span>
                <span className="text-sm font-normal text-gray-400 ml-2">(depuis le Chat)</span>
            </h2>

            {/* Sorting Control */}
            <div className="flex justify-end items-center mb-4 space-x-2">
                <label htmlFor="sort-select" className="text-sm font-medium text-gray-600">Trier par:</label>
                <select
                    id="sort-select"
                    value={currentSortKey}
                    onChange={(e) => onSortChange(e.target.value as SortKey)}
                    className="p-1.5 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary transition"
                >
                    <option value="relevance">Pertinence</option>
                    <option value="price-asc">Prix: Croissant</option>
                    <option value="price-desc">Prix: Décroissant</option>
                    <option value="newest">Nouveauté</option>
                </select>
            </div>

            {/* Initial Loading Spinner */}
            {visibleProducts.length === 0 && loading && (
                <div className="flex justify-center py-10">
                    <div className="flex flex-col items-center space-y-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-primary"></div>
                        <p className="text-sm text-gray-600">Chargement des suggestions...</p>
                    </div>
                </div>
            )}

            {/* Suggestions Panel with Independent Scroll */}
            <div
                ref={suggestionsPanelRef}
                className="flex-grow overflow-y-auto space-y-4 suggestions-panel relative"
                style={{
                    maxHeight: 'calc(100vh - 300px)',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0, 0, 0, 0.1) transparent'
                }}
            >
                {visibleProducts.length === 0 && !loading ? (
                    <div className="text-center text-gray-500 py-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Vos suggestions de produits apparaîtront ici après avoir discuté avec notre assistant.
                    </div>
                ) : (
                    visibleProducts.map((product, idx) => {
                        const newBadgeHTML = product.isNew ? (
                            <span className="absolute top-1 left-1 text-xxs font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded-md shadow-lg z-10">
                                NOUVEAUTÉ
                            </span>
                        ) : '';

                        return (
                            <div key={idx} className="relative flex flex-col bg-white border border-gray-200 rounded-xl p-3 hover:shadow-xl hover:scale-[1.01] transition duration-300 transform group">
                                {/* Product Image, Name, Vendor, and Details Button */}
                                <div className="flex items-start space-x-3 mb-3">
                                    {/* Product Image Container */}
                                    <div className="relative w-16 h-16 flex-shrink-0">
                                        <img
                                            src={product.image}
                                            loading="lazy"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.onerror = null;
                                                target.src = 'https://placehold.co/64x64/9CA3AF/ffffff?text=Img';
                                            }}
                                            alt={product.name}
                                            className="w-full h-full object-cover rounded-lg border border-gray-100 shadow-md"
                                        />
                                        {newBadgeHTML}
                                    </div>

                                    <div className="flex-grow">
                                        {/* Name and Vendor */}
                                        <div className="flex items-center space-x-2">
                                            <p className="font-bold text-md text-gray-800 group-hover:text-primary transition">{product.name}</p>
                                        </div>
                                        <p className="text-sm text-gray-500">{product.vendor}</p>
                                    </div>

                                    {/* Details Button */}
                                    <div className="flex flex-col items-end flex-shrink-0 mt-[-5px]">
                                        <button
                                            onClick={() => onProductClick(product)}
                                            className="text-gray-400 hover:text-primary transition text-sm flex items-center mt-1 p-1 rounded-md hover:bg-gray-50"
                                            title="Afficher les détails du vendeur"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Détails
                                        </button>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="flex justify-end items-center mb-3 pt-2 border-t border-dashed border-gray-100">
                                    <div className="flex items-center space-x-2">
                                        <p className="font-extrabold text-2xl text-accent">{product.price}</p>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex justify-between items-center pt-3 border-t">
                                    <button
                                        onClick={() => onAddToCart(product.name)}
                                        className={`p-2 rounded-full transition shadow-sm ${favorites.has(product.name)
                                            ? 'text-red-500 bg-red-50'
                                            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                                            }`}
                                        title="Ajouter aux favoris"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={favorites.has(product.name) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={() => window.open(product.link, '_blank')}
                                        className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary hover:text-white transition-all duration-200 flex items-center space-x-1"
                                        title="Visiter le site web du vendeur"
                                    >
                                        <span>Boutique</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Feedback buttons */}
                                <div className="flex justify-end items-center gap-3 mt-2">
                                    {/* Like button */}
                                    <button
                                        onClick={() => onFeedback(product.name, 'like')}
                                        title="J'aime cette suggestion"
                                        className={`flex items-center gap-1 p-2 rounded-lg hover:bg-green-100 group transition-all duration-200 ${likedProducts.has(product.name) ? 'text-green-600' : 'text-gray-400'
                                            }`}
                                    >
                                        <svg className="w-5 h-5 transition-colors" viewBox="0 0 24 24" fill="none">
                                            <path d="M7 22V11M2 13V20C2 21.1046 2.89543 22 4 22H17.4262C18.907 22 20.1662 20.9197 20.3814 19.4562L21.4844 11.4562C21.7508 9.6389 20.3273 8 18.5292 8H15C14.4477 8 14 7.55228 14 7V4C14 2.34315 12.6569 1 11 1V1C9.34315 1 8 2.34315 8 4V4.5C8 5.88071 7.11929 7 5.73858 7V7C3.68871 7 2 8.68871 2 10.7386V13"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                className="group-hover:stroke-green-600" />
                                        </svg>
                                    </button>

                                    {/* Dislike button */}
                                    <button
                                        onClick={() => onFeedback(product.name, 'dislike')}
                                        title="Je n'aime pas cette suggestion"
                                        className={`flex items-center gap-1 p-2 rounded-lg hover:bg-red-100 group transition-all duration-200 ${dislikedProducts.has(product.name) ? 'text-red-600' : 'text-gray-400'
                                            }`}
                                    >
                                        <svg className="w-5 h-5 transition-colors" viewBox="0 0 24 24" fill="none">
                                            <path d="M17 2V13M22 11V4C22 2.89543 21.1046 2 20 2H6.57384C5.09296 2 3.83384 3.08034 3.61857 4.54376L2.51557 12.5438C2.24916 14.3611 3.67266 16 5.47082 16H9C9.55228 16 10 16.4477 10 17V20C10 21.6569 11.3431 23 13 23V23C14.6569 23 16 21.6569 16 20V19.5C16 18.1193 16.8807 17 18.2614 17V17C20.3113 17 22 15.3113 22 13.2614V11"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                className="group-hover:stroke-red-600" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Loading Spinner - positioned at bottom when loading more */}
                {loading && (
                    <div className="flex justify-center py-6">
                        <div className="flex flex-col items-center space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-primary"></div>
                            <p className="text-sm text-gray-500">Chargement de plus de suggestions...</p>
                        </div>
                    </div>
                )}

                {/* End of results indicator */}
                {renderedCount >= sortedProducts.length && sortedProducts.length > 0 && (
                    <div className="text-center text-gray-400 py-4 text-sm">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="h-px bg-gray-300 flex-1"></div>
                            <span>Toutes les suggestions chargées</span>
                            <div className="h-px bg-gray-300 flex-1"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Scroll to Top Button - Optimized positioning */}
            <div className="absolute bottom-4 right-4 z-30">
                <button
                    onClick={scrollToTop}
                    className={`bg-primary text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 transition-all duration-200 flex items-center justify-center group ${showScrollToTop
                        ? 'opacity-100 transform translate-y-0 pointer-events-auto'
                        : 'opacity-0 transform translate-y-2 pointer-events-none'
                        }`}
                    title="Retour en haut"
                    style={{
                        willChange: 'transform, opacity',
                        transform: showScrollToTop ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out'
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 group-hover:scale-110 transition-transform duration-150"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
