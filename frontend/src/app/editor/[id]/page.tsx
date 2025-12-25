'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import VoiceInput from '@/components/VoiceInput';

const content = {
    en: {
        loading: "Loading editor...",
        back: "← Back to preview",
        editSection: "Edit Section",
        save: "Save Changes",
        saving: "Saving...",
        cancel: "Cancel",
        textMode: "Type",
        voiceMode: "Voice",
        currentContent: "Current:",
        newContent: "New content:",
        placeholder: "Enter new content...",
        saveSuccess: "Changes saved!",
        sections: {
            hero: "Hero Section",
            services: "Services",
            about: "About",
            contact: "Contact Info"
        },
        hints: {
            hero: "Update your business name, tagline, or main message",
            services: "List your services separated by commas",
            about: "Describe your business story",
            contact: "Update your location or address"
        }
    },
    hi: {
        loading: "Editor load हो रहा है...",
        back: "← Preview पर वापस",
        editSection: "Section Edit करें",
        save: "Changes Save करें",
        saving: "Save हो रहा है...",
        cancel: "Cancel",
        textMode: "Type करें",
        voiceMode: "बोलें",
        currentContent: "अभी:",
        newContent: "नया content:",
        placeholder: "नया content enter करें...",
        saveSuccess: "Changes save हो गए!",
        sections: {
            hero: "Hero Section",
            services: "Services",
            about: "About",
            contact: "Contact Info"
        },
        hints: {
            hero: "Business name, tagline, या main message update करें",
            services: "Services comma से separate करके लिखें",
            about: "Business के बारे में बताएं",
            contact: "Location या address update करें"
        }
    }
};

interface SectionData {
    name: string;
    label: string;
    current_content: string;
    editable_fields: string[];
}

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [language, setLanguage] = useState<'en' | 'hi'>('en');
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState<SectionData[]>([]);
    const [businessName, setBusinessName] = useState('');
    const [websiteHtml, setWebsiteHtml] = useState('');
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const t = content[language];

    useEffect(() => {
        fetchEditorData();
    }, [id]);

    const fetchEditorData = async () => {
        try {
            // Fetch sections
            const sectionsRes = await fetch(`/api/edit/${id}/sections`);
            const sectionsData = await sectionsRes.json();

            if (sectionsRes.ok) {
                setSections(sectionsData.sections);
                setBusinessName(sectionsData.business_name);
            }

            // Fetch current HTML for preview
            const previewRes = await fetch(`/api/preview/${id}`);
            const previewData = await previewRes.json();

            if (previewRes.ok) {
                setWebsiteHtml(previewData.html);
            }
        } catch {
            setError('Failed to load editor');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (section: SectionData) => {
        setEditingSection(section.name);
        // Parse current content JSON
        try {
            const current = JSON.parse(section.current_content);
            // Convert to readable format
            if (section.name === 'services') {
                setEditContent(current.services?.join(', ') || '');
            } else if (section.name === 'hero') {
                setEditContent(current.tagline || current.description || '');
            } else {
                setEditContent(Object.values(current)[0] as string || '');
            }
        } catch {
            setEditContent('');
        }
        setError('');
        setSuccess('');
    };

    const handleVoiceTranscription = (text: string) => {
        setEditContent(text);
        setInputMode('text');
    };

    const saveSection = async () => {
        if (!editingSection || !editContent.trim()) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`/api/edit/${id}/section`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section_name: editingSection,
                    new_content: editContent,
                    input_type: inputMode
                })
            });

            const data = await response.json();

            if (response.ok) {
                setWebsiteHtml(data.html);
                setSuccess(t.saveSuccess);
                setEditingSection(null);
                // Refresh sections
                fetchEditorData();
            } else {
                setError(data.error || 'Failed to save');
            }
        } catch {
            setError('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const getCurrentSectionData = () => {
        return sections.find(s => s.name === editingSection);
    };

    return (
        <div className="app">
            <Header language={language} setLanguage={setLanguage} />

            <main className="editor-page">
                {loading ? (
                    <div className="editor-loading">
                        <div className="spinner large"></div>
                        <p>{t.loading}</p>
                    </div>
                ) : (
                    <div className="editor-layout">
                        {/* Left Panel - Sections */}
                        <div className="editor-panel">
                            <div className="panel-header">
                                <a href={`/preview/${id}`} className="back-link">{t.back}</a>
                                <h2>{businessName}</h2>
                            </div>

                            <div className="sections-list">
                                {sections.map((section) => (
                                    <button
                                        key={section.name}
                                        onClick={() => openEditModal(section)}
                                        className={`section-card ${editingSection === section.name ? 'active' : ''}`}
                                    >
                                        <span className="section-icon">
                                            {section.name === 'hero' && '🏠'}
                                            {section.name === 'services' && '⚙️'}
                                            {section.name === 'about' && '📝'}
                                            {section.name === 'contact' && '📍'}
                                        </span>
                                        <div className="section-info">
                                            <span className="section-label">{t.sections[section.name as keyof typeof t.sections]}</span>
                                            <span className="section-hint">{t.hints[section.name as keyof typeof t.hints]}</span>
                                        </div>
                                        <span className="edit-arrow">→</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel - Preview */}
                        <div className="editor-preview">
                            <div className="preview-frame editor-frame">
                                <div className="frame-header">
                                    <div className="frame-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                    <div className="frame-url">{businessName.toLowerCase().replace(/\s+/g, '-') || 'your-site'}.setu.in</div>
                                </div>
                                <iframe
                                    srcDoc={websiteHtml}
                                    className="preview-iframe"
                                    title="Website Preview"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingSection && (
                    <div className="modal-overlay" onClick={() => setEditingSection(null)}>
                        <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setEditingSection(null)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>

                            <h3 className="modal-title">{t.editSection}: {t.sections[editingSection as keyof typeof t.sections]}</h3>
                            <p className="modal-subtitle">{t.hints[editingSection as keyof typeof t.hints]}</p>

                            {/* Current Content */}
                            <div className="current-content-box">
                                <span className="label">{t.currentContent}</span>
                                <p className="current-text">
                                    {(() => {
                                        const section = getCurrentSectionData();
                                        if (!section) return '';
                                        try {
                                            const current = JSON.parse(section.current_content);
                                            if (editingSection === 'services') {
                                                return current.services?.join(', ') || '';
                                            }
                                            return Object.values(current).filter(Boolean)[0] as string || '';
                                        } catch {
                                            return '';
                                        }
                                    })()}
                                </p>
                            </div>

                            {/* Input Mode Toggle */}
                            <div className="input-mode-toggle small">
                                <button
                                    onClick={() => setInputMode('text')}
                                    className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
                                >
                                    ✏️ {t.textMode}
                                </button>
                                <button
                                    onClick={() => setInputMode('voice')}
                                    className={`mode-btn ${inputMode === 'voice' ? 'active' : ''}`}
                                >
                                    🎤 {t.voiceMode}
                                </button>
                            </div>

                            {/* Input Area */}
                            {inputMode === 'voice' ? (
                                <VoiceInput
                                    language={language}
                                    onTranscription={handleVoiceTranscription}
                                />
                            ) : (
                                <div className="edit-input-wrapper">
                                    <label>{t.newContent}</label>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        placeholder={t.placeholder}
                                        className="edit-textarea"
                                        rows={4}
                                    />
                                </div>
                            )}

                            {error && <p className="form-error">{error}</p>}
                            {success && <p className="form-success-text">{success}</p>}

                            {/* Actions */}
                            <div className="modal-actions">
                                <button
                                    onClick={() => setEditingSection(null)}
                                    className="btn-secondary"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={saveSection}
                                    disabled={saving || !editContent.trim()}
                                    className="btn-primary"
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner"></span>
                                            {t.saving}
                                        </>
                                    ) : (
                                        t.save
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
