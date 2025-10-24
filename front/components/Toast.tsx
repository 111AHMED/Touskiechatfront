"use client";

import { useEffect, useState } from "react";

let globalPush: ((msg: string) => void) | null = null;

export function pushToast(msg: string) {
    if (globalPush) globalPush(msg);
}

export default function ToastContainer() {
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        globalPush = (m: string) => {
            setMessages((s) => [...s, m]);
        };
        return () => {
            globalPush = null;
        };
    }, []);

    useEffect(() => {
        if (messages.length === 0) return;
        const id = setTimeout(() => {
            setMessages((s) => s.slice(1));
        }, 1600); // shorter duration
        return () => clearTimeout(id);
    }, [messages]);

    return (
        <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 60 }}>
            {messages.map((m, i) => (
                <div key={i} className="mb-2 bg-white border border-green-100 shadow-md px-4 py-2 rounded-lg text-sm text-green-800 flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-400 shadow-sm" />
                    <div>{m}</div>
                </div>
            ))}
        </div>
    );
}
