'use client';

/**
 * India Landing Page (/in)
 * 
 * Target: Indian small business owners
 * Focus: WhatsApp, Trust, Simplicity, Lifetime Deal
 * Tone: Friendly, Accessible, No jargon
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import RealityCheck from '@/components/RealityCheck';
import UseCasesTicker from '@/components/UseCasesTicker';
import BentoFeatures from '@/components/BentoFeatures';
import VersusComparison from '@/components/VersusComparison';
import UseCaseCarousel from '@/components/UseCaseCarousel';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function IndiaLanding() {
    const [language, setLanguage] = useState<'en' | 'hi'>('en');
    const router = useRouter();

    // Set market cookie when component mounts
    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.cookie = 'NEXT_LOCALE=in; max-age=31536000; path=/';
        }
    }, []);

    return (
        <div className="app">
            <Header language={language} setLanguage={setLanguage} />
            <main>
                {/* Hero Section - Existing component */}
                <Hero language={language} />

                {/* Reality Check - Value prop */}
                <RealityCheck />

                {/* Use Cases Ticker */}
                <UseCasesTicker />

                {/* WhatsApp Feature Highlight */}
                <BentoFeatures />

                {/* Versus Comparison */}
                <VersusComparison />

                {/* Use Case Carousel */}
                <UseCaseCarousel />

                {/* India-Specific Pricing - Lifetime Deal */}
                <section id="pricing" style={{
                    padding: '80px 16px',
                    background: 'linear-gradient(180deg, #f9fafb 0%, #ffffff 100%)'
                }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            marginBottom: '16px',
                            color: '#111827'
                        }}>
                            {language === 'hi' ? 'एक बार का भुगतान, हमेशा के लिए आपका' : 'One-Time Payment, Yours Forever'}
                        </h2>
                        <p style={{
                            fontSize: '1.25rem',
                            color: '#6b7280',
                            marginBottom: '48px'
                        }}>
                            No monthly fees. No renewal charges. Pay once, own forever.
                        </p>

                        {/* Pricing Card */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                            padding: '48px 40px',
                            maxWidth: '420px',
                            margin: '0 auto',
                            border: '4px solid #22c55e',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Badge */}
                            <div style={{
                                background: '#dcfce7',
                                color: '#16a34a',
                                padding: '8px 16px',
                                borderRadius: '999px',
                                fontSize: '14px',
                                fontWeight: '700',
                                display: 'inline-block',
                                marginBottom: '24px'
                            }}>
                                🇮🇳 LIFETIME DEAL
                            </div>

                            {/* Price */}
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{
                                    fontSize: '4rem',
                                    fontWeight: 'bold',
                                    color: '#111827'
                                }}>₹5,999</span>
                                <span style={{
                                    fontSize: '1.25rem',
                                    color: '#9ca3af',
                                    textDecoration: 'line-through',
                                    marginLeft: '12px'
                                }}>₹15,000</span>
                            </div>

                            <div style={{
                                color: '#16a34a',
                                fontWeight: '600',
                                marginBottom: '32px',
                                fontSize: '1rem'
                            }}>
                                60% OFF - Limited Time
                            </div>

                            {/* Features */}
                            <ul style={{
                                textAlign: 'left',
                                listStyle: 'none',
                                padding: 0,
                                margin: '0 0 32px 0'
                            }}>
                                {[
                                    'WhatsApp Appointment Booking',
                                    'Hindi + English Support',
                                    'Free Hosting Forever',
                                    'Custom Domain Connection',
                                    'Mobile-Optimized Design',
                                    'Lifetime Updates'
                                ].map((feature, i) => (
                                    <li key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px 0',
                                        borderBottom: i < 5 ? '1px solid #f3f4f6' : 'none',
                                        color: '#374151',
                                        fontSize: '16px'
                                    }}>
                                        <span style={{
                                            color: '#22c55e',
                                            fontWeight: 'bold',
                                            marginRight: '12px',
                                            fontSize: '18px'
                                        }}>✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <button
                                onClick={() => router.push('/create?market=IN')}
                                style={{
                                    width: '100%',
                                    padding: '18px 32px',
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    backgroundColor: '#166534',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 14px rgba(22, 101, 52, 0.4)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#15803d';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = '#166534';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {language === 'hi' ? 'अभी Website बनाएं' : 'Create Website Now'}
                            </button>

                            {/* Trust badges */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '24px',
                                marginTop: '24px',
                                color: '#6b7280',
                                fontSize: '14px'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg width="16" height="16" fill="#22c55e" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    UPI Accepted
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg width="16" height="16" fill="#22c55e" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Secure Payment
                                </span>
                            </div>
                        </div>

                        {/* WhatsApp Help */}
                        <div style={{
                            marginTop: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}>
                            <a
                                href="https://wa.me/919876543210?text=I%20want%20to%20create%20a%20website"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#16a34a',
                                    fontWeight: '500',
                                    textDecoration: 'none'
                                }}
                            >
                                {language === 'hi' ? 'WhatsApp पर मदद चाहिए?' : 'Need Help? WhatsApp Us'}
                            </a>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <FAQ />

                {/* Trust Badges Section */}
                <section style={{
                    padding: '48px 16px',
                    background: '#ffffff',
                    borderTop: '1px solid #e5e7eb'
                }}>
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '48px'
                    }}>
                        {[
                            { icon: '🇮🇳', text: 'Made in India' },
                            { icon: '✓', text: 'No Hidden Fees' },
                            { icon: '🛡️', text: 'Verified & Secure' },
                            { icon: '📞', text: 'Hindi Support' }
                        ].map((badge, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                color: '#374151',
                                fontSize: '16px',
                                fontWeight: '500'
                            }}>
                                <span style={{
                                    fontSize: '24px',
                                    color: badge.icon === '✓' ? '#22c55e' : undefined
                                }}>{badge.icon}</span>
                                <span>{badge.text}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer language={language} />
        </div>
    );
}
