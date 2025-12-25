'use client';

interface TrustSignalsProps {
    language: 'en' | 'hi';
}

const content = {
    en: {
        title: "Why local businesses trust us",
        signals: [
            {
                icon: "🏪",
                title: "Built for small businesses",
                desc: "Designed specifically for shops, clinics, and local services"
            },
            {
                icon: "📱",
                title: "Mobile-friendly websites",
                desc: "Your website looks great on every device"
            },
            {
                icon: "🗣️",
                title: "Works in Hindi & English",
                desc: "Speak or type in your preferred language"
            },
            {
                icon: "🎯",
                title: "No technical knowledge required",
                desc: "Just describe your business, we handle everything"
            }
        ]
    },
    hi: {
        title: "Local businesses हम पर क्यों भरोसा करते हैं",
        signals: [
            {
                icon: "🏪",
                title: "Small businesses के लिए बना",
                desc: "Shops, clinics, और local services के लिए design किया गया"
            },
            {
                icon: "📱",
                title: "Mobile-friendly websites",
                desc: "आपकी website हर device पर बढ़िया दिखती है"
            },
            {
                icon: "🗣️",
                title: "Hindi और English में काम करे",
                desc: "अपनी पसंदीदा भाषा में बोलें या type करें"
            },
            {
                icon: "🎯",
                title: "Technical knowledge की ज़रूरत नहीं",
                desc: "बस अपना business बताएं, बाकी हम संभाल लेंगे"
            }
        ]
    }
};

export default function TrustSignals({ language }: TrustSignalsProps) {
    const t = content[language];

    return (
        <section className="trust-section">
            <div className="trust-container">
                <h2 className="trust-title">{t.title}</h2>

                <div className="trust-grid">
                    {t.signals.map((signal, index) => (
                        <div key={index} className="trust-card">
                            <div className="trust-icon">{signal.icon}</div>
                            <h3 className="trust-card-title">{signal.title}</h3>
                            <p className="trust-card-desc">{signal.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
