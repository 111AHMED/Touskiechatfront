type Handler = (payload?: any) => void;

let handlers: Record<string, Handler[]> = {};

// Reset handlers when module is hot reloaded or in development
if (process.env.NODE_ENV === 'development') {
    if (typeof window !== 'undefined') {
        // @ts-ignore
        if (!window.__eventHandlers) {
            // @ts-ignore
            window.__eventHandlers = {};
        }
        // @ts-ignore
        handlers = window.__eventHandlers;
    }
}

export function on(event: string, cb: Handler) {
    // Only register handlers on the client side
    if (typeof window === 'undefined') {
        return () => { }; // No-op for SSR
    }

    handlers[event] = handlers[event] || [];
    handlers[event].push(cb);
    return () => {
        handlers[event] = handlers[event].filter((h) => h !== cb);
    };
}

export function emit(event: string, payload?: any) {
    // Only emit events on the client side
    if (typeof window === 'undefined') {
        return; // No-op for SSR
    }

    (handlers[event] || []).slice().forEach((h) => {
        try { h(payload); } catch (e) { console.error(e); }
    });
}
