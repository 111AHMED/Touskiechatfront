"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthProvider';
import SearchModal from './SearchModal';

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const [showSearch, setShowSearch] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showAlertsModal, setShowAlertsModal] = useState(false);
    // no dropdown: clicking profile goes directly to account when connected
    const { user, refreshSession } = useAuth();

    // no dropdown click-outside handling needed

    // Close modals on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowAuthModal(false);
                setShowAlertsModal(false);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const handleGoogleSignIn = () => {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        // Build frontend callback URL (where FastAPI should redirect after successful auth)
        const frontendCallback = (process.env.NEXT_PUBLIC_FRONTEND_CALLBACK || window.location.origin + '/auth/callback');
        // Backend route expects /api/v1/auth/login/google
        const oauthUrl = `${base}/api/v1/auth/login/google?redirect_uri=${encodeURIComponent(frontendCallback)}`;
        // Redirect to FastAPI OAuth start endpoint
        window.location.href = oauthUrl;
    };

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

                        {/* Profile Icon — opens modal */}
                        <div className="relative">
                            <button
                                className="text-gray-600 hover:text-accent transition duration-150 p-1.5 rounded-full hover:bg-gray-100"
                                title="Profil Utilisateur"
                                onClick={() => {
                                    if (user) router.push('/account');
                                    else setShowAuthModal(true);
                                }}
                                aria-haspopup={user ? 'false' : 'dialog'}
                            >
                                {user && user.picture ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.picture} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center">
                    {/* overlay */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50"
                        onClick={() => setShowAuthModal(false)}
                        aria-hidden
                    />

                    {/* modal content */}
                    <div className="relative z-50 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
                        <div className="flex justify-between items-start px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold">Bienvenue sur Touskie !</h3>
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Fermer"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-gray-600 mb-4">Connectez-vous avec sécurité</p>

                            <button
                                onClick={handleGoogleSignIn}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                    <g>
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C36.68 2.36 30.74 0 24 0 14.82 0 6.73 5.06 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z" />
                                        <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.59C43.98 37.13 46.1 31.3 46.1 24.55z" />
                                        <path fill="#FBBC05" d="M10.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.7 16.36 0 20.09 0 24s.7 7.64 2.69 12.44l7.98-6.2z" />
                                        <path fill="#4285F4" d="M24 48c6.48 0 11.93-2.15 15.9-5.85l-7.19-5.59c-2.01 1.35-4.59 2.14-8.71 2.14-6.38 0-11.87-3.63-13.33-8.79l-7.98 6.2C6.73 42.94 14.82 48 24 48z" />
                                    </g>
                                </svg>
                                <span>Se connecter avec Google</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts Modal (dev / placeholder) */}
            {showAlertsModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowAlertsModal(false)} aria-hidden />
                    <div className="relative z-50 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
                        <div className="flex justify-between items-start px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold">Alertes de prix</h3>
                            <button onClick={() => setShowAlertsModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-gray-600">Vous n'avez pas encore d'alertes. Cliquez sur un produit pour en créer une.</p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
