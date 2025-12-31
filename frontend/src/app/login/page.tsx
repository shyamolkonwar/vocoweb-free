'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const [language, setLanguage] = useState<'en' | 'hi'>('en');
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    const content = {
        en: {
            brand: {
                testimonial: '"I set up my clinic\'s website in the time it took to drink my chai. Simple and brilliant."',
                author: '— Dr. Sharma, Dental Care Pune',
                trusted: 'Trusted by 5,000+ businesses'
            },
            form: {
                title: 'Welcome to VocoWeb',
                subtitle: 'Don\'t have an account?',
                createAccount: 'Create one for free',
                continueWith: 'Continue with Google',
                terms: 'By clicking continue, you agree to our',
                termsLink: 'Terms of Service',
                privacyLink: 'Privacy Policy',
                and: 'and'
            }
        },
        hi: {
            brand: {
                testimonial: '"मैंने अपनी clinic की website चाय पीने में लगे समय में बना ली। बहुत आसान!"',
                author: '— डॉ. शर्मा, Dental Care Pune',
                trusted: '5,000+ businesses का भरोसा'
            },
            form: {
                title: 'VocoWeb में आपका स्वागत है',
                subtitle: 'Account नहीं है?',
                createAccount: 'Free में बनाएं',
                continueWith: 'Google से जारी रखें',
                terms: 'Continue करके आप हमारी',
                termsLink: 'Terms of Service',
                privacyLink: 'Privacy Policy',
                and: 'और'
            }
        }
    };

    const t = content[language];

    // Redirect if already logged in
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="login-page-split">
                <div className="login-brand-wall">
                    <div className="brand-wall-content">
                        <Link href="/" className="brand-wall-logo">
                            <span className="logo-icon">◈</span>
                            <span className="logo-text">VocoWeb</span>
                        </Link>
                    </div>
                </div>
                <div className="login-form-zone">
                    <div className="form-zone-content">
                        <div className="auth-loading">
                            <div className="spinner large"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page-split">
            {/* Left Side - Brand Wall (40%) */}
            <div className="login-brand-wall">
                <div className="brand-wall-content">
                    <Link href="/" className="brand-wall-logo">
                        <span className="logo-icon">◈</span>
                        <span className="logo-text">VocoWeb</span>
                    </Link>

                    <div className="brand-wall-testimonial">
                        <p className="testimonial-quote">{t.brand.testimonial}</p>
                        <p className="testimonial-author">{t.brand.author}</p>
                    </div>

                    <div className="brand-wall-footer">
                        <p className="trusted-badge">{t.brand.trusted}</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Zone (60%) */}
            <div className="login-form-zone">
                <div className="form-zone-header">
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                        className="lang-toggle-btn"
                    >
                        {language === 'en' ? 'हिंदी' : 'EN'}
                    </button>
                </div>

                <div className="form-zone-content">
                    <div className="login-form-container">
                        <div className="login-form-header">
                            <h1 className="login-title">{t.form.title}</h1>
                            <p className="login-subtitle">
                                {t.form.subtitle}{' '}
                                <Link href="/create" className="create-account-link">
                                    {t.form.createAccount}
                                </Link>
                            </p>
                        </div>

                        <div className="login-form-actions">
                            <GoogleLoginButton language={language} />
                        </div>

                        <p className="login-terms">
                            {t.form.terms}{' '}
                            <Link href="/terms" className="terms-link">{t.form.termsLink}</Link>
                            {' '}{t.form.and}{' '}
                            <Link href="/privacy" className="terms-link">{t.form.privacyLink}</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
