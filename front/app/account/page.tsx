"use client";

import { useAuth } from '../../context/AuthProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { governorates } from '../../data/governorates';
import ToastContainer, { pushToast } from '../../components/Toast';

interface AccountInfo {
    email: string;
    logoUrl?: string;
    firstName?: string;
    lastName?: string;
    phonePrimary?: string;
    phoneSecondary?: string;
    phoneAlt?: string;
    governorate?: string;
    delegation?: string;
    street?: string;
    postalCode?: string;
}

const STORAGE_KEY = 'touskie_account_info_v1';

export default function AccountPage() {
    const { user, loading, refreshSession, ensureSession } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [info, setInfo] = useState<AccountInfo>({ email: 'user@example.com' });

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setInfo(JSON.parse(raw));
        } catch (e) {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (user) {
            // Map server-side user fields to local UI fields
            const mapped = {
                email: user.email || info.email,
                logoUrl: user.picture || info.logoUrl,
                firstName: (user.firstName || user.first_name || (user.name ? user.name.split(' ')[0] : undefined)) || info.firstName,
                lastName: (user.lastName || user.last_name || (user.name ? user.name.split(' ').slice(1).join(' ') : undefined)) || info.lastName,
                phonePrimary: user.phone_one || info.phonePrimary,
                phoneSecondary: user.phone_two || info.phoneSecondary,
                phoneAlt: user.phone_three || info.phoneAlt,
                governorate: user.address?.gouvernorat || info.governorate,
                delegation: user.address?.delegation || info.delegation,
                street: user.address?.street || info.street,
                postalCode: user.address?.postal_code || info.postalCode,
            } as AccountInfo;

            setInfo((prev) => ({ ...prev, ...mapped }));
        }
    }, [user]);

    const handleChange = (k: keyof AccountInfo, v: string) => {
        setInfo((prev) => ({ ...prev, [k]: v }));
    };

    const handleSave = async () => {
        // client-side validation
        if (!info.firstName || !info.lastName) {
            pushToast('Le prénom et le nom sont requis.');
            return;
        }
        const phoneRegex = /^\d{8}$/;
        if (info.phonePrimary && !phoneRegex.test(info.phonePrimary)) {
            pushToast("Le téléphone principal doit comporter 8 chiffres.");
            return;
        }

        // Prepare payload matching backend UserUpdate schema
        const payload: any = {};
        if (info.firstName) payload.firstName = info.firstName;
        if (info.lastName) payload.lastName = info.lastName;
        if (info.phonePrimary) payload.phone_one = info.phonePrimary;
        if (info.phoneSecondary) payload.phone_two = info.phoneSecondary;
        if (info.phoneAlt) payload.phone_three = info.phoneAlt;
        const address: any = {};
        if (info.governorate) address.gouvernorat = info.governorate;
        if (info.delegation) address.delegation = info.delegation;
        if (info.street) address.street = info.street;
        if (info.postalCode) address.postal_code = info.postalCode;
        if (Object.keys(address).length) payload.address = address;

        // Ensure session (will refresh via cookie if needed) before attempting the update
        const ensured = await ensureSession();
        if (!ensured) {
            pushToast('Session expirée. Veuillez vous reconnecter.');
            return;
        }

        // Send to server via cookie-aware endpoint and verify session updated
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        setSaving(true);
        try {
            let res = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/auth/profile_cookie`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                // If access token expired the server will reply 401. Try a refresh flow if a refresh cookie exists.
                if (res.status === 401) {
                    const hasRefresh = typeof document !== 'undefined' && document.cookie.includes('refresh_token=');
                    if (hasRefresh) {
                        // Attempt to refresh tokens via cookie-aware endpoint
                        try {
                            const refreshRes = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/auth/refresh`, {
                                method: 'POST',
                                credentials: 'include'
                            });
                            if (refreshRes.ok) {
                                // retry the profile update once
                                const retry = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/auth/profile_cookie`, {
                                    method: 'PUT',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload)
                                });
                                if (retry.ok) {
                                    // proceed to session verification below by replacing res with retry
                                    res = retry;
                                } else {
                                    const body = await retry.json().catch(() => ({}));
                                    pushToast(body.detail || 'Erreur lors de la mise à jour après refresh');
                                    setSaving(false);
                                    return;
                                }
                            } else {
                                // refresh failed (refresh cookie invalid/expired)
                                pushToast('Session expirée. Veuillez vous reconnecter.');
                                setSaving(false);
                                return;
                            }
                        } catch (e) {
                            console.error('Refresh attempt failed', e);
                            pushToast('Impossible de rafraîchir la session');
                            setSaving(false);
                            return;
                        }
                    }
                }

                const body = await res.json().catch(() => ({}));
                pushToast(body.detail || 'Erreur lors de la mise à jour');
                setSaving(false);
                return;
            }

            // After successful update, refresh session and verify saved fields
            // Try to fetch session directly to validate DB persistence
            const sessionRes = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/auth/session`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!sessionRes.ok) {
                pushToast('Profil mis à jour, mais impossible de vérifier la session');
            } else {
                const data = await sessionRes.json().catch(() => ({}));
                const srv = data.user || {};
                const matches = (
                    (!payload.firstName || srv.firstName === payload.firstName) &&
                    (!payload.lastName || srv.lastName === payload.lastName) &&
                    (!payload.phone_one || srv.phone_one === payload.phone_one) &&
                    (!payload.phone_two || srv.phone_two === payload.phone_two) &&
                    (!payload.phone_three || srv.phone_three === payload.phone_three) &&
                    (!payload.address || (srv.address && srv.address.gouvernorat === payload.address.gouvernorat))
                );

                if (matches) {
                    pushToast('Profil mis à jour et enregistré en base');
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(info)); } catch (e) { }
                    // Update client-side auth context too
                    try { await refreshSession(); } catch (e) { /* ignore */ }
                } else {
                    pushToast('Profil mis à jour, mais la base ne reflète pas encore les changements');
                    try { await refreshSession(); } catch (e) { /* ignore */ }
                }
            }
        } catch (e) {
            console.error(e);
            pushToast('Erreur réseau lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            // call server endpoint to clear HttpOnly cookies and DB refresh token
            await fetch((process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000') + '/api/v1/auth/logout_cookies', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.warn('Logout request failed', e);
        }

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) { /* ignore */ }

        // refresh client session state
        try { await refreshSession(); } catch (e) { /* ignore */ }

        router.push('/');
    };

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-md">
            <ToastContainer />
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
                    <button onClick={() => router.push('/')} className="border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                        Retour à l'accueil
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
                            <input value={info.firstName || ''} onChange={(e) => handleChange('firstName', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-md" />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Nom</label>
                            <input value={info.lastName || ''} onChange={(e) => handleChange('lastName', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-md" />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Téléphone principal</label>
                            <input value={info.phonePrimary || ''} onChange={(e) => handleChange('phonePrimary', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-md" />
                        </div>
                    </div>
                </section>

                {/* Contact Info */}
                <section className="col-span-1 p-4 border border-gray-100 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Informations de contact</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-600">Téléphone secondaire</label>
                            <input value={info.phoneSecondary || ''} onChange={(e) => handleChange('phoneSecondary', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-md" />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Téléphone alternatif</label>
                            <input value={info.phoneAlt || ''} onChange={(e) => handleChange('phoneAlt', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-md" />
                        </div>
                    </div>
                </section>

                {/* Address Info - full width */}
                <section className="col-span-1 md:col-span-2 p-4 border border-gray-100 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Informations d'adresse</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="text-sm text-gray-600">Gouvernorat</label>
                            <select value={info.governorate || ''} onChange={(e) => handleChange('governorate', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-md">
                                <option value="">-- Sélectionner --</option>
                                {governorates.map((g) => (
                                    <option key={g.value} value={g.value}>{g.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Délégation</label>
                            <input value={info.delegation || ''} onChange={(e) => handleChange('delegation', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-md" />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Code postal</label>
                            <input value={info.postalCode || ''} onChange={(e) => handleChange('postalCode', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-md" />
                        </div>

                        <div className="md:col-span-3">
                            <label className="text-sm text-gray-600">Rue</label>
                            <input value={info.street || ''} onChange={(e) => handleChange('street', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-md" />
                        </div>
                    </div>
                </section>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button onClick={handleSave} disabled={saving} className={`bg-primary text-white px-4 py-2 rounded-lg shadow-sm hover:opacity-95 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {saving ? 'Enregistrement...' : 'Mettre à jour'}
                </button>

                <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700">
                    Déconnexion
                </button>
            </div>
        </div>
    );
}
