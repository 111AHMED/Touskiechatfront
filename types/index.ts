export interface Product {
    name: string;
    price: string;
    numericPrice: number;
    vendor: string;
    // Primary image (kept for backward compatibility)
    image: string;
    // Additional images for carousel
    images?: string[];
    link: string;
    isNew: boolean;
    address: string;
    phone: string;
    // Optional longer description and rating (0-5)
    description?: string;
    rating?: number;
    // Optional key/value specs (e.g., material, dimensions)
    specs?: { [key: string]: string };
}

export interface ChatMessage {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    suggestions?: Product[];
}

export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'newest';

export interface ChatState {
    messages: ChatMessage[];
    currentSearchQuery: string;
    currentSortKey: SortKey;
    favorites: Set<string>;
    likedProducts: Set<string>;
    dislikedProducts: Set<string>;
    isLoading: boolean;
    showSuggestions: boolean;
}
