'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function DashboardHeader() {
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const pathname = usePathname();

    const getUserName = () => {
        if (!user) return '';
        const metadata = user.user_metadata;
        return metadata?.full_name || metadata?.name || user.email?.split('@')[0] || '';
    };

    // Get current page name from pathname
    const getPageName = () => {
        if (pathname === '/dashboard') return t.myWebsites;
        if (pathname?.includes('/leads')) return t.leadsCustomers;
        if (pathname?.includes('/popup')) return t.popupManager;
        if (pathname?.includes('/credits')) return t.billingCredits;
        return t.myWebsites;
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'hi' : 'en');
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            flex: 1
        }}>
            {/* Breadcrumb - Hidden on mobile */}
            <div
                className="hidden md:flex"
                style={{
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <span style={{
                    color: '#64748b',
                    fontWeight: 500,
                    fontSize: '14px'
                }}>{t.dashboard}</span>
                <span style={{ color: '#cbd5e1' }}>/</span>
                <span style={{
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: '14px'
                }}>{getPageName()}</span>
            </div>

            {/* Spacer for mobile */}
            <div className="md:hidden" style={{ flex: 1 }} />

            {/* User section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#64748b',
                        transition: 'all 0.15s ease',
                        minHeight: '36px'
                    }}
                    title="Toggle Language"
                >
                    <Globe size={16} />
                    <span>{language === 'en' ? 'EN' : 'हिं'}</span>
                </button>

                {/* Welcome text - Hidden on mobile */}
                <span
                    className="hidden md:block"
                    style={{
                        fontSize: '14px',
                        color: '#64748b'
                    }}
                >{t.welcome}, {getUserName()}</span>

                {/* Logout */}
                <button
                    onClick={logout}
                    style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#dc2626',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        transition: 'background 0.15s ease',
                        minHeight: '36px'
                    }}
                >
                    {t.logout}
                </button>
            </div>
        </div>
    );
}
