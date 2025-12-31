'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './auth/AuthModal';

interface HeaderProps {
    language: 'en' | 'hi';
    setLanguage: (lang: 'en' | 'hi') => void;
    isAppMode?: boolean;
}

const content = {
    en: {
        features: 'Features',
        useCases: 'Use Cases',
        pricing: 'Pricing',
        faq: 'FAQ',
        login: 'Login',
        logout: 'Logout',
        dashboard: 'Dashboard',
        getStarted: 'Get Started'
    },
    hi: {
        features: 'Features',
        useCases: 'Use Cases',
        pricing: 'Pricing',
        faq: 'FAQ',
        login: 'Login करें',
        logout: 'Logout करें',
        dashboard: 'Dashboard',
        getStarted: 'शुरू करें'
    }
};

export default function Header({ language, setLanguage, isAppMode = false }: HeaderProps) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const t = content[language];

    // Handle scroll for header background
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const handleLogout = async () => {
        setShowDropdown(false);
        await logout();
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const handleNavClick = (href: string) => {
        closeMobileMenu();
        const element = document.querySelector(href);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

    const headerClasses = `site-header on-dark ${isScrolled ? 'scrolled' : ''} ${isAppMode ? 'app-mode' : ''}`;

    return (
        <>
            <header className={headerClasses}>
                <div className="header-container">
                    <Link href="/" className="header-logo">
                        <span className="logo-icon">◈</span>
                        <span className="logo-text">VocoWeb</span>
                    </Link>

                    {/* Desktop Navigation */}
                    {!isAppMode && (
                        <nav className="nav-links">
                            <a href="#features" className="nav-link">{t.features}</a>
                            <a href="#use-cases" className="nav-link">{t.useCases}</a>
                            <a href="#pricing" className="nav-link">{t.pricing}</a>
                            <a href="#faq" className="nav-link">{t.faq}</a>
                        </nav>
                    )}

                    <div className="header-right">
                        <div className="desktop-only">
                            <LanguageToggle language={language} setLanguage={setLanguage} />
                        </div>

                        {!isLoading && (
                            <>
                                {isAuthenticated && user ? (
                                    <div className="user-menu desktop-only" ref={dropdownRef}>
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
                                    <>
                                        <Link
                                            href="/login"
                                            className="btn-primary glow-accent desktop-only"
                                            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', minWidth: 'auto' }}
                                        >
                                            {t.login}
                                        </Link>
                                    </>
                                )}
                            </>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <div className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Drawer */}
            <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-content">
                    {/* Close Button */}
                    <button
                        className="mobile-menu-close"
                        onClick={closeMobileMenu}
                        aria-label="Close menu"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    <nav className="mobile-nav-links">
                        <a href="#features" className="mobile-nav-link" onClick={() => handleNavClick('#features')}>
                            {t.features}
                        </a>
                        <a href="#use-cases" className="mobile-nav-link" onClick={() => handleNavClick('#use-cases')}>
                            {t.useCases}
                        </a>
                        <a href="#pricing" className="mobile-nav-link" onClick={() => handleNavClick('#pricing')}>
                            {t.pricing}
                        </a>
                        <a href="#faq" className="mobile-nav-link" onClick={() => handleNavClick('#faq')}>
                            {t.faq}
                        </a>
                        <div className="mobile-menu-divider"></div>
                        {!isLoading && !isAuthenticated && (
                            <Link
                                href="/login"
                                className="mobile-nav-link"
                                onClick={closeMobileMenu}
                            >
                                {t.login}
                            </Link>
                        )}
                        {isAuthenticated && user && (
                            <a href="/dashboard" className="mobile-nav-link" onClick={closeMobileMenu}>
                                {t.dashboard}
                            </a>
                        )}
                    </nav>
                    <div className="mobile-menu-footer">
                        <LanguageToggle language={language} setLanguage={setLanguage} />
                        {!isLoading && !isAuthenticated && (
                            <Link
                                href="/create"
                                className="mobile-cta-btn"
                                onClick={closeMobileMenu}
                            >
                                {t.getStarted}
                            </Link>
                        )}
                        {isAuthenticated && (
                            <button
                                className="mobile-cta-btn"
                                onClick={() => {
                                    closeMobileMenu();
                                    handleLogout();
                                }}
                            >
                                {t.logout}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showAuthModal && (
                <AuthModal
                    language={language}
                    onClose={() => setShowAuthModal(false)}
                />
            )}
        </>
    );
}
