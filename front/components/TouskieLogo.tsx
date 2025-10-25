"use client";

import Image from 'next/image';
import React from 'react';

type Variant = 'default' | 'square' | 'white' | 'inverted';

export default function TouskieLogo({ variant = 'default', size = 40, className = '' }: { variant?: Variant; size?: number; className?: string }) {
    const src = variant === 'square' ? '/touskie-logo-square.svg' : variant === 'white' ? '/touskie-logo-white.svg' : variant === 'inverted' ? '/touskie-logo-inverted.svg' : '/touskie-logo.svg';

    // When using next/image with SVG you can use width/height directly
    return (
        <div className={className} style={{ width: size * (variant === 'square' ? 1 : 3), height: size }}>
            {/* Use regular img fallback if next/image causes layout issues with raw SVG */}
            <img src={src} width={size * (variant === 'square' ? 1 : 3)} height={size} alt="Touskié.tn" style={{ display: 'block', width: '100%', height: 'auto' }} />
        </div>
    );
}
