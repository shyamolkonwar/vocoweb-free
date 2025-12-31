'use client';

import { MessageCircle, Sparkles, Languages, Zap } from 'lucide-react';

export default function BentoFeatures() {
    return (
        <section className="bento-section" id="features">
            <div className="bento-container">
                <div className="bento-header">
                    <h2 className="bento-title">Everything you need. Nothing you don't.</h2>
                    <p className="bento-subtitle">
                        Purpose-built features for local businesses who want online presence without the hassle.
                    </p>
                </div>

                <div className="bento-grid">
                    {/* Large Card - WhatsApp First */}
                    <div className="bento-card large">
                        <div className="bento-card-icon">
                            <MessageCircle size={24} strokeWidth={1.5} />
                        </div>
                        <h3 className="bento-card-title">The &quot;WhatsApp First&quot; Engine</h3>
                        <p className="bento-card-desc">
                            Turn Visitors into WhatsApp Messages. We don&apos;t just show a phone number. We integrate a &quot;Book on WhatsApp&quot; button that opens a pre-filled chat. Zero friction for your customers.
                        </p>
                        <div className="bento-visual">
                            <div className="whatsapp-demo">
                                <div className="wa-button">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                    <span>Book on WhatsApp</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medium Card - Brand Voice */}
                    <div className="bento-card">
                        <div className="bento-card-icon">
                            <Sparkles size={24} strokeWidth={1.5} />
                        </div>
                        <h3 className="bento-card-title">Smart &quot;Brand Voice&quot; AI</h3>
                        <p className="bento-card-desc">
                            It Sounds Like You, Not a Robot. Tell us &quot;I&apos;m a friendly neighborhood bakery,&quot; and we write copy that feels warm and local, not corporate.
                        </p>
                        <div className="bento-visual">
                            <div className="brand-voice-demo">
                                <div className="voice-chip">✨ Friendly</div>
                                <div className="voice-chip">🏠 Local</div>
                                <div className="voice-chip">💚 Warm</div>
                            </div>
                        </div>
                    </div>

                    {/* Medium Card - Vernacular */}
                    <div className="bento-card">
                        <div className="bento-card-icon">
                            <Languages size={24} strokeWidth={1.5} />
                        </div>
                        <h3 className="bento-card-title">Vernacular & Global Support</h3>
                        <p className="bento-card-desc">
                            Speak in Hindi, Publish in English. Comfortable speaking Hindi? No problem. Our AI translates instantly.
                        </p>
                        <div className="bento-visual">
                            <div className="language-visual">
                                <span className="lang-pill active">हिंदी</span>
                                <span className="lang-arrow">→</span>
                                <span className="lang-pill active">English</span>
                            </div>
                        </div>
                    </div>

                    {/* Medium Card - Zero Touch */}
                    <div className="bento-card">
                        <div className="bento-card-icon">
                            <Zap size={24} strokeWidth={1.5} />
                        </div>
                        <h3 className="bento-card-title">Zero-Touch Maintenance</h3>
                        <p className="bento-card-desc">
                            Update Your Site While Walking. Just say &quot;Change the croissant price to ₹89.&quot; Done.
                        </p>
                        <div className="bento-visual">
                            <div className="voice-command-demo">
                                <div className="command-bubble">
                                    🎤 &quot;Change price to ₹89&quot;
                                </div>
                                <div className="command-result">✓ Updated instantly</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
