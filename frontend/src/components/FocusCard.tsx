'use client';

import { ReactNode } from 'react';

interface FocusCardProps {
    children: ReactNode;
}

export default function FocusCard({ children }: FocusCardProps) {
    return (
        <div className="focus-card">
            {children}
        </div>
    );
}
