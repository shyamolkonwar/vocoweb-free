'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './auth/AuthModal';

interface HeaderProps {
    language: 'en' | 'hi';
    setLanguage: (lang: 'en' | 'hi') => void;
}

const content = {
    en: {
        login: 'Login',
        logout: 'Logout',
        profile: 'Profile',
        dashboard: 'Dashboard'
    },
    hi: {
        login: 'Login करें',
        logout: 'Logout करें',
        profile: 'Profile',
        dashboard: 'Dashboard'
    }
};

export default function Header({ language, setLanguage }: HeaderProps) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const t = content[language];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setShowDropdown(false);
        await logout();
    };

    // Get user initials or first letter of email
    const getUserInitial = () => {
        if (user?.user_metadata?.full_name) {
            return user.user_metadata.full_name.charAt(0).toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return '?';
    };

    // Get avatar URL or fallback
    const getAvatarUrl = () => {
        return user?.user_metadata?.avatar_url || null;
    };

    return (
        <>
            <header className="site-header">
                <div className="header-container">
                    <Link href="/" className="header-logo">
                        <span className="logo-icon">◈</span>
                        <span className="logo-text">Laxizen</span>
                    </Link>

                    <div className="header-right">
                        <LanguageToggle language={language} setLanguage={setLanguage} />

                        {!isLoading && (
                            <>
                                {isAuthenticated && user ? (
                                    <div className="user-menu" ref={dropdownRef}>
                                        <button
                                            className="user-avatar-btn"
                                            onClick={() => setShowDropdown(!showDropdown)}
                                            aria-label="User menu"
                                        >
                                            {getAvatarUrl() ? (
                                                <img
                                                    src={getAvatarUrl()!}
                                                    alt="User avatar"
                                                    className="user-avatar-img"
                                                />
                                            ) : (
                                                <span className="user-avatar-initial">
                                                    {getUserInitial()}
                                                </span>
                                            )}
                                        </button>

                                        {showDropdown && (
                                            <div className="user-dropdown">
                                                <div className="user-dropdown-header">
                                                    <span className="user-email">{user.email}</span>
                                                </div>
                                                <div className="user-dropdown-divider" />
                                                <a
                                                    href="/dashboard"
                                                    className="user-dropdown-item"
                                                    onClick={() => setShowDropdown(false)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="3" width="7" height="7" />
                                                        <rect x="14" y="3" width="7" height="7" />
                                                        <rect x="14" y="14" width="7" height="7" />
                                                        <rect x="3" y="14" width="7" height="7" />
                                                    </svg>
                                                    {t.dashboard}
                                                </a>
                                                <button
                                                    className="user-dropdown-item"
                                                    onClick={handleLogout}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                        <polyline points="16 17 21 12 16 7" />
                                                        <line x1="21" y1="12" x2="9" y2="12" />
                                                    </svg>
                                                    {t.logout}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        className="btn-login"
                                        onClick={() => setShowAuthModal(true)}
                                    >
                                        {t.login}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </header>

            {showAuthModal && (
                <AuthModal
                    language={language}
                    onClose={() => setShowAuthModal(false)}
                />
            )}
        </>
    );
}
