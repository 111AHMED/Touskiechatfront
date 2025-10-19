"use client";

import { useState, useEffect } from "react";

interface AccountInfo {
    email: string;
    logoUrl?: string;
    firstName: string;
    lastName: string;
    phonePrimary: string;
    phoneSecondary?: string;
    phoneAlt?: string;
    governorate?: string;
    delegation?: string;
    street?: string;
    postalCode?: string;
}

const STORAGE_KEY = "touskie_account_info_v1";

export default function AccountPage() {
    const [info, setInfo] = useState<AccountInfo>({
        email: "user@example.com",
        logoUrl: "",
        firstName: "",
        lastName: "",
        phonePrimary: "",
        phoneSecondary: "",
        phoneAlt: "",
        governorate: "",
        delegation: "",
        street: "",
        postalCode: ""
    });

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setInfo(JSON.parse(raw));
        } catch (e) {
            // ignore
        }
    }, []);

    const handleChange = (k: keyof AccountInfo, v: string) => {
        setInfo((prev) => ({ ...prev, [k]: v }));
    };

    const handleSave = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
            alert("Informations enregistrées.");
        } catch (e) {
            alert("Impossible d'enregistrer les informations.");
        }
    };

    const handleLogout = () => {
        // simple logout stub: clear storage and redirect to home
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "/";
    };

    return (
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-md">
            {/* Top: email + optional logo */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {info.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={info.logoUrl} alt="logo" className="h-12 w-12 rounded-md object-cover" />
                    ) : (
                        <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">LOGO</div>
                    )}

                    <div>
                        <p className="text-sm text-gray-500">Connecté en tant que</p>
                        <p className="font-semibold text-gray-900">{info.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        className="bg-primary text-white px-4 py-2 rounded-lg shadow-sm hover:opacity-95"
                    >
                        Mettre à jour
                    </button>

                    <button
                        onClick={handleLogout}
                        className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50"
                    >
                        Déconnexion
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations de base */}
                <section className="col-span-1 p-4 border border-gray-100 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Informations de base</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-600">Prénom</label>
                            <input
                                value={info.firstName}
                                onChange={(e) => handleChange("firstName", e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-200 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Nom</label>
                            <input
                                value={info.lastName}
                                onChange={(e) => handleChange("lastName", e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-200 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Téléphone principal</label>
                            <input
                                value={info.phonePrimary}
                                onChange={(e) => handleChange("phonePrimary", e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-200 rounded-md"
                            />
                        </div>
                    </div>
                </section>

                {/* Contact Info */}
                <section className="col-span-1 p-4 border border-gray-100 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Informations de contact</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-600">Téléphone secondaire</label>
                            <input
                                value={info.phoneSecondary}
                                onChange={(e) => handleChange("phoneSecondary", e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-200 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Téléphone alternatif</label>
                            <input
                                value={info.phoneAlt}
                                onChange={(e) => handleChange("phoneAlt", e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-200 rounded-md"
                            />
                        </div>
                    </div>
                </section>

                {/* Address Info - full width */}
                <section className="col-span-1 md:col-span-2 p-4 border border-gray-100 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Informations d'adresse</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="text-sm text-gray-600">Gouvernorat</label>
                            <input
                                value={info.governorate}
                                onChange={(e) => handleChange("governorate", e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-200 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Délégation</label>
                            <input
                                value={info.delegation}
                                onChange={(e) => handleChange("delegation", e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-200 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Code postal</label>
                            <input
                                value={info.postalCode}
                                onChange={(e) => handleChange("postalCode", e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-200 rounded-md"
                            />
                        </div>

                        <div className="md:col-span-3">
                            <label className="text-sm text-gray-600">Rue</label>
                            <input
                                value={info.street}
                                onChange={(e) => handleChange("street", e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-200 rounded-md"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
