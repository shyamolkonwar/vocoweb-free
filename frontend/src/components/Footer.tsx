'use client';

import { Twitter, Linkedin, Instagram } from 'lucide-react';

interface FooterProps {
    language: 'en' | 'hi';
}

const content = {
    en: {
        brand: {
            tagline: 'Empowering local businesses with instant, voice-powered websites. No coding required.',
            socialProof: 'Trusted by 5,000+ Businesses'
        },
        product: {
            title: 'PRODUCT',
            links: [
                { name: 'Features', href: '#features' },
                { name: 'Pricing', href: '#pricing', badge: 'Beta Free' },
                { name: 'Showcase', href: '#use-cases' },
                { name: 'Login', href: '/login' }
            ]
        },
        resources: {
            title: 'RESOURCES',
            links: [
                { name: 'Help Center', href: '/help' },
                { name: 'Compare vs Wix', href: '/compare' },
                { name: 'Creator Community', href: '/community' }
            ]
        },
        legal: {
            title: 'LEGAL',
            links: [
                { name: 'Privacy', href: '/privacy' },
                { name: 'Terms', href: '/terms' },
                { name: 'Report Abuse', href: '/report' }
            ]
        },
        bottomBar: {
            copyright: '© 2025 VocoWeb.',
            madeIn: 'Made with ❤️ in Assam, India.'
        }
    },
    hi: {
        brand: {
            tagline: 'स्थानीय व्यवसायों को तुरंत, वॉइस-पावर वेबसाइट के साथ सशक्त बनाना। कोडिंग की आवश्यकता नहीं।',
            socialProof: '5,000+ व्यवसायों का भरोसा'
        },
        product: {
            title: 'PRODUCT',
            links: [
                { name: 'Features', href: '#features' },
                { name: 'Pricing', href: '#pricing', badge: 'Beta Free' },
                { name: 'Showcase', href: '#use-cases' },
                { name: 'Login', href: '/login' }
            ]
        },
        resources: {
            title: 'RESOURCES',
            links: [
                { name: 'Help Center', href: '/help' },
                { name: 'Compare vs Wix', href: '/compare' },
                { name: 'Creator Community', href: '/community' }
            ]
        },
        legal: {
            title: 'LEGAL',
            links: [
                { name: 'Privacy', href: '/privacy' },
                { name: 'Terms', href: '/terms' },
                { name: 'Report Abuse', href: '/report' }
            ]
        },
        bottomBar: {
            copyright: '© 2025 VocoWeb.',
            madeIn: 'असम, भारत में ❤️ से बनाया गया।'
        }
    }
};

export default function Footer({ language }: FooterProps) {
    const t = content[language];

    return (
        <footer className="site-footer-v2">
            <div className="footer-container-v2">
                {/* Top Row - Main Footer */}
                <div className="footer-top-row">
                    {/* Brand Column */}
                    <div className="footer-brand-col">
                        <div className="footer-logo-v2">
                            <span className="logo-icon">◈</span>
                            <span className="logo-text">VocoWeb</span>
                        </div>
                        <p className="footer-tagline">{t.brand.tagline}</p>
                        <div className="footer-social-proof-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>{t.brand.socialProof}</span>
                        </div>
                        <div className="footer-social-icons">
                            <a href="https://twitter.com/vocoweb" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                <Twitter size={20} />
                            </a>
                            <a href="https://linkedin.com/company/vocoweb" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                <Linkedin size={20} />
                            </a>
                            <a href="https://instagram.com/vocoweb" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <Instagram size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Link Columns */}
                    <div className="footer-links-grid">
                        {/* Product Column */}
                        <div className="footer-link-col">
                            <h3 className="footer-col-title">{t.product.title}</h3>
                            <ul className="footer-link-list">
                                {t.product.links.map((link, index) => (
                                    <li key={index}>
                                        <a href={link.href} className="footer-link">
                                            {link.name}
                                            {link.badge && <span className="footer-link-badge">{link.badge}</span>}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Resources Column */}
                        <div className="footer-link-col">
                            <h3 className="footer-col-title">{t.resources.title}</h3>
                            <ul className="footer-link-list">
                                {t.resources.links.map((link, index) => (
                                    <li key={index}>
                                        <a href={link.href} className="footer-link">
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal Column */}
                        <div className="footer-link-col">
                            <h3 className="footer-col-title">{t.legal.title}</h3>
                            <ul className="footer-link-list">
                                {t.legal.links.map((link, index) => (
                                    <li key={index}>
                                        <a href={link.href} className="footer-link">
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Row - Legal Bar */}
                <div className="footer-bottom-row">
                    <div className="footer-copyright">{t.bottomBar.copyright}</div>
                    <div className="footer-made-in">{t.bottomBar.madeIn}</div>
                </div>
            </div>
        </footer>
    );
}
