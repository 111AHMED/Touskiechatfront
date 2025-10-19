"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchModal from './SearchModal';

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const [showSearch, setShowSearch] = useState(false);

    const handleLanguageToggle = () => {
        console.log("Language toggle initiated (FR/AR). This would switch the application's text.");
        alert("Alerte de basculement de langue ! Dans une vraie application, la langue passerait maintenant à l'Arabe.");
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-20">
            <SearchModal open={showSearch} onCloseAction={() => setShowSearch(false)} />
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    {/* Logo */}
                    <h1 className="brand" aria-label="TOUSKIE.tn - Marketplace Tunisienne">
                        {/* Emblem: circle + AI-search (network nodes + magnifying glass) */}
                        <svg className="brand-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
                            <defs>
                                <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                                    <stop offset="0" stopColor="#06b6a4" />
                                    <stop offset="1" stopColor="#059669" />
                                </linearGradient>
                                {/* small glow for nodes */}
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="1.2" result="b" />
                                    <feMerge>
                                        <feMergeNode in="b" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* background circle */}
                            <circle cx="32" cy="32" r="30" fill="url(#g1)" opacity="0.98" />

                            {/* stylized network (AI) - left side */}
                            <g stroke="#ffffff" strokeOpacity="0.95" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="30" x2="30" y2="24" />
                                <line x1="22" y1="30" x2="30" y2="36" />
                                <line x1="30" y1="24" x2="36" y2="28" />
                            </g>

                            {/* network nodes */}
                            <circle cx="22" cy="30" r="2.2" fill="#ffffff" filter="url(#glow)" />
                            <circle cx="30" cy="24" r="2.4" fill="#f59e0b" filter="url(#glow)" />
                            <circle cx="30" cy="36" r="2.2" fill="#f59e0b" filter="url(#glow)" />
                            <circle cx="36" cy="28" r="2.0" fill="#ffffff" />

                            {/* magnifying glass (search) - right side, overlapping network */}
                            <g transform="translate(6,6)">
                                <circle cx="38" cy="38" r="7.2" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="44" y1="44" x2="52" y2="52" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                                {/* small accent node inside lens to suggest "insight" */}
                                <circle cx="36" cy="36" r="1.6" fill="#f59e0b" />
                            </g>
                        </svg>
                        <span className="brand-wordmark">
                            <span className="primary">TOUSKIE</span><span className="accent">.tn</span>
                            <span className="brand-tag">Tout. Tunisien. IA pour e‑commerce</span>
                        </span>
                        <span className="sr-only">TOUSKIE.tn — marketplace multi‑vendeurs (Tunisian AI for e‑commerce)</span>
                    </h1>

                    {/* Global Site Search - Full width on mobile */}
                    <div className="w-full sm:max-w-xl">
                        <div onClick={() => setShowSearch(true)} className="w-full">
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setShowSearch(true)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent transition text-sm"
                                aria-label="Recherche Globale"
                                readOnly={true}
                            />
                        </div>
                    </div>

                    {/* Icons and Language - Horizontal scroll on very small screens */}
                    <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
                        {/* Language Toggle (Tunisia/Arabic) */}
                        <button
                            onClick={handleLanguageToggle}
                            className="flex items-center text-sm font-medium text-gray-600 hover:text-accent transition duration-150 p-2 rounded-lg hover:bg-gray-100"
                            title="Changer la langue en Arabe"
                        >
                            <span role="img" aria-label="Drapeau Tunisien" className="text-xl mr-1">🇹🇳</span>
                            AR
                        </button>

                        {/* Cart Icon */}
                        <button
                            onClick={() => router.push('/favorites')}
                            className="text-gray-600 hover:text-accent transition duration-150 p-2 rounded-full hover:bg-gray-100"
                            title="Favoris"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>

                        {/* Profile Icon */}
                        <button
                            className="text-gray-600 hover:text-accent transition duration-150 p-2 rounded-full hover:bg-gray-100"
                            title="Profil Utilisateur"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
