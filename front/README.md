# Touskié Chat - Next.js Version

This is a Next.js conversion of the original HTML/CSS/JS chat application. The application has been completely restructured into a modern React-based architecture with TypeScript support.

## 🚀 Features

- **Modern React Architecture**: Converted from vanilla HTML/JS to Next.js with React components
- **TypeScript Support**: Full type safety with interfaces and proper typing
- **Component-Based Structure**: Modular components for better maintainability
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **State Management**: React hooks for managing chat state, favorites, and user interactions
- **Interactive Chat**: Real-time chat interface with AI assistant responses
- **Product Suggestions**: Dynamic product filtering and sorting
- **Modal System**: Product detail modals with vendor information
- **Feedback System**: Like/dislike functionality for product suggestions

## 📁 Project Structure

```
touskiechat/
├── app/
│   ├── globals.css          # Global styles and custom CSS
│   ├── layout.tsx           # Root layout with Inter font
│   └── page.tsx             # Main page component
├── components/
│   ├── Header.tsx           # Header with logo and search
│   ├── ChatInterface.tsx    # Chat input and message display
│   ├── SuggestionsPanel.tsx # Product suggestions with sorting
│   ├── ProductModal.tsx     # Product detail modal
│   └── LoadingOverlay.tsx   # Loading spinner overlay
├── data/
│   └── mockProducts.ts      # Mock product data
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   └── productUtils.ts      # Utility functions for products
└── package.json
```

## 🛠️ Key Improvements

### 1. **Component Architecture**
- **Header**: Logo, search bar, and navigation icons
- **ChatInterface**: Message display and input handling
- **SuggestionsPanel**: Product cards with lazy loading
- **ProductModal**: Detailed product information
- **LoadingOverlay**: Loading states

### 2. **TypeScript Integration**
- `Product` interface for product data structure
- `ChatMessage` interface for chat messages
- `SortKey` type for sorting options
- `ChatState` interface for application state

### 3. **State Management**
- React hooks (`useState`, `useEffect`, `useRef`)
- Centralized state management in main page component
- Proper state updates for favorites, likes, and chat messages

### 4. **Responsive Design**
- Mobile-first CSS approach
- Touch-friendly interactions
- Responsive grid layouts
- Mobile-specific modal behaviors

### 5. **Performance Optimizations**
- Lazy loading for product suggestions
- Image error handling with fallbacks
- Efficient re-rendering with proper React patterns
- Scroll-based pagination

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom CSS Variables**: Brand colors and custom properties
- **Responsive Design**: Mobile, tablet, and desktop layouts
- **Custom Scrollbars**: Styled scrollbars for better UX
- **Animations**: Smooth transitions and hover effects

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   cd touskiechat
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Browser**: Navigate to `http://localhost:3000`

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server

## 📱 Mobile Features

- **Touch Interactions**: Swipe gestures for mobile suggestions panel
- **Responsive Modals**: Mobile-optimized product detail modals
- **Touch-Friendly Buttons**: Larger touch targets for mobile
- **Mobile Navigation**: Collapsible suggestions panel

## 🎯 Functionality

### Chat System
- Real-time message display
- AI assistant responses based on user queries
- Message history with timestamps
- Clear chat functionality

### Product Management
- Dynamic product filtering based on search queries
- Multiple sorting options (relevance, price, newest)
- Lazy loading with pagination
- Product detail modals with vendor information

### User Interactions
- Add/remove products from favorites
- Like/dislike product suggestions
- Visit vendor stores
- Language toggle (placeholder)

## 🔄 Migration Notes

The original HTML/CSS/JS application has been completely converted to Next.js with the following changes:

1. **HTML → React Components**: All HTML elements converted to React components
2. **Vanilla JS → React Hooks**: JavaScript functionality converted to React state management
3. **Inline CSS → Tailwind CSS**: Styles converted to utility classes with custom CSS variables
4. **Global Variables → React State**: Global JavaScript variables converted to React state
5. **Event Listeners → React Events**: DOM event listeners converted to React event handlers

## 🎨 Brand Identity

- **Primary Color**: Emerald Green (#059669)
- **Accent Color**: Amber Yellow (#F59E0B)
- **User Bubble**: Indigo Blue (#4F46E5)
- **Font**: Inter (Google Fonts)
- **Logo**: Custom SVG with network nodes and magnifying glass

## 📈 Future Enhancements

- API integration for real product data
- User authentication system
- Shopping cart functionality
- Multi-language support
- Real-time chat with WebSocket
- Advanced search filters
- Product recommendations based on user behavior