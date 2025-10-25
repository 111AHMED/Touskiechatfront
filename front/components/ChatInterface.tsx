'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Product } from '../types';

interface ChatInterfaceProps {
    onSendMessageAction: (message: string) => void;
    messages: ChatMessage[];
    isLoading: boolean;
    onProductClickAction: (product: Product) => void;
    onAddToCartAction: (productName: string) => void;
    onFeedbackAction: (productName: string, type: 'like' | 'dislike') => void;
    favorites: string[];
    likedProducts: string[];
    dislikedProducts: string[];
}

export default function ChatInterface({
    onSendMessageAction,
    messages,
    isLoading,
    onProductClickAction,
    onAddToCartAction,
    onFeedbackAction,
    favorites,
    likedProducts,
    dislikedProducts
}: ChatInterfaceProps) {
    const [inputValue, setInputValue] = useState('');
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedValue = inputValue.trim();
        if (!trimmedValue) return;

        onSendMessageAction(trimmedValue);
        setInputValue('');
    };

    const handleClearChat = () => {
        // This would be handled by the parent component
        window.location.reload(); // Simple reload for now
    };

    // Component for product suggestion cards in chat
    const ProductSuggestionCards = ({ products }: { products: Product[] }) => {
        const scrollRef = useRef<HTMLDivElement | null>(null);
        const [canScrollLeft, setCanScrollLeft] = useState(false);
        const [canScrollRight, setCanScrollRight] = useState(false);

        useEffect(() => {
            const el = scrollRef.current;
            if (!el) return;
            const update = () => {
                setCanScrollLeft(el.scrollLeft > 5);
                setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
            };
            update();
            el.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update);
            return () => {
                el.removeEventListener('scroll', update);
                window.removeEventListener('resize', update);
            };
        }, [products]);

        if (!products || products.length === 0) return null;

        const scrollBy = (distance: number) => {
            const el = scrollRef.current;
            if (!el) return;
            el.scrollTo({ left: el.scrollLeft + distance, behavior: 'smooth' });
        };

        const cardWidth = 256; // approx width of each card (w-64)
        const handleLeft = () => scrollBy(-cardWidth * 1.25);
        const handleRight = () => scrollBy(cardWidth * 1.25);

        const onKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handleLeft();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleRight();
            }
        };

        return (
            <div className="mt-3 relative">
                {/* Left arrow */}
                <button
                    aria-hidden={!canScrollLeft}
                    aria-label="Précédent"
                    onClick={handleLeft}
                    className={`hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition ${canScrollLeft ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
                    title="Précédent"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Right arrow */}
                <button
                    aria-hidden={!canScrollRight}
                    aria-label="Suivant"
                    onClick={handleRight}
                    className={`hidden md:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition ${canScrollRight ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
                    title="Suivant"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                <div
                    ref={scrollRef}
                    tabIndex={0}
                    onKeyDown={onKeyDown}
                    className="flex overflow-x-auto space-x-3 pb-2 suggestions-scroll focus:outline-none"
                >
                    {products.slice(0, 4).map((product, idx) => {
                        const newBadgeHTML = product.isNew ? (
                            <span className="absolute top-1 left-1 text-xxs font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded-md shadow-lg z-10">
                                NOUVEAUTÉ
                            </span>
                        ) : '';

                        return (
                            <div key={idx} className="flex-shrink-0 w-64 bg-white border border-gray-200 rounded-xl p-3 shadow-sm suggestion-card">
                                {/* Product Image Container */}
                                <div className="relative w-full h-20 mb-2">
                                    <img
                                        src={product.image}
                                        loading="lazy"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = 'https://placehold.co/80x80/9CA3AF/ffffff?text=Img';
                                        }}
                                        alt={product.name}
                                        className="w-full h-full object-cover rounded-lg border border-gray-100 shadow-md"
                                    />
                                    {newBadgeHTML}
                                </div>

                                {/* Product Details */}
                                <div className="space-y-1">
                                    <p className="font-bold text-sm text-gray-800 truncate">{product.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{product.vendor}</p>
                                    <p className="font-extrabold text-lg text-accent">{product.price}</p>
                                </div>

                                {/* Action buttons */}
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => onProductClickAction(product)}
                                        className="text-xs font-medium text-primary hover:underline"
                                    >
                                        Voir détails
                                    </button>

                                    <button
                                        onClick={() => onAddToCartAction(product.name)}
                                        className={`p-1.5 rounded-full transition shadow-sm ${favorites.includes(product.name) ? 'text-red-500 bg-red-50' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'}`}
                                        title="Ajouter aux favoris"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={favorites.includes(product.name) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={() => window.open(product.link, '_blank')}
                                        className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700 hover:bg-primary hover:text-white transition-all duration-200 flex items-center space-x-1"
                                        title="Visiter le site web du vendeur"
                                    >
                                        <span>Visiter</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Feedback buttons */}
                                <div className="flex justify-end items-center gap-2 mt-1">
                                    {/* Like button */}
                                    <button
                                        onClick={() => onFeedbackAction(product.name, 'like')}
                                        title="J'aime cette suggestion"
                                        className={`p-1 rounded hover:bg-green-100 transition-all duration-200 ${likedProducts.includes(product.name) ? 'text-green-600' : 'text-gray-400'
                                            }`}
                                    >
                                        <svg className="w-3 h-3 transition-colors" viewBox="0 0 24 24" fill="none">
                                            <path d="M7 22V11M2 13V20C2 21.1046 2.89543 22 4 22H17.4262C18.907 22 20.1662 20.9197 20.3814 19.4562L21.4844 11.4562C21.7508 9.6389 20.3273 8 18.5292 8H15C14.4477 8 14 7.55228 14 7V4C14 2.34315 12.6569 1 11 1V1C9.34315 1 8 2.34315 8 4V4.5C8 5.88071 7.11929 7 5.73858 7V7C3.68871 7 2 8.68871 2 10.7386V13"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                className="hover:stroke-green-600" />
                                        </svg>
                                    </button>

                                    {/* Dislike button */}
                                    <button
                                        onClick={() => onFeedbackAction(product.name, 'dislike')}
                                        title="Je n'aime pas cette suggestion"
                                        className={`p-1 rounded hover:bg-red-100 transition-all duration-200 ${dislikedProducts.includes(product.name) ? 'text-red-600' : 'text-gray-400'
                                            }`}
                                    >
                                        <svg className="w-3 h-3 transition-colors" viewBox="0 0 24 24" fill="none">
                                            <path d="M17 2V13M22 11V4C22 2.89543 21.1046 2 20 2H6.57384C5.09296 2 3.83384 3.08034 3.61857 4.54376L2.51557 12.5438C2.24916 14.3611 3.67266 16 5.47082 16H9C9.55228 16 10 16.4477 10 17V20C10 21.6569 11.3431 23 13 23V23C14.6569 23 16 21.6569 16 20V19.5C16 18.1193 16.8807 17 18.2614 17V17C20.3113 17 22 15.3113 22 13.2614V11"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                className="hover:stroke-red-600" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Arrow indicator to guide users to suggestions panel */}
                    {products.length > 4 && (
                        <div className="flex-shrink-0 w-16 flex items-center justify-center">
                            <div className="flex flex-col items-center space-y-2 text-gray-400">
                                <div className="bg-gray-100 rounded-full p-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                <p className="text-xs text-center leading-tight">
                                    Plus de suggestions<br />
                                    dans le panneau
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="lg:col-span-3 flex flex-col bg-white rounded-xl shadow-xl p-4 sm:p-6 mb-6 lg:mb-0 lg:mr-4 lg:border-r lg:border-gray-100 chat-container relative h-full min-h-0">
            {/* Chat Header (Title + Clear Button) */}
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-2xl font-semibold text-gray-800">
                    <span className="text-primary">Touskié</span> Assistant Chat
                </h2>
                {/* Clear Chat Button for usability */}
                <button
                    onClick={handleClearChat}
                    className="text-gray-500 hover:text-red-600 transition duration-150 flex items-center text-sm p-1 rounded-md hover:bg-red-50"
                    title="Démarrer une nouvelle conversation"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Vider le Chat
                </button>
            </div>

            {/* Chat History Area (scrollable, with input fixed at bottom) */}
            <div
                ref={chatHistoryRef}
                className="flex-grow overflow-y-auto space-y-4 pr-2 mb-2 chat-history h-full min-h-0"
            >
                {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg ${message.isUser ? 'bg-user-bubble text-white' : 'bg-gray-100 text-gray-700'}
              p-3 rounded-xl ${message.isUser ? 'rounded-br-none' : 'rounded-tl-none'} shadow-sm message-animate`}>
                            {!message.isUser && (
                                <p className="font-semibold text-primary/90">Touskié Assistant</p>
                            )}
                            <p>{message.text}</p>
                            {!message.isUser && message.suggestions && message.suggestions.length > 0 && (
                                <ProductSuggestionCards products={message.suggestions} />
                            )}
                        </div>
                    </div>
                ))}

                {/* Loading indicator in chat */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-lg bg-gray-100 p-3 rounded-xl rounded-tl-none shadow-sm text-gray-700">
                            <p className="font-semibold text-primary/90 mb-2">Touskié Assistant</p>
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                                <p className="text-sm">Recherche en cours...</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Input Form - fixed at bottom without expanding on messages */}
            <form
                onSubmit={handleSubmit}
                className="flex space-x-3 items-center bg-white py-2 px-0 border-t border-gray-100 z-10 sticky-input-shadow"
                style={{
                    position: 'sticky',
                    bottom: 0,
                    alignSelf: 'stretch'
                }}
            >
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Rechercher des produits ou poser une question..."
                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-150 text-gray-800"
                    required
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary text-white p-3 rounded-lg font-medium hover:bg-emerald-700 transition duration-150 flex items-center justify-center disabled:opacity-50"
                    style={{ minWidth: 56 }}
                >
                    {/* Enhanced Send Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="hidden sm:inline">Envoyer</span>
                </button>
            </form>
        </div>
    );
}
