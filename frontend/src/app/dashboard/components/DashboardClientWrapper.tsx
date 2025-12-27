
'use client';

import { useState } from 'react';
import Header from '@/components/Header';

export default function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<'en' | 'hi'>('en');

    return (
        <div className="app">
            <Header language={language} setLanguage={setLanguage} />
            <main className="dashboard-page">
                {children}
            </main>
        </div>
    );
}
