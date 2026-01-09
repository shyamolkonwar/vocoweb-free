'use client';

import { useState } from 'react';
import { Sparkles, Check, RotateCcw, X, FileText, Loader } from 'lucide-react';

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

interface VoiceLabProps {
    language: 'en' | 'hi';
    onProfileConfirmed: (profile: VoiceProfile) => void;
    onSkip: () => void;
}

const content = {
    en: {
        headline: "Don't sound like a robot.",
        subtitle: "Paste a sample of your writing and we'll match your unique voice.",
        placeholder: "Paste a recent Instagram caption, email signature, 'About Us' text, or any writing that represents your brand voice...",
        minChars: "Minimum 50 characters",
        analyze: "Analyze My Voice",
        skip: "Skip (Use Default)",
        analyzing: "Reading your text...",
        detectingTone: "Detecting tone...",
        extractingVocab: "Extracting vocabulary...",
        buildingProfile: "Building voice profile...",
        detected: "Voice Detected",
        toneLabel: "Your Brand Voice:",
        keyCharacteristics: "Key Characteristics:",
        writingRules: "Writing Rules:",
        confirmVoice: "Confirm This Voice",
        retrain: "Try Different Text",
        error: "Something went wrong. Please try again."
    },
    hi: {
        headline: "Robot जैसा मत लगो।",
        subtitle: "अपनी writing का sample paste करें और हम आपकी unique voice match करेंगे।",
        placeholder: "अपना कोई Instagram caption, email, या 'About Us' text paste करें...",
        minChars: "कम से कम 50 characters",
        analyze: "Analyze करें",
        skip: "Skip करें (Default use करें)",
        analyzing: "Text पढ़ रहे हैं...",
        detectingTone: "Tone detect कर रहे हैं...",
        extractingVocab: "Vocabulary extract कर रहे हैं...",
        buildingProfile: "Voice profile बना रहे हैं...",
        detected: "Voice मिल गई",
        toneLabel: "आपकी Brand Voice:",
        keyCharacteristics: "Key Characteristics:",
        writingRules: "Writing Rules:",
        confirmVoice: "इसे Confirm करें",
        retrain: "अलग Text Try करें",
        error: "कुछ गलत हो गया। फिर से try करें।"
    }
};

type LabState = 'input' | 'analyzing' | 'confirmation';

export default function VoiceLab({ language, onProfileConfirmed, onSkip }: VoiceLabProps) {
    const [state, setState] = useState<LabState>('input');
    const [textSample, setTextSample] = useState('');
    const [profile, setProfile] = useState<VoiceProfile | null>(null);
    const [error, setError] = useState('');
    const [analysisStep, setAnalysisStep] = useState(0);
    const t = content[language];

    const analysisSteps = [
        t.analyzing,
        t.detectingTone,
        t.extractingVocab,
        t.buildingProfile
    ];

    const handleAnalyze = async () => {
        if (textSample.trim().length < 50) {
            setError(t.minChars);
            return;
        }

        setError('');
        setState('analyzing');
        setAnalysisStep(0);

        // Animate through steps
        const stepTimer = setInterval(() => {
            setAnalysisStep(prev => {
                if (prev < analysisSteps.length - 1) return prev + 1;
                return prev;
            });
        }, 800);

        try {
            const response = await fetch('/api/voice/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ textSample })
            });

            clearInterval(stepTimer);

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            setProfile(data);
            setState('confirmation');
        } catch (err) {
            clearInterval(stepTimer);
            setError(t.error);
            setState('input');
        }
    };

    const handleRetrain = () => {
        setProfile(null);
        setTextSample('');
        setState('input');
    };

    const handleConfirm = () => {
        if (profile) {
            onProfileConfirmed(profile);
        }
    };

    // INPUT STATE
    if (state === 'input') {
        return (
            <div className="voice-lab">
                <div className="voice-lab-header">
                    <div className="voice-lab-icon">
                        <Sparkles size={24} />
                    </div>
                    <h3 className="voice-lab-title">{t.headline}</h3>
                    <p className="voice-lab-subtitle">{t.subtitle}</p>
                </div>

                <div className="voice-lab-input-wrapper">
                    <textarea
                        value={textSample}
                        onChange={(e) => {
                            setTextSample(e.target.value);
                            setError('');
                        }}
                        placeholder={t.placeholder}
                        className="voice-lab-textarea"
                        rows={5}
                    />
                    <div className="voice-lab-input-footer">
                        <span className={`char-count ${textSample.length < 50 ? 'low' : 'ok'}`}>
                            {textSample.length}/50
                        </span>
                    </div>
                </div>

                {error && <p className="voice-lab-error">{error}</p>}

                <div className="voice-lab-actions">
                    <button
                        onClick={handleAnalyze}
                        disabled={textSample.trim().length < 50}
                        className="voice-lab-btn primary"
                    >
                        <Sparkles size={18} />
                        {t.analyze}
                    </button>
                    <button
                        onClick={onSkip}
                        className="voice-lab-btn ghost"
                    >
                        {t.skip}
                    </button>
                </div>
            </div>
        );
    }

    // ANALYZING STATE
    if (state === 'analyzing') {
        return (
            <div className="voice-lab analyzing">
                <div className="voice-lab-loader">
                    <Loader size={40} className="spinning" />
                </div>
                <div className="analysis-steps">
                    {analysisSteps.map((step, index) => (
                        <div
                            key={index}
                            className={`analysis-step ${index < analysisStep ? 'completed' : ''} ${index === analysisStep ? 'active' : ''}`}
                        >
                            {index < analysisStep ? (
                                <Check size={16} className="step-check" />
                            ) : index === analysisStep ? (
                                <Loader size={16} className="spinning" />
                            ) : (
                                <div className="step-pending" />
                            )}
                            <span>{step}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // CONFIRMATION STATE
    if (state === 'confirmation' && profile) {
        return (
            <div className="voice-lab confirmed">
                <div className="voice-lab-header">
                    <div className="voice-lab-icon success">
                        <Check size={24} />
                    </div>
                    <h3 className="voice-lab-title">{t.detected}</h3>
                </div>

                <div className="voice-profile-card">
                    <div className="profile-tone">
                        <span className="tone-label">{t.toneLabel}</span>
                        <span className="tone-value">{profile.tone_label}</span>
                    </div>

                    <div className="profile-keywords">
                        {profile.keywords.map((keyword, i) => (
                            <span key={i} className="keyword-tag">{keyword}</span>
                        ))}
                    </div>

                    <div className="profile-section">
                        <h4>{t.keyCharacteristics}</h4>
                        <ul>
                            <li>{profile.sentence_style}</li>
                            <li>{profile.perspective}</li>
                            <li>{profile.emoji_policy}</li>
                        </ul>
                    </div>

                    <div className="profile-section">
                        <h4>{t.writingRules}</h4>
                        <ul>
                            {profile.rules.map((rule, i) => (
                                <li key={i}>{rule}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="profile-sample">
                        <FileText size={14} />
                        <span>"{profile.sample_snippet}"</span>
                    </div>
                </div>

                <div className="voice-lab-actions">
                    <button
                        onClick={handleConfirm}
                        className="voice-lab-btn primary"
                    >
                        <Check size={18} />
                        {t.confirmVoice}
                    </button>
                    <button
                        onClick={handleRetrain}
                        className="voice-lab-btn ghost"
                    >
                        <RotateCcw size={16} />
                        {t.retrain}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
