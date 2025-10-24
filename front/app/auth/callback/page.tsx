"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
    const router = useRouter();
    const [status, setStatus] = useState<string>('Traitement de la connexion...');

    useEffect(() => {
        try {
            // The backend redirects with tokens in the hash fragment: #access_token=...&token_type=...&user=...
            const raw = window.location.hash || window.location.search;
            if (!raw) {
                setStatus('Aucun token trouvé dans l’URL.');
                return;
            }

            const fragment = raw.startsWith('#') ? raw.slice(1) : raw.startsWith('?') ? raw.slice(1) : raw;
            const params = new URLSearchParams(fragment);
            const accessToken = params.get('access_token');
            const tokenType = params.get('token_type');
            const userParam = params.get('user');

            // New flow: backend stores tokens in HttpOnly cookies and redirects with ?user=...
            // If access_token is missing but user JSON is present, consider the login successful
            if (!accessToken && !userParam) {
                const err = params.get('error') || 'Jeton d’accès manquant';
                setStatus(`Échec de l'authentification: ${err}`);
                return;
            }

            // Decode user JSON if present
            let user = null;
            if (userParam) {
                try {
                    // backend encodes the JSON via encodeURIComponent/quote
                    user = JSON.parse(decodeURIComponent(userParam));
                } catch (e) {
                    try {
                        user = JSON.parse(userParam);
                    } catch (e2) {
                        console.warn('Impossible de parser user param', e2);
                    }
                }
            }

            // Tokens are now stored as HttpOnly cookies by the backend.
            // We avoid storing tokens in localStorage for better security.

            // Clean URL (remove fragment)
            try {
                window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
            } catch (e) {
                // ignore
            }

            setStatus('Connexion réussie — redirection...');

            // Redirect to account page or homepage; AuthProvider will fetch session
            setTimeout(() => {
                router.replace('/account');
            }, 900);
        } catch (err) {
            console.error('Erreur lors du traitement du callback:', err);
            setStatus('Erreur lors du traitement du callback. Consultez la console.');
        }
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-lg w-full p-6 bg-white rounded-lg shadow">
                <h1 className="text-xl font-semibold mb-2">Authentification</h1>
                <p className="text-sm text-gray-600">{status}</p>
            </div>
        </div>
    );
}
