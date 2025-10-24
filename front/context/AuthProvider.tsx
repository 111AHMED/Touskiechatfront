"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type User = any | null;

interface AuthContextValue {
    user: User;
    loading: boolean;
    refreshSession: () => Promise<void>;
    ensureSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    const refreshSession = async () => {
        setLoading(true);
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const url = `${apiBase.replace(/\/$/, '')}/api/v1/auth/session`;
        try {
            const res = await fetch(url, {
                method: 'GET',
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else if (res.status === 401) {
                // Normal case when no session exists. Only attempt refresh if a refresh cookie is present.
                const hasRefreshCookie = typeof document !== 'undefined' && document.cookie.includes('refresh_token=');
                if (!hasRefreshCookie) {
                    // No refresh cookie -> unauthenticated; avoid noisy refresh attempts
                    console.debug(`Session 401 and no refresh cookie present; treating as unauthenticated for ${url}`);
                    setUser(null);
                } else {
                    console.info(`Session returned 401 — refresh cookie present, attempting token refresh from ${apiBase}`);
                    // Try refresh endpoint once
                    try {
                        const refreshRes = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/auth/refresh`, {
                            method: 'POST',
                            credentials: 'include',
                        });
                        if (refreshRes.ok) {
                            console.info('Refresh succeeded, retrying session');
                            // retry session
                            const retry = await fetch(url, { method: 'GET', credentials: 'include' });
                            if (retry.ok) {
                                const data = await retry.json();
                                setUser(data.user);
                                return;
                            }
                        } else {
                            console.warn('Refresh attempt failed', refreshRes.status, refreshRes.statusText);
                        }
                    } catch (e) {
                        console.error('Refresh attempt failed', e);
                    }

                    console.warn(`Session fetch returned ${res.status} ${res.statusText} for ${url}`);
                    setUser(null);
                }
            } else {
                console.warn(`Session fetch returned ${res.status} ${res.statusText} for ${url}`);
                setUser(null);
            }
        } catch (e) {
            console.error('Failed to refresh session', e);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const ensureSession = async (): Promise<boolean> => {
        setLoading(true);
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const url = `${apiBase.replace(/\/$/, '')}/api/v1/auth/session`;
        try {
            const res = await fetch(url, { method: 'GET', credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                return true;
            }

            if (res.status === 401) {
                const hasRefreshCookie = typeof document !== 'undefined' && document.cookie.includes('refresh_token=');
                if (!hasRefreshCookie) {
                    setUser(null);
                    return false;
                }

                // Attempt cookie-based refresh once
                try {
                    const refreshRes = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/auth/refresh`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                    if (refreshRes.ok) {
                        // Retry session fetch
                        const retry = await fetch(url, { method: 'GET', credentials: 'include' });
                        if (retry.ok) {
                            const data = await retry.json();
                            setUser(data.user);
                            return true;
                        }
                    }
                } catch (e) {
                    console.error('ensureSession refresh failed', e);
                }
            }

            setUser(null);
            return false;
        } catch (e) {
            console.error('Failed to ensure session', e);
            setUser(null);
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSession();
        // optionally set interval to refresh access token periodically
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refreshSession, ensureSession }}>{children}</AuthContext.Provider>
    );
}
