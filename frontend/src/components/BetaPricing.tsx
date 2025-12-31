'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

export default function BetaPricing() {
    const features = [
        'Unlimited AI Re-generations',
        'Free Hosting (Forever)',
        'Mobile-Optimized Site',
        'SEO Auto-Setup',
        'WhatsApp Booking Integration',
        'Hindi + English Support'
    ];

    return (
        <section className="beta-section" id="pricing">
            <div className="beta-container">
                <div className="beta-card">
                    <span className="beta-badge">Early Adopter Pass</span>
                    <h2 className="beta-title">Professional Websites usually cost ₹15,000</h2>
                    <p className="beta-subtitle">
                        Join the VocoWeb Beta and get yours for <strong>FREE</strong> today.
                    </p>

                    <div className="beta-pricing">
                        <div className="beta-original-price">₹999/month</div>
                        <div className="beta-current-price">FREE Forever</div>
                        <div className="beta-scarcity">For the next 100 users</div>
                    </div>

                    <ul className="beta-features">
                        {features.map((feature, index) => (
                            <li key={index}>
                                <Check size={18} strokeWidth={2} />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="beta-cta">
                        <Link href="/create" className="btn-primary-dark btn-full">
                            Claim My Free Account
                        </Link>
                    </div>

                    <p className="beta-spots">No credit card required. No hidden renewal fees.</p>
                </div>
            </div>
        </section>
    );
}
