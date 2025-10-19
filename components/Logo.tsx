"use client";

export default function Logo({ size = 40 }: { size?: number }) {
    return (
        <svg className="brand-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" width={size} height={size}>
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
    );
}
