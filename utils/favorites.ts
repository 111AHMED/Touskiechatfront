const STORAGE_KEY = 'touskie_guest_favorites_v1';

export function getGuestFavorites(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

export function setGuestFavorites(favs: string[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    } catch (e) {
        // ignore
    }
}

export function addGuestFavorite(productName: string) {
    const favs = new Set(getGuestFavorites());
    favs.add(productName);
    setGuestFavorites(Array.from(favs));
}

export function removeGuestFavorite(productName: string) {
    const favs = new Set(getGuestFavorites());
    favs.delete(productName);
    setGuestFavorites(Array.from(favs));
}

export function mergeFavorites(serverFavorites: string[] = []) {
    // merge guest favorites with server favorites (unique)
    const guest = getGuestFavorites();
    const merged = Array.from(new Set([...serverFavorites, ...guest]));
    // After merging, clear guest favorites (they are now on the server)
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        // ignore
    }
    return merged;
}
