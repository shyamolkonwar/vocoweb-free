'use client';

import LanguageToggle from './LanguageToggle';

interface HeaderProps {
    language: 'en' | 'hi';
    setLanguage: (lang: 'en' | 'hi') => void;
}

export default function Header({ language, setLanguage }: HeaderProps) {
    return (
        <header className="site-header">
            <div className="header-container">
                <div className="header-logo">
                    <span className="logo-icon">◈</span>
                    <span className="logo-text">Setu</span>
                </div>

                <LanguageToggle language={language} setLanguage={setLanguage} />
            </div>
        </header>
    );
}
