"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../types';
import { addGuestFavorite, removeGuestFavorite, getGuestFavorites } from '../utils/favorites';

interface ProductModalProps {
    product: Product | null;
    isOpen: boolean;
    onCloseAction: () => void;
    onAddToCartAction: (productName: string) => void;
}

const TUNISIAN_STATES = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Le Kef', 'Mahdia', 'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
];

export default function ProductModal({ product, isOpen, onCloseAction, onAddToCartAction }: ProductModalProps) {
    if (!isOpen || !product) return null;

    // Image carousel state
    const images = useMemo(() => {
        const imgs = product.images && product.images.length > 0 ? product.images : [product.image];
        // ensure unique
        return Array.from(new Set(imgs));
    }, [product]);

    const [index, setIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const autoplayRef = useRef<number | null>(null);
    const touchStartX = useRef<number | null>(null);
    const touchDelta = useRef<number>(0);
    const [isPaused, setIsPaused] = useState(false);
    const [zoomOpen, setZoomOpen] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    // Autoplay every 3.5s
    useEffect(() => {
        // clear existing
        if (autoplayRef.current) {
            window.clearInterval(autoplayRef.current);
        }
        if (!isPaused) {
            autoplayRef.current = window.setInterval(() => {
                setIndex((i) => (i + 1) % images.length);
            }, 3500);
        }

        return () => {
            if (autoplayRef.current) window.clearInterval(autoplayRef.current);
        };
    }, [images.length, isPaused]);

    // Pause autoplay while zoom overlay is open
    useEffect(() => {
        if (zoomOpen) setIsPaused(true);
        else setIsPaused(false);
    }, [zoomOpen]);

    // Scroll carousel into view on index change
    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;
        const child = el.children[index] as HTMLElement | undefined;
        if (child) {
            child.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }, [index]);

    const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
    const next = () => setIndex((i) => (i + 1) % images.length);

    // Touch handlers for mobile swipe and pause
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        setIsPaused(true);
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current == null) return;
        touchDelta.current = e.touches[0].clientX - touchStartX.current;
    };
    const onTouchEnd = () => {
        const delta = touchDelta.current;
        touchStartX.current = null;
        touchDelta.current = 0;
        setIsPaused(false);
        if (delta > 40) {
            prev();
        } else if (delta < -40) {
            next();
        }
    };

    // Rating
    const rating = product.rating ?? 0;

    // Order form (user info stored in localStorage)
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userAddress, setUserAddress] = useState('');
    const [userState, setUserState] = useState(TUNISIAN_STATES[0]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const data = localStorage.getItem('touskie_user');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                setUserName(parsed.name || '');
                setUserPhone(parsed.phone || '');
                setUserAddress(parsed.address || '');
                setUserState(parsed.state || TUNISIAN_STATES[0]);
            } catch {
                // ignore
            }
        }
    }, []);

    // init favorite from guest favorites
    useEffect(() => {
        try {
            const favs = getGuestFavorites();
            setIsFavorite(favs.includes(product.name));
        } catch {
            setIsFavorite(false);
        }
    }, [product.name]);

    const saveUser = () => {
        const payload = { name: userName, phone: userPhone, address: userAddress, state: userState };
        localStorage.setItem('touskie_user', JSON.stringify(payload));
    };

    const handleOrder = () => {
        const newErrors: { [key: string]: string } = {};
        if (!userName.trim()) newErrors.name = 'Le nom est requis';
        if (!userPhone.trim() || !/^\+?\d{6,15}$/.test(userPhone.trim())) newErrors.phone = 'Numéro invalide (ex: +216XXXXXXXX)';
        if (!userAddress.trim()) newErrors.address = 'L\'adresse est requise';
        if (!userState.trim()) newErrors.state = 'La gouvernorat est requise';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        saveUser();
        // Simulate ordering flow (could open checkout or post to backend)
        // Replace this with real API call
        // For now show minimal feedback
        setTimeout(() => {
            setErrors({});
            onCloseAction();
            // Optionally push a toast (if available) - leaving simple alert for now
            alert('Votre commande a été reçue. Nous vous contacterons bientôt.');
        }, 400);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={onCloseAction}>
            <div className="absolute inset-0 bg-black/40" />

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl modal-content transform scale-100 transition-all duration-300 relative z-10 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                {/* Close */}
                <button onClick={onCloseAction} className="absolute top-4 right-4 text-gray-700 bg-white/70 p-2 rounded-full shadow-sm" title="Fermer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 min-h-0">
                    {/* Left: Carousel + Order form (desktop & mobile) */}
                    <div className="relative">

                        <div className="overflow-hidden rounded-xl bg-gray-50 relative">
                            <div ref={carouselRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ touchAction: 'pan-y' }} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth">
                                {images.map((src, i) => (
                                    <div key={i} className="flex-shrink-0 w-full md:w-[420px] h-64 md:h-80 snap-center relative">
                                        <img src={src} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomOpen(true)} onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'https://placehold.co/420x300/9CA3AF/ffffff?text=Img'; }} />
                                    </div>
                                ))}
                                {/* Centered arrows overlay */}
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-between z-20">
                                    <button
                                        onClick={prev}
                                        aria-label="Précédent"
                                        className="pointer-events-auto bg-black/50 text-white p-3 rounded-full shadow-lg mx-2 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                                        style={{}}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={next}
                                        aria-label="Suivant"
                                        className="pointer-events-auto bg-black/50 text-white p-3 rounded-full shadow-lg mx-2 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                                        style={{}}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dots */}
                        <div className="flex items-center justify-center gap-2 mt-3">
                            {images.map((_, i) => (
                                <button key={i} onClick={() => setIndex(i)} className={`w-2 h-2 rounded-full ${i === index ? 'bg-primary' : 'bg-gray-300'}`} aria-label={`Aller à l'image ${i + 1}`} />
                            ))}
                        </div>

                        {/* Mobile: phone/address and order form under images */}
                        <div className="mt-4 md:hidden">
                            <div className="mb-3 text-sm text-gray-700">
                                <h4 className="font-semibold">Vendeur</h4>
                                <p className="text-sm text-gray-600">{product.vendor}</p>
                                <p className="text-sm text-gray-600">{product.phone}</p>
                                <p className="text-sm text-gray-600">{product.address}</p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl">
                                <h4 className="font-semibold mb-2">Commander ce produit</h4>
                                <div className="space-y-2">
                                    <div>
                                        <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nom complet" className="w-full p-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <input value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="Téléphone" className="w-full p-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                    </div>
                                    <div>
                                        <input value={userAddress} onChange={(e) => setUserAddress(e.target.value)} placeholder="Adresse" className="w-full p-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                                        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                                    </div>
                                    <div>
                                        <select value={userState} onChange={(e) => setUserState(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200">
                                            {TUNISIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                                    </div>

                                    <div>
                                        <button onClick={handleOrder} className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95">Commander</button>
                                        {/* saved removed - Enregistrer removed as requested */}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Desktop: show order form in left column under images area */}
                        <div className="hidden md:block mt-4">
                            <div className="bg-gray-50 p-3 rounded-xl">
                                <h4 className="font-semibold mb-2">Commander ce produit</h4>
                                <div className="space-y-3">
                                    <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nom complet" className="w-full p-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}

                                    <input value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="Téléphone" className="w-full p-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}

                                    <input value={userAddress} onChange={(e) => setUserAddress(e.target.value)} placeholder="Adresse" className="w-full p-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}

                                    <select value={userState} onChange={(e) => setUserState(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200">
                                        {TUNISIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}

                                    <button onClick={handleOrder} className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95">Commander</button>
                                    {/* Enregistrer removed */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Details & Vendor info */}
                    <div className="flex flex-col">
                        <div className="mb-3">
                            <div className="flex items-start justify-between">
                                <h3 className="text-2xl font-bold text-primary mb-1">{product.name}</h3>
                                {/* Favorite heart moved to avoid overlap with close button: increased z-index and right margin */}
                                <button
                                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                    onClick={() => {
                                        if (isFavorite) { removeGuestFavorite(product.name); setIsFavorite(false); }
                                        else { addGuestFavorite(product.name); setIsFavorite(true); }
                                    }}
                                    className={`p-2 rounded-md transition-transform duration-150 ${isFavorite ? 'text-red-500 bg-red-50 scale-105' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                    style={{ marginRight: 48, zIndex: 40 }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3">
                                    <p className="text-3xl font-extrabold text-accent">{product.price}</p>
                                    {/* Rating stars */}
                                    <div className="flex items-center">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <svg key={i} className={`h-5 w-5 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill={i < Math.round(rating) ? 'currentColor' : 'none'} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.371-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.783.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.287-3.958z" />
                                            </svg>
                                        ))}
                                        <span className="text-sm text-gray-500 ml-2">{rating.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4 text-sm text-gray-700 flex-grow overflow-auto">
                            <h4 className="font-semibold mb-1">Description</h4>
                            <p>{product.description ?? 'Aucune description fournie.'}</p>

                            <h4 className="font-semibold mt-3 mb-1">Vendeur</h4>
                            <p className="text-sm text-gray-600">{product.vendor}</p>
                            <p className="text-sm text-gray-600">{product.phone}</p>
                            <p className="text-sm text-gray-600">{product.address}</p>
                        </div>

                        {/* Vendor panel at bottom */}
                        <div className="mt-4 flex-shrink-0">
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl">
                                <h4 className="font-semibold mb-1">Informations Vendeur</h4>
                                <p className="text-sm">{product.vendor}</p>
                                <p className="text-sm">{product.phone}</p>
                                <p className="text-sm">{product.address}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {zoomOpen && (
                <ZoomOverlay images={images} index={index} setIndex={setIndex} onClose={() => setZoomOpen(false)} />
            )}
        </div>
    );
}

// Fullscreen zoom overlay (rendered by ProductModal when zoomOpen is true)
// We'll append the overlay at the end of the file so it's still part of the component closure
function ZoomOverlay({ images, index, setIndex, onClose }: { images: string[]; index: number; setIndex: (i: number) => void; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setIndex((index - 1 + images.length) % images.length);
            if (e.key === 'ArrowRight') setIndex((index + 1) % images.length);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [images.length, index, onClose, setIndex]);

    return (
        <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center" onClick={onClose}>
            <button className="absolute top-4 right-4 text-white p-2 rounded bg-black/50" onClick={onClose} aria-label="Fermer" title="Fermer">
                ✕
            </button>
            <button className="absolute left-4 text-white p-2 rounded bg-black/50" onClick={(e) => { e.stopPropagation(); setIndex((index - 1 + images.length) % images.length); }} aria-label="Précédent">‹</button>
            <img src={images[index]} alt={`zoom-${index}`} className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'https://placehold.co/1200x900/9CA3AF/ffffff?text=Img'; }} />
            <button className="absolute right-4 text-white p-2 rounded bg-black/50" onClick={(e) => { e.stopPropagation(); setIndex((index + 1) % images.length); }} aria-label="Suivant">›</button>
        </div>
    );
}

// Export default still above; ZoomOverlay is internal helper
