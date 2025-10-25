import { Product, SortKey } from '../types';

/**
 * Sorts the given array of products based on the sort key.
 * @param products Array of products to sort
 * @param sortKey Sort criteria
 * @returns Sorted products array
 */
export const sortProducts = (products: Product[], sortKey: SortKey): Product[] => {
    // Create a shallow copy to avoid modifying the original array in place
    const sortedProducts = [...products];

    switch (sortKey) {
        case 'price-asc':
            // Sort by numeric price ascending
            sortedProducts.sort((a, b) => a.numericPrice - b.numericPrice);
            break;
        case 'price-desc':
            // Sort by numeric price descending
            sortedProducts.sort((a, b) => b.numericPrice - a.numericPrice);
            break;
        case 'newest':
            // Sort by 'isNew' flag (true first), then by name as a tie-breaker
            sortedProducts.sort((a, b) => {
                if (a.isNew && !b.isNew) return -1;
                if (!a.isNew && b.isNew) return 1;
                return a.name.localeCompare(b.name);
            });
            break;
        case 'relevance':
        default:
            // Maintain the current order (which is based on the mock data's 'relevance' order)
            // If implementing real search, this would be the score order.
            break;
    }
    return sortedProducts;
};

/**
 * Filters products based on search query
 * @param products Array of products to filter
 * @param query Search query string
 * @returns Filtered products array
 */
export const filterProducts = (products: Product[], query: string): Product[] => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('oil') || lowerQuery.includes('food') || lowerQuery.includes('huile') || lowerQuery.includes('nourriture') || lowerQuery.includes('épice') || lowerQuery.includes('datte')) {
        // Food/Grocery
        return products.filter(p =>
            p.name.includes('Olive') || p.name.includes('Saffron') || p.name.includes('Huile') || p.name.includes('Épices') || p.name.includes('Dattes')
        );
    } else if (lowerQuery.includes('bag') || lowerQuery.includes('fashion') || lowerQuery.includes('sac') || lowerQuery.includes('mode') || lowerQuery.includes('bijoux') || lowerQuery.includes('t-shirt')) {
        // Fashion/Apparel/Accessories
        return products.filter(p =>
            p.name.includes('Bag') || p.name.includes('Cuir') || p.name.includes('Bijoux') || p.name.includes('T-shirt')
        );
    } else if (lowerQuery.includes('tech') || lowerQuery.includes('smart') || lowerQuery.includes('technologie') || lowerQuery.includes('montre')) {
        // Tech
        return products.filter(p =>
            p.name.includes('Smartwatch') || p.name.includes('Montre') || p.name.includes('Z20 Pro')
        );
    } else if (lowerQuery.includes('tapis') || lowerQuery.includes('decor') || lowerQuery.includes('poterie') || lowerQuery.includes('maison')) {
        // Home/Decor
        return products.filter(p =>
            p.name.includes('Tapis') || p.name.includes('Poterie')
        );
    } else {
        // Default/General query results (No initial filtering if query is generic or unknown)
        return products;
    }
};

/**
 * Generates bot response based on user query
 * @param query User's search query
 * @returns Bot response string
 */
export const generateBotResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('bonjour')) {
        return "Ahlan ! Bonjour ! Je suis l'Assistant Touskié, prêt à vous aider à naviguer dans notre boutique multi-vendeurs. Quel type de produits vous intéresse aujourd'hui ?";
    } else if (lowerQuery.includes('oil') || lowerQuery.includes('food') || lowerQuery.includes('nourriture') || lowerQuery.includes('épice') || lowerQuery.includes('datte')) {
        return "Excellente idée ! J'ai immédiatement filtré et mis à jour le panneau de suggestions avec des produits alimentaires (comme nos nouvelles Dattes Deglet Nour) et d'épicerie de qualité supérieure de nos fournisseurs locaux certifiés. Que pensez-vous de cette sélection ?";
    } else if (lowerQuery.includes('bag') || lowerQuery.includes('fashion') || lowerQuery.includes('sac') || lowerQuery.includes('mode') || lowerQuery.includes('bijoux') || lowerQuery.includes('t-shirt')) {
        return "Nos artisans tunisiens offrent de superbes accessoires et vêtements faits main ! J'ai affiché les meilleurs choix de cuir, bijoux et textile (comme nos nouveaux T-shirts) dans le panneau de suggestions. Faites-moi savoir si vous avez besoin d'un autre style !";
    } else if (lowerQuery.includes('tapis') || lowerQuery.includes('decor') || lowerQuery.includes('poterie') || lowerQuery.includes('maison')) {
        return "Pour la maison et la décoration, nous avons de magnifiques articles ! Le panneau de suggestions affiche maintenant nos choix de Poterie et de Tapis de Kairouan. Comment puis-je vous aider davantage ?";
    } else {
        return `Compris. J'ai lancé une recherche générale de produits liés à "${query}". Veuillez consulter le panneau des meilleures suggestions pour les meilleures recommandations !`;
    }
};
