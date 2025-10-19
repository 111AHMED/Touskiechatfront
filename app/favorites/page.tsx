"use client";

import { useEffect, useState } from "react";
import { mockProducts } from "../../data/mockProducts";
import { getGuestFavorites, removeGuestFavorite, setGuestFavorites } from "../../utils/favorites";
import { useRouter } from "next/navigation";

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<string[]>([]);
    const router = useRouter();

    useEffect(() => {
        setFavorites(getGuestFavorites());
    }, []);

    const handleRemove = (name: string) => {
        const next = favorites.filter((f) => f !== name);
        setFavorites(next);
        setGuestFavorites(next);
    };

    const favProducts = mockProducts.filter((p) => favorites.includes(p.name));

    return (
        <div className="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Vos Favoris</h2>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-sm text-gray-600 border px-3 py-2 rounded-lg">Retour</button>
                </div>
            </div>

            {favProducts.length === 0 ? (
                <div className="text-center text-gray-500 py-20">Vous n'avez aucun favoris pour le moment.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favProducts.map((p) => (
                        <div key={p.name} className="border rounded-lg p-3 flex flex-col">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.image} alt={p.name} className="h-36 w-full object-cover rounded-md mb-3" />
                            <div className="flex-grow">
                                <h3 className="font-semibold">{p.name}</h3>
                                <p className="text-sm text-gray-500">{p.vendor}</p>
                                <p className="mt-2 font-extrabold text-accent">{p.price}</p>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <a href={p.link} target="_blank" rel="noreferrer" className="text-sm text-primary">Visiter</a>
                                <button onClick={() => handleRemove(p.name)} className="text-sm text-red-500">Supprimer</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
