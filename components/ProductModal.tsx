'use client';

import { Product } from '../types';

interface ProductModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (productName: string) => void;
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
    if (!isOpen || !product) return null;

    const handleAddToCart = () => {
        onAddToCart(product.name);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg modal-content transform scale-100 transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Product Image - Responsive height */}
                <div className="relative w-full h-48 sm:h-64 mb-6 rounded-xl overflow-hidden">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover shadow-lg transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>

                {/* Close Button - Repositioned */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-red-500 transition bg-black/20 p-2 rounded-full backdrop-blur-sm"
                    title="Fermer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Product Details - Mobile friendly spacing */}
                <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                    {/* Product Name and Price */}
                    <div className="border-b pb-4">
                        <h3 className="text-2xl font-bold text-primary mb-2">{product.name}</h3>
                        <p className="text-3xl font-extrabold text-accent">{product.price}</p>
                    </div>

                    {/* Vendor Information */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Informations Vendeur</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="font-medium text-gray-600">Nom du Vendeur</p>
                                <p className="text-gray-800">{product.vendor}</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-600">Téléphone</p>
                                <p className="text-gray-800">{product.phone}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="font-medium text-gray-600">Adresse</p>
                                <p className="text-gray-800">{product.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-primary text-white p-4 rounded-xl font-medium hover:bg-emerald-700 transition duration-300 flex items-center justify-center group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transform group-hover:scale-110 transition" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.375 6.875c.06.301.299.54.6.6l1.375.253 1.375.254.6.6h5.815c.321 0 .618-.21.71-.512l2-7A1 1 0 0017 3H5.257l-.374-1.5H3zM16.5 10.5a.5.5 0 01-1 0 .5.5 0 011 0zm-7-2a.5.5 0 01-1 0 .5.5 0 011 0z" />
                        </svg>
                        Ajouter au Panier
                    </button>
                </div>
            </div>
        </div>
    );
}
