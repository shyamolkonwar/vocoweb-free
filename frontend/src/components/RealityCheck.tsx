'use client';

import { Smartphone, Clock, Wallet } from 'lucide-react';

export default function RealityCheck() {
    const painPoints = [
        {
            icon: Smartphone,
            title: "WhatsApp isn't enough.",
            body: "You share photos on WhatsApp, but customers can't find you on Google. You answer the same questions (\"Price?\", \"Location?\") 50 times a day. You need a 24/7 digital receptionist.",
            color: '#f59e0b' // amber
        },
        {
            icon: Clock,
            title: "DIY Builders take weeks.",
            body: "Wix and WordPress ask you to move 1,000 pixels. You waste 20+ hours fighting with templates instead of running your business. Your time is worth more than that.",
            color: '#ef4444' // red
        },
        {
            icon: Wallet,
            title: "Agencies are expensive.",
            body: "Paying ₹15,000 ($500+) for a simple site is outdated. And when you need to change a price? You have to pay them again. VocoWeb is free and instant.",
            color: '#8b5cf6' // purple
        }
    ];

    return (
        <section className="reality-check-section">
            <div className="reality-check-container">
                <h2 className="reality-check-title">
                    Is your business invisible to 60% of your customers?
                </h2>

                <div className="reality-grid">
                    {painPoints.map((point, index) => (
                        <div key={index} className="reality-card">
                            <div className="reality-icon" style={{ background: `${point.color}15` }}>
                                <point.icon size={32} strokeWidth={1.5} style={{ color: point.color }} />
                            </div>
                            <h3 className="reality-card-title">{point.title}</h3>
                            <p className="reality-card-body">{point.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
