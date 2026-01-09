'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProgressHeader from '@/components/ProgressHeader';
import FocusCard from '@/components/FocusCard';
import ThinkingSteps from '@/components/ThinkingSteps';
import VoiceInput from '@/components/VoiceInput';
import VoiceLab from '@/components/VoiceLab';
import WhatsAppSettings from '@/components/WhatsAppSettings';
import AuthModal from '@/components/auth/AuthModal';
import PhotoUploadStep from '@/components/PhotoUploadStep';
import { useAuth } from '@/context/AuthContext';

interface VoiceProfile {
    tone_label: string;
    keywords: string[];
    sentence_style: string;
    vocabulary_level: string;
    perspective: string;
    emoji_policy: string;
    rules: string[];
    forbidden_words: string[];
    sample_snippet: string;
}

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
        subtitle: "Include your business name, location, and what you sell. You can speak in Hindi or English.",
        placeholder: "Example: I run a dental clinic in Dibrugarh. We specialize in teeth cleaning, root canal treatment, and braces. Our clinic is open from 9 AM to 8 PM.",
        examplesTitle: "Need inspiration? Try these:",
        generate: "Generate My Website",
        generating: "Creating your website...",
        charCount: "characters",
        minChars: "Minimum 20 characters",
        typeManually: "Or type it manually",
        voiceSubtitle: "Speak in English or Hindi",
        loginRequired: "Please log in to generate your website",
        insufficientCredits: "You need more credits to generate a website"
    },
    hi: {
        title: "अपने business के बारे में बताएं",
        subtitle: "Business का नाम, location, और आप क्या बेचते हैं बताएं। Hindi या English में बोल सकते हैं।",
        placeholder: "जैसे: मैं Dibrugarh में dental clinic चलाता हूं। हम teeth cleaning, root canal, और braces में specialize करते हैं। Clinic सुबह 9 से रात 8 बजे तक खुला है।",
        examplesTitle: "Ideas चाहिए? ये try करें:",
        generate: "मेरी Website बनाएं",
        generating: "Website बना रहे हैं...",
        charCount: "characters",
        minChars: "कम से कम 20 characters",
        typeManually: "या manually type करें",
        voiceSubtitle: "Hindi या English में बोलें",
        loginRequired: "Website बनाने के लिए login करें",
        insufficientCredits: "आपको और credits चाहिए"
    }
};

type InputMode = 'voice' | 'text';

export default function CreatePage() {
    const [language, setLanguage] = useState<'en' | 'hi'>('en');
    const [inputMode, setInputMode] = useState<InputMode>('voice');
    const [businessDesc, setBusinessDesc] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showVoiceLab, setShowVoiceLab] = useState(false);
    const [showWhatsAppSettings, setShowWhatsAppSettings] = useState(false);
    const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
    const [whatsappPhone, setWhatsappPhone] = useState('');
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [userImages, setUserImages] = useState<string[]>([]);
    // Global market state (NEW)
    const [brandVoice, setBrandVoice] = useState<string>('Corporate & Clean');
    const [bookingLink, setBookingLink] = useState<string>('');
    const tempRequestId = useMemo(() => Math.random().toString(36).substring(2, 15), []);
    const router = useRouter();
    const { isAuthenticated, getAccessToken } = useAuth();
    const t = content[language];

    // Market Detection (from URL parameter)
    // India: /create?market=IN → Hide Voice Lab, Show WhatsApp
    // Global: /create?market=GLOBAL → Show Voice Lab, Hide WhatsApp by default
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const market = searchParams.get('market') as 'IN' | 'GLOBAL' | null || 'GLOBAL';
    const isIndiaMarket = market === 'IN';

    const handleGenerate = async () => {
        if (businessDesc.trim().length < 20) {
            setError(t.minChars);
            return;
        }

        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        setError('');
        setIsGenerating(true);

        try {
            const token = getAccessToken();
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-market': isIndiaMarket ? 'IN' : 'GLOBAL'
                },
                body: JSON.stringify({
                    description: businessDesc,
                    language,
                    voiceProfile: voiceProfile || undefined,
                    // India market fields
                    whatsapp_number: isIndiaMarket ? whatsappPhone : undefined,
                    whatsapp_message: isIndiaMarket ? whatsappMessage : undefined,
                    whatsapp_enabled: isIndiaMarket && !!whatsappPhone,
                    user_images: isIndiaMarket ? userImages : undefined,
                    // Global market fields  
                    brand_voice: !isIndiaMarket ? brandVoice : undefined,
                    booking_link: !isIndiaMarket ? bookingLink : undefined,
                    market: isIndiaMarket ? 'IN' : 'GLOBAL'
                })
            });

            const data = await response.json();

            if (response.ok && data.id) {
                router.push(`/preview/${data.id}`);
            } else if (data.requiresAuth) {
                setShowAuthModal(true);
                setIsGenerating(false);
            } else if (data.insufficientCredits) {
                setError(t.insufficientCredits);
                setIsGenerating(false);
            } else {
                setError(data.error || 'Something went wrong');
                setIsGenerating(false);
            }
        } catch {
            setError('Failed to generate website');
            setIsGenerating(false);
        }
    };

    const handleVoiceTranscription = (text: string) => {
        setBusinessDesc(text);
        setInputMode('text');
        setError('');
    };

    const useExample = (example: string) => {
        setBusinessDesc(example);
        setInputMode('text');
        setError('');
    };

    return (
        <div className="app-shell">
            <Header language={language} setLanguage={setLanguage} isAppMode={true} />

            <main className="app-main">
                <ProgressHeader currentStep="identity" />
                <FocusCard>
                    {isGenerating ? (
                        <ThinkingSteps inputMode={inputMode} />
                    ) : (
                        <>
                            <div className="studio-header">
                                <h1 className="studio-title">{t.title}</h1>
                                <p className="studio-subtitle">{t.subtitle}</p>
                            </div>

                            {inputMode === 'voice' ? (
                                <div className="voice-mode-container">
                                    <VoiceInput
                                        language={language}
                                        onTranscription={(text) => {
                                            setBusinessDesc(text);
                                            // Check auth before proceeding
                                            if (!isAuthenticated) {
                                                setShowAuthModal(true);
                                                return;
                                            }
                                            // Auto-generate after transcription if authenticated
                                            if (text.trim().length >= 20) {
                                                handleGenerate();
                                            }
                                        }}
                                        disabled={isGenerating}
                                        autoGenerate={true}
                                    />
                                    <button
                                        className="type-manually-link"
                                        onClick={() => setInputMode('text')}
                                    >
                                        {t.typeManually}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-mode-container">
                                    <div className="input-wrapper">
                                        <textarea
                                            value={businessDesc}
                                            onChange={(e) => {
                                                setBusinessDesc(e.target.value);
                                                setError('');
                                            }}
                                            placeholder={t.placeholder}
                                            className="business-input-studio"
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

                                    {/* Voice Lab Toggle - ONLY for Global market */}
                                    {!isIndiaMarket && (
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceLab(true)}
                                            className={`voice-lab-toggle ${voiceProfile ? 'confirmed' : ''}`}
                                        >
                                            {voiceProfile ? (
                                                <>
                                                    <span className="toggle-check">✓</span>
                                                    Voice: {voiceProfile.tone_label}
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="toggle-icon" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-100 70-170t170-70h240q100 0 170 70t70 170v400q0 33-23.5 56.5T760-120H200Zm0-80h560v-400q0-66-47-113t-113-47H360q-66 0-113 47t-47 113v400Zm160-280q-33 0-56.5-23.5T280-560q0-33 23.5-56.5T360-640q33 0 56.5 23.5T440-560q0 33-23.5 56.5T360-480Zm240 0q-33 0-56.5-23.5T520-560q0-33 23.5-56.5T600-640q33 0 56.5 23.5T680-560q0 33-23.5 56.5T600-480ZM280-200v-80q0-33 23.5-56.5T360-360h240q33 0 56.5 23.5T680-280v80h-80v-80h-80v80h-80v-80h-80v80h-80Zm-80 0h560-560Z" /></svg>
                                                    Train AI on your writing style
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* Brand Voice Selector - ONLY for Global market */}
                                    {!isIndiaMarket && (
                                        <div className="brand-voice-section">
                                            <label className="input-label">Brand Voice</label>
                                            <select
                                                value={brandVoice}
                                                onChange={(e) => setBrandVoice(e.target.value)}
                                                className="select-input"
                                            >
                                                <option value="Bold & Confident">Bold & Confident</option>
                                                <option value="Empathetic & Soft">Empathetic & Soft</option>
                                                <option value="Corporate & Clean">Corporate & Clean</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Booking Link Input - ONLY for Global market */}
                                    {!isIndiaMarket && (
                                        <div className="booking-link-section">
                                            <label className="input-label">Booking Link (Calendly/Cal.com)</label>
                                            <input
                                                type="url"
                                                value={bookingLink}
                                                onChange={(e) => setBookingLink(e.target.value)}
                                                placeholder="https://calendly.com/your-name"
                                                className="text-input"
                                            />
                                        </div>
                                    )}

                                    {/* WhatsApp Toggle - ONLY for India market */}
                                    {isIndiaMarket && (
                                        <button
                                            type="button"
                                            onClick={() => setShowWhatsAppSettings(true)}
                                            className={`whatsapp-toggle ${whatsappPhone ? 'confirmed' : ''}`}
                                        >
                                            {whatsappPhone ? (
                                                <>
                                                    <span className="toggle-check">✓</span>
                                                    WhatsApp booking enabled
                                                </>
                                            ) : (
                                                <>
                                                    <img src="/icons/whatsapp.png" alt="" className="toggle-icon-img" width="20" height="20" />
                                                    Enable WhatsApp bookings
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* Photo Upload Step - ONLY for India market */}
                                    {isIndiaMarket && businessDesc.trim().length >= 20 && (
                                        <PhotoUploadStep
                                            accessToken={getAccessToken()}
                                            tempRequestId={tempRequestId}
                                            onImagesChange={setUserImages}
                                            language={language}
                                        />
                                    )}


                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || businessDesc.trim().length < 20}
                                        className="btn-primary btn-full btn-large"
                                    >
                                        {t.generate}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </FocusCard>

                {inputMode === 'text' && !isGenerating && (
                    <div className="examples-section-studio">
                        <h3 className="examples-title">{t.examplesTitle}</h3>
                        <div className="examples-grid">
                            {examples[language].map((example, index) => (
                                <button
                                    key={index}
                                    onClick={() => useExample(example)}
                                    className="example-card"
                                >
                                    "{example}"
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {showAuthModal && (
                <AuthModal
                    language={language}
                    onClose={() => setShowAuthModal(false)}
                    mode="save"
                />
            )}

            {/* Voice Lab Modal */}
            {showVoiceLab && (
                <div className="voice-lab-overlay" onClick={() => setShowVoiceLab(false)}>
                    <div className="voice-lab-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="voice-lab-close"
                            onClick={() => setShowVoiceLab(false)}
                        >
                            ✕
                        </button>
                        <VoiceLab
                            language={language}
                            onProfileConfirmed={(profile) => {
                                setVoiceProfile(profile);
                                setShowVoiceLab(false);
                            }}
                            onSkip={() => {
                                setVoiceProfile(null);
                                setShowVoiceLab(false);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* WhatsApp Settings Modal */}
            {showWhatsAppSettings && (
                <div className="whatsapp-settings-overlay" onClick={() => setShowWhatsAppSettings(false)}>
                    <div className="whatsapp-settings-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="whatsapp-settings-close"
                            onClick={() => setShowWhatsAppSettings(false)}
                        >
                            ✕
                        </button>
                        <WhatsAppSettings
                            language={language}
                            initialPhone={whatsappPhone}
                            initialMessage={whatsappMessage}
                            onConfirm={(phone, message) => {
                                setWhatsappPhone(phone);
                                setWhatsappMessage(message);
                                setShowWhatsAppSettings(false);
                            }}
                            onSkip={() => {
                                setWhatsappPhone('');
                                setWhatsappMessage('');
                                setShowWhatsAppSettings(false);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
