export interface Product {
    name: string;
    price: string;
    numericPrice: number;
    vendor: string;
    image: string;
    link: string;
    isNew: boolean;
    address: string;
    phone: string;
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
