'use client';

import { useState } from 'react';

interface WaitlistFormProps {
    language: 'en' | 'hi';
    onClose: () => void;
}

const content = {
    en: {
        title: "Get Early Access",
        subtitle: "Be the first to build your website with AI.",
        emailLabel: "Email or WhatsApp",
        emailPlaceholder: "your@email.com or phone number",
        businessLabel: "Your Business (optional)",
        businessPlaceholder: "e.g., Dental clinic in Dibrugarh",
        submit: "Join Waitlist",
        submitting: "Joining...",
        success: "🎉 You're on the list!",
        successMsg: "We'll reach out when we launch.",
        error: "Something went wrong. Please try again.",
        close: "Close"
    },
    hi: {
        title: "Early Access पाएं",
        subtitle: "AI से अपनी website बनाने वाले पहले लोगों में शामिल हों।",
        emailLabel: "Email या WhatsApp",
        emailPlaceholder: "आपका email या phone number",
        businessLabel: "आपका Business (optional)",
        businessPlaceholder: "जैसे: Dibrugarh में Dental clinic",
        submit: "Waitlist में शामिल हों",
        submitting: "जुड़ रहे हैं...",
        success: "🎉 आप list में हैं!",
        successMsg: "Launch होते ही हम आपसे संपर्क करेंगे।",
        error: "कुछ गलत हो गया। कृपया फिर से try करें।",
        close: "बंद करें"
    }
};

export default function WaitlistForm({ language, onClose }: WaitlistFormProps) {
    const [contact, setContact] = useState('');
    const [business, setBusiness] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const t = content[language];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact.trim()) return;

        setStatus('loading');

        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contact, business, language })
            });

            if (response.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {status === 'success' ? (
                    <div className="form-success">
                        <div className="success-icon">✓</div>
                        <h3>{t.success}</h3>
                        <p>{t.successMsg}</p>
                        <button className="btn-primary" onClick={onClose}>
                            {t.close}
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="modal-title">{t.title}</h2>
                        <p className="modal-subtitle">{t.subtitle}</p>

                        <form onSubmit={handleSubmit} className="waitlist-form">
                            <div className="form-group">
                                <label htmlFor="contact">{t.emailLabel}</label>
                                <input
                                    id="contact"
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder={t.emailPlaceholder}
                                    required
                                    disabled={status === 'loading'}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="business">{t.businessLabel}</label>
                                <input
                                    id="business"
                                    type="text"
                                    value={business}
                                    onChange={(e) => setBusiness(e.target.value)}
                                    placeholder={t.businessPlaceholder}
                                    disabled={status === 'loading'}
                                />
                            </div>

                            {status === 'error' && (
                                <p className="form-error">{t.error}</p>
                            )}

                            <button
                                type="submit"
                                className="btn-primary btn-full"
                                disabled={status === 'loading' || !contact.trim()}
                            >
                                {status === 'loading' ? t.submitting : t.submit}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
