'use client';

interface FooterProps {
    language: 'en' | 'hi';
}

const content = {
    en: {
        tagline: "We don't sell websites. We take responsibility for your website.",
        copyright: "© 2024 Setu. Built with ❤️ for local businesses.",
        links: {
            about: "About",
            contact: "Contact",
            privacy: "Privacy"
        }
    },
    hi: {
        tagline: "हम websites नहीं बेचते। हम आपकी website की ज़िम्मेदारी लेते हैं।",
        copyright: "© 2024 Setu. Local businesses के लिए ❤️ से बनाया।",
        links: {
            about: "हमारे बारे में",
            contact: "संपर्क",
            privacy: "Privacy"
        }
    }
};

export default function Footer({ language }: FooterProps) {
    const t = content[language];

    return (
        <footer className="site-footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <div className="footer-logo">
                        <span className="logo-icon">◈</span>
                        <span className="logo-text">Setu</span>
                    </div>
                    <p className="footer-tagline">{t.tagline}</p>
                </div>

                <div className="footer-links">
                    <a href="#about">{t.links.about}</a>
                    <a href="#contact">{t.links.contact}</a>
                    <a href="#privacy">{t.links.privacy}</a>
                </div>

                <div className="footer-bottom">
                    <p>{t.copyright}</p>
                </div>
            </div>
        </footer>
    );
}
