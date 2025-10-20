"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Product } from "../types";
import { mockProducts } from "../data/mockProducts";
import { emit } from "../utils/events";

interface SearchModalProps {
    open: boolean;
    onCloseAction?: () => void; // named as action to satisfy serialization rules
}

export default function SearchModal({ open, onCloseAction }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("relevance");

    // control mount/enter animation states
    const [mounted, setMounted] = useState<boolean>(open);
    const [entered, setEntered] = useState<boolean>(false);

    useEffect(() => {
        if (!open) {
            setQuery("");
            setMinPrice("");
            setMaxPrice("");
            setVisibleCount(12);
        }
    }, [open]);

    const [visibleCount, setVisibleCount] = useState(12);
    const [loading, setLoading] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const containerRef = useRef<HTMLDivElement | null>(null);

    const parsePrice = (priceText: string) => {
        if (!priceText) return 0;
        // remove non-digit characters
        const digits = priceText.replace(/[^0-9\.\,]/g, "").replace(/,/g, "");
        const n = Number(digits) || 0;
        return n;
    };

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        const all = !q ? mockProducts.slice(0, 200) : mockProducts.filter((p) => (p.name + " " + p.vendor + " " + p.price).toLowerCase().includes(q));

        // Apply price filtering
        const min = Number(minPrice) || 0;
        const max = Number(maxPrice) || 0;
        const filteredByPrice = all.filter((p) => {
            const pnum = parsePrice(p.price);
            if (min && pnum < min) return false;
            if (max && pnum > max) return false;
            return true;
        });

        // Apply sorting by price if requested
        if (sort === 'price-asc') {
            return filteredByPrice.slice().sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        }
        if (sort === 'price-desc') {
            return filteredByPrice.slice().sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        }

        return filteredByPrice;
    }, [query, minPrice, maxPrice, sort]);
    // scroll handler for lazy loading and showing top button
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        let timeout: any;
        const onScroll = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const { scrollTop, clientHeight, scrollHeight } = el;
                setShowScrollTop(scrollTop > 120);

                // near bottom -> load more
                if (!loading && scrollTop + clientHeight >= scrollHeight - 60 && visibleCount < results.length) {
                    setLoading(true);
                    setTimeout(() => {
                        setVisibleCount((v) => Math.min(results.length, v + 12));
                        setLoading(false);
                    }, 700);
                }
            }, 80);
        };

        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [results.length, visibleCount, loading]);

    // handle mount/enter animation when `open` changes
    useEffect(() => {
        if (open) {
            setMounted(true);
            // next tick to allow mount before animating
            requestAnimationFrame(() => setEntered(true));
        } else {
            // start exit animation
            setEntered(false);
            // unmount after transition (300ms)
            const t = setTimeout(() => setMounted(false), 300);
            return () => clearTimeout(t);
        }
    }, [open]);

    // prevent background scroll when modal mounted
    useEffect(() => {
        if (!mounted) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [mounted]);

    // Escape to close and basic focus-trap
    useEffect(() => {
        if (!mounted) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onCloseAction && onCloseAction();
            }

            if (e.key === 'Tab') {
                // basic focus trap - keep focus inside modal
                const focusable = Array.from(document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')) as HTMLElement[];
                const modalFocusable = focusable.filter(el => document.body.contains(el) && el.closest && el.closest('[data-search-modal]'));
                if (modalFocusable.length === 0) return;
                const idx = modalFocusable.indexOf(document.activeElement as HTMLElement);
                if (e.shiftKey) {
                    if (idx <= 0) {
                        modalFocusable[modalFocusable.length - 1].focus();
                        e.preventDefault();
                    }
                } else {
                    if (idx === modalFocusable.length - 1) {
                        modalFocusable[0].focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', onKey);
        // focus first input inside modal
        requestAnimationFrame(() => {
            const first = document.querySelector('[data-search-modal] input, [data-search-modal] button') as HTMLElement | null;
            first?.focus();
        });

        return () => document.removeEventListener('keydown', onKey);
    }, [mounted, onCloseAction]);

    if (!mounted) return null;

    return (
        <div className={`fixed inset-0 p-4 overflow-auto transition-opacity duration-300 ${entered ? 'opacity-100' : 'opacity-0'}`} style={{ zIndex: 99990 }}>
            {/* backdrop — gradient soft gray */}
            <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, #f3f4f6, #ffffff)', zIndex: 99991, pointerEvents: 'auto' }} />
            <div data-search-modal className={`relative max-w-6xl mx-auto transition-transform duration-300 flex flex-col ${entered ? 'translate-y-0' : '-translate-y-4'}`} style={{ zIndex: 99992, position: 'relative', maxHeight: 'calc(100vh - 80px)', overflow: 'hidden' }}>
                {/* Sticky top area (logo, title, search controls) */}
                <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
                    <div className="flex items-center justify-between mb-3 px-2">
                        <div className="flex items-center gap-3">
                            {/* use shared logo */}
                            <div className="h-10 w-10">
                                <svg className="brand-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" width="40" height="40">
                                    <defs>
                                        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                                            <stop offset="0" stopColor="#06b6a4" />
                                            <stop offset="1" stopColor="#059669" />
                                        </linearGradient>
                                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="1.2" result="b" />
                                            <feMerge>
                                                <feMergeNode in="b" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    <circle cx="32" cy="32" r="30" fill="url(#g1)" opacity="0.98" />
                                    <g stroke="#ffffff" strokeOpacity="0.95" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="30" x2="30" y2="24" />
                                        <line x1="22" y1="30" x2="30" y2="36" />
                                        <line x1="30" y1="24" x2="36" y2="28" />
                                    </g>

                                    <circle cx="22" cy="30" r="2.2" fill="#ffffff" filter="url(#glow)" />
                                    <circle cx="30" cy="24" r="2.4" fill="#f59e0b" filter="url(#glow)" />
                                    <circle cx="30" cy="36" r="2.2" fill="#f59e0b" filter="url(#glow)" />
                                    <circle cx="36" cy="28" r="2.0" fill="#ffffff" />
                                    <g transform="translate(6,6)">
                                        <circle cx="38" cy="38" r="7.2" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="44" y1="44" x2="52" y2="52" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                                        <circle cx="36" cy="36" r="1.6" fill="#f59e0b" />
                                    </g>
                                </svg>
                            </div>
                            <div>
                                <div className="text-sm font-semibold">TOUSKIE.tn</div>
                                <div className="text-xs text-gray-500">Recherche</div>
                            </div>
                        </div>
                        <div>
                            <button onClick={onCloseAction} title="Fermer" className="p-2 rounded-full bg-red-600 text-white shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-2 px-3">
                        <div>
                            <h3 className="text-lg font-semibold">Recherches populaires</h3>
                            <p className="text-sm text-gray-500">{results.length} résultats</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <select value={sort} onChange={(e) => setSort(e.target.value)} className="p-2 border rounded-md">
                                <option value="relevance">Pertinence</option>
                                <option value="price-asc">Prix ↑</option>
                                <option value="price-desc">Prix ↓</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4 px-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        <div className="md:col-span-2 relative">
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setVisibleCount(12); }}
                                placeholder="Recherche Rapide"
                                className="w-full p-3 border border-gray-200 rounded-lg text-lg"
                            />
                            {query && (
                                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600">Effacer</button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <input value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Prix min" className="p-2 border rounded-md w-full" />
                            <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Prix max" className="p-2 border rounded-md w-full" />
                        </div>
                    </div>
                </div>

                {/* Scrollable content area for product cards */}
                <div className="modal-top-spacer" />
                <div ref={containerRef} className="overflow-auto px-3 pb-4 flex-grow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.slice(0, visibleCount).map((p, i) => (
                            <div key={p.name} style={{ transitionDelay: `${i * 40}ms` }} className={`border rounded-xl p-3 hover:shadow-lg flex flex-col transform transition-all duration-300 card-enter ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.image} alt={p.name} className="h-36 w-full object-cover rounded-md mb-3" />
                                <div className="flex-grow">
                                    <h3 className="font-semibold text-sm">{p.name}</h3>
                                    <p className="text-xs text-gray-500">{p.vendor}</p>
                                    <p className="mt-2 font-extrabold text-accent">{p.price}</p>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <button onClick={() => emit('openProduct', p)} className="text-sm text-primary">Voir détails</button>
                                    <a href={p.link} target="_blank" rel="noreferrer" className="text-sm text-gray-600 flex items-center gap-1">Visiter <span className="ml-1">→</span></a>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-3">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
                                <span className="text-sm text-gray-600">Chargement...</span>
                            </div>
                        ) : null}
                        {showScrollTop && (
                            <button onClick={() => { containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-4 py-2 border rounded-md">Haut</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
