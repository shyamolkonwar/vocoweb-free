'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const examples = {
    en: [
        "I run a dental clinic in Dibrugarh. We offer teeth cleaning, root canal, and braces.",
        "My bakery in Patna sells cakes, pastries, and fresh bread. We do home delivery.",
        "I teach math and science tuition for classes 8-12 in Indore.",
        "We run a hardware store in Guwahati selling paints, tools, and plumbing supplies."
    ],
    hi: [
        "मैं Dibrugarh में dental clinic चलाता हूं। हम teeth cleaning, root canal, और braces करते हैं।",
        "मेरी Patna में bakery है जहाँ cakes, pastries, और fresh bread मिलती है। Home delivery भी करते हैं।",
        "मैं Indore में class 8-12 के लिए math और science tuition पढ़ाता हूं।",
        "हमारी Guwahati में hardware shop है जहाँ paints, tools, और plumbing supplies मिलते हैं।"
    ]
};

const content = {
    en: {
        title: "Tell us about your business",
        subtitle: "Describe your business in a few sentences. We'll create a professional website for you.",
        placeholder: "Example: I run a dental clinic in Dibrugarh. We specialize in teeth cleaning, root canal treatment, and braces. Our clinic is open from 9 AM to 8 PM.",
        examplesTitle: "Need inspiration? Try these:",
        generate: "Generate My Website",
        generating: "Creating your website...",
        charCount: "characters",
        minChars: "Minimum 20 characters"
    },
    hi: {
        title: "अपने business के बारे में बताएं",
        subtitle: "कुछ lines में अपना business describe करें। हम आपके लिए professional website बनाएंगे।",
        placeholder: "जैसे: मैं Dibrugarh में dental clinic चलाता हूं। हम teeth cleaning, root canal, और braces में specialize करते हैं। Clinic सुबह 9 से रात 8 बजे तक खुला है।",
        examplesTitle: "Ideas चाहिए? ये try करें:",
        generate: "मेरी Website बनाएं",
        generating: "Website बना रहे हैं...",
        charCount: "characters",
        minChars: "कम से कम 20 characters"
    }
};

export default function CreatePage() {
    const [language, setLanguage] = useState<'en' | 'hi'>('en');
    const [businessDesc, setBusinessDesc] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const t = content[language];

    const handleGenerate = async () => {
        if (businessDesc.trim().length < 20) {
            setError(t.minChars);
            return;
        }

        setError('');
        setIsGenerating(true);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: businessDesc,
                    language
                })
            });

            const data = await response.json();

            if (response.ok && data.id) {
                router.push(`/preview/${data.id}`);
            } else {
                setError(data.error || 'Something went wrong');
                setIsGenerating(false);
            }
        } catch {
            setError('Failed to generate website');
            setIsGenerating(false);
        }
    };

    const useExample = (example: string) => {
        setBusinessDesc(example);
        setError('');
    };

    return (
        <div className="app">
            <Header language={language} setLanguage={setLanguage} />

            <main className="create-page">
                <div className="create-container">
                    <div className="create-header">
                        <h1 className="create-title">{t.title}</h1>
                        <p className="create-subtitle">{t.subtitle}</p>
                    </div>

                    <div className="create-form">
                        <div className="input-wrapper">
                            <textarea
                                value={businessDesc}
                                onChange={(e) => {
                                    setBusinessDesc(e.target.value);
                                    setError('');
                                }}
                                placeholder={t.placeholder}
                                className="business-input"
                                rows={6}
                                disabled={isGenerating}
                            />
                            <div className="input-footer">
                                <span className={`char-count ${businessDesc.length < 20 ? 'low' : ''}`}>
                                    {businessDesc.length} {t.charCount}
                                </span>
                            </div>
                        </div>

                        {error && <p className="form-error">{error}</p>}

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || businessDesc.trim().length < 20}
                            className="btn-primary btn-full btn-large"
                        >
                            {isGenerating ? (
                                <>
                                    <span className="spinner"></span>
                                    {t.generating}
                                </>
                            ) : (
                                t.generate
                            )}
                        </button>
                    </div>

                    <div className="examples-section">
                        <h3 className="examples-title">{t.examplesTitle}</h3>
                        <div className="examples-grid">
                            {examples[language].map((example, index) => (
                                <button
                                    key={index}
                                    onClick={() => useExample(example)}
                                    className="example-card"
                                    disabled={isGenerating}
                                >
                                    "{example}"
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer language={language} />
        </div>
    );
}
