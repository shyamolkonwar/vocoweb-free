'use client';

interface FeaturesProps {
    language: 'en' | 'hi';
}

const content = {
    en: {
        title: "How it works",
        subtitle: "Three simple steps to your professional website",
        steps: [
            {
                number: "01",
                title: "Describe your business",
                desc: "Tell us about your business using voice or text. It takes less than 2 minutes.",
                example: '"I run a dental clinic in Dibrugarh"'
            },
            {
                number: "02",
                title: "Preview your website",
                desc: "AI creates a professional website tailored to your business. Edit if needed.",
                example: "Mobile + Desktop preview"
            },
            {
                number: "03",
                title: "Go live instantly",
                desc: "One click and your website is live. Share it with customers immediately.",
                example: "yoursite.laxizen.fun"
            }
        ]
    },
    hi: {
        title: "यह कैसे काम करता है",
        subtitle: "तीन आसान steps में professional website",
        steps: [
            {
                number: "01",
                title: "अपने business के बारे में बताएं",
                desc: "Voice या text से अपने business के बारे में बताएं। 2 मिनट से कम लगेगा।",
                example: '"मैं Dibrugarh में dental clinic चलाता हूं"'
            },
            {
                number: "02",
                title: "Website preview देखें",
                desc: "AI आपके business के लिए professional website बनाता है। ज़रूरत हो तो edit करें।",
                example: "Mobile + Desktop preview"
            },
            {
                number: "03",
                title: "तुरंत live करें",
                desc: "एक click और आपकी website live। तुरंत customers के साथ share करें।",
                example: "yoursite.laxizen.fun"
            }
        ]
    }
};

export default function Features({ language }: FeaturesProps) {
    const t = content[language];

    return (
        <section id="features-section" className="features-section">
            <div className="features-container">
                <div className="features-header">
                    <h2 className="features-title">{t.title}</h2>
                    <p className="features-subtitle">{t.subtitle}</p>
                </div>

                <div className="features-steps">
                    {t.steps.map((step, index) => (
                        <div key={index} className="feature-step">
                            <div className="step-number">{step.number}</div>
                            <div className="step-content">
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-desc">{step.desc}</p>
                                <div className="step-example">{step.example}</div>
                            </div>
                            {index < t.steps.length - 1 && (
                                <div className="step-connector">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
