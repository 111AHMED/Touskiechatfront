'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import ChatInterface from '../components/ChatInterface';
import SuggestionsPanel from '../components/SuggestionsPanel';
import ProductModal from '../components/ProductModal';
import ToastContainer, { pushToast } from '../components/Toast';
import { ChatMessage, Product, SortKey, ChatState } from '../types';
import { mockProducts } from '../data/mockProducts';
import { filterProducts, generateBotResponse } from '../utils/productUtils';
import { addGuestFavorite, removeGuestFavorite, getGuestFavorites } from '../utils/favorites';
import { on } from '../utils/events';

export default function Home() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [
      {
        id: '1',
        text: "Bonjour ! Bienvenue sur TOUSKIE.tn, votre marketplace multi-vendeurs. Je suis là pour vous aider à trouver le produit parfait. Dites-moi ce que vous cherchez !",
        isUser: false,
        timestamp: new Date()
      }
    ],
    currentSearchQuery: '',
    currentSortKey: 'relevance',
    favorites: new Set(),
    likedProducts: new Set(),
    dislikedProducts: new Set(),
    isLoading: false,
    showSuggestions: false
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    const off = on('openProduct', (p: Product) => {
      setSelectedProduct(p);
      setIsModalOpen(true);
    });
    return off;
  }, []);

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      currentSearchQuery: message
    }));

    // Simulate API delay
    setTimeout(() => {
      const botResponse = generateBotResponse(message);
      const filtered = filterProducts(mockProducts, message);

      // Simulate API call that returns more products for suggestions panel
      const apiProducts = [...filtered, ...mockProducts.filter(p => !filtered.includes(p))];

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
        suggestions: filtered.slice(0, 4) // Only 4 for chat cards
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isLoading: false,
        showSuggestions: true
      }));

      // Update suggestions panel with more products (simulating API response)
      setFilteredProducts(apiProducts);
    }, 2000);
  };

  const handleSortChange = (sortKey: SortKey) => {
    setChatState(prev => ({
      ...prev,
      currentSortKey: sortKey
    }));
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (productName: string) => {
    const newFavorites = new Set(chatState.favorites);
    if (newFavorites.has(productName)) {
      newFavorites.delete(productName);
      // remove from guest favorites storage as well
      removeGuestFavorite(productName);
      pushToast(`"${productName}" retiré des favoris`);
    } else {
      newFavorites.add(productName);
      // add to guest favorites storage
      addGuestFavorite(productName);
      pushToast(`"${productName}" ajouté aux favoris`);
    }

    setChatState(prev => ({
      ...prev,
      favorites: newFavorites
    }));
  };

  const handleFeedback = (productName: string, type: 'like' | 'dislike') => {
    const newLikedProducts = new Set(chatState.likedProducts);
    const newDislikedProducts = new Set(chatState.dislikedProducts);

    if (type === 'like') {
      if (newLikedProducts.has(productName)) {
        newLikedProducts.delete(productName);
      } else {
        newLikedProducts.add(productName);
        newDislikedProducts.delete(productName);
      }
    } else {
      if (newDislikedProducts.has(productName)) {
        newDislikedProducts.delete(productName);
      } else {
        newDislikedProducts.add(productName);
        newLikedProducts.delete(productName);
      }
    }

    setChatState(prev => ({
      ...prev,
      likedProducts: newLikedProducts,
      dislikedProducts: newDislikedProducts
    }));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen antialiased">
      <ToastContainer />
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToCart={handleAddToCart}
      />

      <Header />

      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mt-6 pb-12">
        <div className="lg:grid lg:grid-cols-5 lg:gap-8 min-h-[500px] lg:h-[75vh]">
          <ChatInterface
            onSendMessage={handleSendMessage}
            messages={chatState.messages}
            isLoading={chatState.isLoading}
            onProductClick={handleProductClick}
            onAddToCart={handleAddToCart}
            onFeedback={handleFeedback}
            favorites={chatState.favorites}
            likedProducts={chatState.likedProducts}
            dislikedProducts={chatState.dislikedProducts}
          />

          <SuggestionsPanel
            products={filteredProducts.length > 0 ? filteredProducts : mockProducts}
            currentSortKey={chatState.currentSortKey}
            onSortChangeAction={handleSortChange}
            onProductClickAction={handleProductClick}
            onAddToCartAction={handleAddToCart}
            onFeedbackAction={handleFeedback}
            likedProducts={chatState.likedProducts}
            dislikedProducts={chatState.dislikedProducts}
            favorites={chatState.favorites}
          />
        </div>
      </main>
    </div>
  );
}
