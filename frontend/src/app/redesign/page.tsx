'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const content = {
    en: {
        title: "Redesign Your Website",
        subtitle: "Paste your existing website URL and we'll create a modern version for you.",
        urlPlaceholder: "https://your-website.com",
        analyze: "Analyze Website",
        analyzing: "Analyzing...",
        selectStyle: "Select a new style",
        generate: "Generate New Design",
        generating: "Generating...",
        preview: "Content Preview",
        back: "← Back",
        noContent: "No content found. Try a different URL.",
        styles: {
            modern: {
                name: "Modern",
                desc: "Clean, minimal design with bold typography",
                best: "Tech, Startups, Professional services"
            },
            premium: {
                name: "Premium",
                desc: "Elegant dark theme with refined aesthetics",
                best: "Luxury brands, High-end services"
            },
            simple: {
                name: "Simple",
                desc: "Traditional, easy-to-read layout",
                best: "Local businesses, Traditional industries"
            }
        }
    },
    hi: {
        title: "अपनी Website Redesign करें",
        subtitle: "अपनी existing website का URL paste करें और हम आपके लिए modern version बनाएंगे।",
        urlPlaceholder: "https://your-website.com",
        analyze: "Website Analyze करें",
        analyzing: "Analyze हो रहा है...",
        selectStyle: "नया style चुनें",
        generate: "नई Design बनाएं",
        generating: "बन रहा है...",
        preview: "Content Preview",
        back: "← वापस",
        noContent: "Content नहीं मिला। दूसरा URL try करें।",
        styles: {
            modern: {
                name: "Modern",
                desc: "Clean, minimal design with bold typography",
                best: "Tech, Startups, Professional services"
            },
            premium: {
                name: "Premium",
                desc: "Elegant dark theme with refined aesthetics",
                best: "Luxury brands, High-end services"
            },
            simple: {
                name: "Simple",
                desc: "Traditional, easy-to-read layout",
                best: "Local businesses, Traditional industries"
            }
        }
    }
};

interface ScrapedData {
    title: string;
    description: string;
    services: string[];
    contact: {
        phone?: string;
        email?: string;
        address?: string;
    };
    headings: string[];
}

type DesignStyle = 'modern' | 'premium' | 'simple';

export default function RedesignPage() {
    const [language, setLanguage] = useState<'en' | 'hi'>('en');
    const [url, setUrl] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<DesignStyle>('modern');
    const [error, setError] = useState('');
    const router = useRouter();

    const t = content[language];

    const analyzeWebsite = async () => {
        if (!url.trim()) return;

        setAnalyzing(true);
        setError('');
        setScrapedData(null);

        try {
            const response = await fetch('/api/redesign/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (response.ok) {
                setScrapedData(data);
            } else {
                setError(data.error || 'Failed to analyze website');
            }
        } catch {
            setError('Failed to analyze website');
        } finally {
            setAnalyzing(false);
        }
    };

    const generateRedesign = async () => {
        if (!url.trim()) return;

        setGenerating(true);
        setError('');

        try {
            const response = await fetch('/api/redesign/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    style: selectedStyle,
                    language
                })
            });

            const data = await response.json();

            if (response.ok && data.id) {
                router.push(`/preview/${data.id}`);
            } else {
                setError(data.error || 'Failed to generate redesign');
            }
        } catch {
            setError('Failed to generate redesign');
        } finally {
            setGenerating(false);
        }
    };

    const resetAnalysis = () => {
        setScrapedData(null);
        setUrl('');
        setError('');
    };

    return (
        <div className="app">
            <Header language={language} setLanguage={setLanguage} />

            <main className="redesign-page">
                <div className="redesign-container">
                    <div className="redesign-header">
                        <h1 className="redesign-title">{t.title}</h1>
                        <p className="redesign-subtitle">{t.subtitle}</p>
                    </div>

                    {!scrapedData ? (
                        /* Step 1: URL Input */
                        <div className="url-input-section">
                            <div className="url-input-wrapper">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value);
                                        setError('');
                                    }}
                                    placeholder={t.urlPlaceholder}
                                    className="url-input"
                                    disabled={analyzing}
                                />
                                <button
                                    onClick={analyzeWebsite}
                                    disabled={analyzing || !url.trim()}
                                    className="btn-primary analyze-btn"
                                >
                                    {analyzing ? (
                                        <>
                                            <span className="spinner"></span>
                                            {t.analyzing}
                                        </>
                                    ) : (
                                        t.analyze
                                    )}
                                </button>
                            </div>
                            {error && <p className="form-error">{error}</p>}
                        </div>
                    ) : (
                        /* Step 2: Preview & Style Selection */
                        <div className="redesign-content">
                            <button onClick={resetAnalysis} className="back-link">{t.back}</button>

                            {/* Content Preview */}
                            <div className="scraped-preview">
                                <h3>{t.preview}</h3>
                                <div className="preview-card scraped-card">
                                    <h4>{scrapedData.title || 'Untitled Website'}</h4>
                                    {scrapedData.description && (
                                        <p className="scraped-desc">{scrapedData.description}</p>
                                    )}
                                    {scrapedData.services.length > 0 && (
                                        <div className="scraped-services">
                                            {scrapedData.services.slice(0, 5).map((s, i) => (
                                                <span key={i} className="service-tag">{s}</span>
                                            ))}
                                        </div>
                                    )}
                                    {(scrapedData.contact.phone || scrapedData.contact.email) && (
                                        <div className="scraped-contact">
                                            {scrapedData.contact.phone && <span>📞 {scrapedData.contact.phone}</span>}
                                            {scrapedData.contact.email && <span>✉️ {scrapedData.contact.email}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Style Selector */}
                            <div className="style-selector">
                                <h3>{t.selectStyle}</h3>
                                <div className="styles-grid">
                                    {(['modern', 'premium', 'simple'] as DesignStyle[]).map((style) => (
                                        <button
                                            key={style}
                                            onClick={() => setSelectedStyle(style)}
                                            className={`style-card ${selectedStyle === style ? 'selected' : ''}`}
                                        >
                                            <div className={`style-preview ${style}`}>
                                                <div className="style-header-bar"></div>
                                                <div className="style-content-blocks">
                                                    <div className="style-block hero"></div>
                                                    <div className="style-block text"></div>
                                                    <div className="style-block text short"></div>
                                                </div>
                                            </div>
                                            <div className="style-info">
                                                <span className="style-name">{t.styles[style].name}</span>
                                                <span className="style-desc">{t.styles[style].desc}</span>
                                                <span className="style-best">Best for: {t.styles[style].best}</span>
                                            </div>
                                            {selectedStyle === style && (
                                                <span className="selected-badge">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && <p className="form-error">{error}</p>}

                            {/* Generate Button */}
                            <button
                                onClick={generateRedesign}
                                disabled={generating}
                                className="btn-primary btn-full btn-large"
                            >
                                {generating ? (
                                    <>
                                        <span className="spinner"></span>
                                        {t.generating}
                                    </>
                                ) : (
                                    t.generate
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer language={language} />
        </div>
    );
}
