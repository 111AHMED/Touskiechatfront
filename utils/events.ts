type Handler = (payload?: any) => void;

const handlers: Record<string, Handler[]> = {};

export function on(event: string, cb: Handler) {
    handlers[event] = handlers[event] || [];
    handlers[event].push(cb);
    return () => {
        handlers[event] = handlers[event].filter((h) => h !== cb);
    };
}

export function emit(event: string, payload?: any) {
    (handlers[event] || []).slice().forEach((h) => {
        try { h(payload); } catch (e) { console.error(e); }
    });
}
