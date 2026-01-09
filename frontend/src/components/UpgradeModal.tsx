'use client';

/**
 * UpgradeModal Component
 * 
 * Displays when user tries to publish with insufficient credits.
 * Shows market-specific pricing and redirects to payment links.
 * Payment links are fetched from the backend API (database-driven).
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCredits: number;
    requiredCredits: number;
    market?: 'IN' | 'GLOBAL';
}

interface PaymentLinkData {
    market: string;
    plan_name: string;
    amount: number;
    currency: string;
    billing_type: string;
    provider: string;
    payment_url: string;
    features: string[];
}

// Fallback payment links if API fails
const FALLBACK_LINKS: Record<string, PaymentLinkData> = {
    IN: {
        market: 'IN',
        plan_name: 'pro',
        amount: 5999,
        currency: 'INR',
        billing_type: 'one-time',
        provider: 'razorpay',
        payment_url: 'https://razorpay.me/@vocoweb',
        features: ['Unlimited Credits', 'Custom Domain', 'WhatsApp Booking', 'Priority Support', 'Lifetime Updates']
    },
    GLOBAL: {
        market: 'GLOBAL',
        plan_name: 'pro',
        amount: 39,
        currency: 'USD',
        billing_type: 'monthly',
        provider: 'stripe',
        payment_url: 'https://buy.stripe.com/test',
        features: ['Unlimited Credits', 'Custom Domain', 'Contact Form Integration', 'Priority Support', 'Monthly Updates']
    }
};

export default function UpgradeModal({
    isOpen,
    onClose,
    currentCredits,
    requiredCredits,
    market = 'GLOBAL'
}: UpgradeModalProps) {
    const [paymentData, setPaymentData] = useState<PaymentLinkData>(FALLBACK_LINKS[market]);
    const [loading, setLoading] = useState(true);
    const creditsNeeded = requiredCredits - currentCredits;

    // Fetch payment link from API
    useEffect(() => {
        if (isOpen) {
            fetchPaymentLink();
        }
    }, [isOpen, market]);

    const fetchPaymentLink = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/websites/payment-links?market=${market}`);
            if (response.ok) {
                const data = await response.json();
                setPaymentData(data);
            }
        } catch (err) {
            console.error('Failed to fetch payment link:', err);
            // Keep fallback data
        } finally {
            setLoading(false);
        }
    };

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleUpgrade = () => {
        window.open(paymentData.payment_url, '_blank');
    };

    // Format price display
    const formatPrice = () => {
        if (paymentData.currency === 'INR') {
            return `₹${paymentData.amount.toLocaleString()}`;
        }
        return `$${paymentData.amount}`;
    };

    const isLifetime = paymentData.billing_type === 'one-time';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
            }}
        >
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)'
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'relative',
                background: '#ffffff',
                borderRadius: '24px',
                maxWidth: '440px',
                width: '100%',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                animation: 'modalSlideIn 0.3s ease-out'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <X size={20} color="#64748b" />
                </button>

                {/* Icon */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    marginBottom: '24px'
                }}>
                    🚀
                </div>

                {/* Title */}
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#0f172a',
                    marginBottom: '12px'
                }}>
                    Ready to Go Live?
                </h2>

                {/* Description */}
                <p style={{
                    color: '#64748b',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    marginBottom: '24px'
                }}>
                    You need <strong style={{ color: '#166534' }}>{creditsNeeded} more credits</strong> to publish your website.
                    Upgrade to Pro for unlimited publishing and a custom domain!
                </p>

                {/* Credits Display */}
                <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Your Balance</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>{currentCredits} credits</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Required</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#166534' }}>{requiredCredits} credits</div>
                    </div>
                </div>

                {/* Pricing Card */}
                <div style={{
                    border: '2px solid #22c55e',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '24px',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '8px',
                        marginBottom: '12px'
                    }}>
                        <span style={{ fontSize: '2rem', fontWeight: '800', color: '#166534' }}>
                            {formatPrice()}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>
                            {isLifetime ? 'one-time' : `/${paymentData.billing_type}`}
                        </span>
                        {isLifetime && (
                            <span style={{
                                background: '#dcfce7',
                                color: '#16a34a',
                                padding: '4px 8px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: '600'
                            }}>
                                LIFETIME
                            </span>
                        )}
                    </div>

                    {/* Features */}
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {(paymentData.features || []).map((feature, i) => (
                            <li key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 0',
                                fontSize: '14px',
                                color: '#374151'
                            }}>
                                <span style={{ color: '#22c55e', fontWeight: '600' }}>✓</span>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CTA Button */}
                <button
                    onClick={handleUpgrade}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(22, 101, 52, 0.4)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(22, 101, 52, 0.5)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(22, 101, 52, 0.4)';
                    }}
                >
                    {isLifetime ? 'Get Lifetime Access' : 'Upgrade to Pro'}
                </button>

                {/* Trust Note */}
                <p style={{
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '12px',
                    marginTop: '16px'
                }}>
                    🔒 Secure payment via {paymentData.provider.charAt(0).toUpperCase() + paymentData.provider.slice(1)}
                </p>
            </div>

            {/* Animation Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}} />
        </div>
    );
}
