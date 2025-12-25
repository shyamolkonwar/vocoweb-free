'use client';

interface LanguageToggleProps {
    language: 'en' | 'hi';
    setLanguage: (lang: 'en' | 'hi') => void;
}

export default function LanguageToggle({ language, setLanguage }: LanguageToggleProps) {
    return (
        <div className="language-toggle">
            <button
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
                aria-label="Switch to English"
            >
                EN
            </button>
            <button
                className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
                onClick={() => setLanguage('hi')}
                aria-label="Switch to Hindi"
            >
                हिं
            </button>
        </div>
    );
}
