'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Wand2, Type, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

// Editor Agent script content (will be injected into iframe)
const EDITOR_AGENT_SCRIPT = `<script src="/scripts/editor-agent.js"></script>`;

interface SelectedElement {
    id: string;
    type: 'text' | 'heading' | 'button' | 'image';
    tag: string;
    content: {
        text?: string;
        src?: string;
        alt?: string;
        href?: string;
    };
    rect: { top: number; left: number; width: number; height: number };
}

interface WebsiteData {
    id: string;
    html: string;
    pages?: { [filename: string]: string };
    business: {
        business_name: string;
        business_type: string;
        location: string;
    };
}

const content = {
    en: {
        loading: "Loading editor...",
        back: "Back",
        save: "Save",
        saving: "Saving...",
        saved: "Saved!",
        selectElement: "Click any element to edit",
        editText: "Edit Text",
        editImage: "Edit Image",
        editButton: "Edit Button",
        content: "Content",
        link: "Link URL",
        imageUrl: "Image URL",
        altText: "Alt Text",
        aiRewrite: "AI Rewrite",
        done: "Done",
        noSelection: "No element selected"
    },
    hi: {
        loading: "Editor load हो रहा है...",
        back: "वापस",
        save: "Save",
        saving: "Save हो रहा...",
        saved: "Save हो गया!",
        selectElement: "Edit करने के लिए element पर click करें",
        editText: "Text Edit",
        editImage: "Image Edit",
        editButton: "Button Edit",
        content: "Content",
        link: "Link URL",
        imageUrl: "Image URL",
        altText: "Alt Text",
        aiRewrite: "AI Rewrite",
        done: "Done",
        noSelection: "कोई element select नहीं है"
    }
};

export default function VisualEditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [language] = useState<'en' | 'hi'>('en');
    const [loading, setLoading] = useState(true);
    const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
    const [currentPage, setCurrentPage] = useState('index.html');
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [editValue, setEditValue] = useState('');
    const [linkValue, setLinkValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isMobile, setIsMobile] = useState(false);
    const [showSheet, setShowSheet] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const t = content[language];

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch website data
    useEffect(() => {
        fetchWebsiteData();
    }, [id]);

    const fetchWebsiteData = async () => {
        try {
            const response = await fetch(`/api/preview/${id}`);
            const data = await response.json();
            if (response.ok) {
                setWebsiteData(data);
            }
        } catch (error) {
            console.error('Failed to load:', error);
        } finally {
            setLoading(false);
        }
    };

    // Listen for postMessage from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = event.data;
            if (!data || !data.type) return;

            switch (data.type) {
                case 'EDITOR_READY':
                    console.log('[Editor] Agent ready');
                    break;

                case 'ELEMENT_SELECTED':
                    handleElementSelected(data.payload);
                    break;

                case 'CONTENT_UPDATED':
                    setHasUnsavedChanges(true);
                    debouncedSave();
                    break;

                case 'HTML_CONTENT':
                    handleHtmlReceived(data.payload.html);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Handle element selection
    const handleElementSelected = (payload: SelectedElement) => {
        setSelectedElement(payload);
        setEditValue(payload.content.text || payload.content.src || '');
        setLinkValue(payload.content.href || '');
        if (isMobile) {
            setShowSheet(true);
        }
    };

    // Send update to iframe
    const sendUpdate = useCallback(() => {
        if (!selectedElement || !iframeRef.current?.contentWindow) return;

        const content: Record<string, string> = {};

        if (selectedElement.type === 'image') {
            content.src = editValue;
        } else {
            content.text = editValue;
        }

        if (selectedElement.type === 'button' && linkValue) {
            content.href = linkValue;
        }

        iframeRef.current.contentWindow.postMessage({
            type: 'UPDATE_CONTENT',
            payload: {
                id: selectedElement.id,
                content
            }
        }, '*');
    }, [selectedElement, editValue, linkValue]);

    // Update iframe on edit value change
    useEffect(() => {
        if (editValue && selectedElement) {
            sendUpdate();
        }
    }, [editValue, sendUpdate]);

    // Debounced save
    const debouncedSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            requestHtmlAndSave();
        }, 2000);
    }, []);

    // Request HTML from iframe
    const requestHtmlAndSave = () => {
        if (!iframeRef.current?.contentWindow) return;
        setSaveStatus('saving');
        iframeRef.current.contentWindow.postMessage({ type: 'GET_HTML' }, '*');
    };

    // Handle HTML received and save
    const handleHtmlReceived = async (html: string) => {
        try {
            const response = await fetch(`/api/edit/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html, page: currentPage })
            });

            if (response.ok) {
                setSaveStatus('saved');
                setHasUnsavedChanges(false);
                setTimeout(() => setSaveStatus('idle'), 2000);
            }
        } catch (error) {
            console.error('Save failed:', error);
            setSaveStatus('idle');
        }
    };

    // Manual save
    const handleSave = () => {
        requestHtmlAndSave();
    };

    // Close editor panel
    const closeEditor = () => {
        setSelectedElement(null);
        setShowSheet(false);
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'CLEAR_SELECTION' }, '*');
        }
    };

    // Prepare HTML with editor agent
    const prepareHtmlForEditor = (html: string): string => {
        if (!html) return '';

        // Inject editor agent script before </body>
        if (html.includes('</body>')) {
            return html.replace('</body>', `${EDITOR_AGENT_SCRIPT}</body>`);
        }
        return html + EDITOR_AGENT_SCRIPT;
    };

    // Get current HTML to display
    const getCurrentHtml = (): string => {
        if (!websiteData) return '';
        if (websiteData.pages && websiteData.pages[currentPage]) {
            return websiteData.pages[currentPage];
        }
        return websiteData.html || '';
    };

    // Styles
    const styles = {
        container: {
            display: 'flex',
            height: '100vh',
            backgroundColor: '#0f172a',
            overflow: 'hidden'
        },
        header: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155',
            zIndex: 100
        },
        headerLeft: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        backBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '14px'
        },
        siteName: {
            color: 'white',
            fontWeight: 600,
            fontSize: '14px'
        },
        saveBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: saveStatus === 'saved' ? '#22c55e' : '#0d9488',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer'
        },
        main: {
            display: 'flex',
            flex: 1,
            paddingTop: '50px'
        },
        canvas: {
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: isMobile ? '10px' : '20px',
            paddingRight: isMobile ? '10px' : '320px',  // Make room for fixed sidebar on desktop
            overflow: 'auto'
        },
        iframeWrapper: {
            width: '100%',
            maxWidth: isMobile ? '100%' : '1200px',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
        },
        iframe: {
            width: '100%',
            height: 'calc(100vh - 110px)',
            border: 'none'
        },
        sidebar: {
            position: 'fixed' as const,
            top: '50px',
            right: 0,
            bottom: 0,
            width: '300px',
            backgroundColor: '#1e293b',
            borderLeft: '1px solid #334155',
            display: isMobile ? 'none' : 'flex',
            flexDirection: 'column' as const,
            overflow: 'hidden',
            zIndex: 50
        },
        sidebarHeader: {
            padding: '16px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        sidebarTitle: {
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        closeBtn: {
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px'
        },
        sidebarContent: {
            flex: 1,
            padding: '16px',
            overflow: 'auto'
        },
        emptyState: {
            textAlign: 'center' as const,
            color: '#64748b',
            padding: '40px 20px'
        },
        inputGroup: {
            marginBottom: '16px'
        },
        label: {
            display: 'block',
            color: '#94a3b8',
            fontSize: '12px',
            marginBottom: '6px',
            fontWeight: 500
        },
        textarea: {
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            resize: 'vertical' as const,
            minHeight: '80px',
            fontFamily: 'inherit'
        },
        input: {
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px'
        },
        aiBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#94a3b8',
            fontSize: '12px',
            cursor: 'pointer',
            marginTop: '8px'
        },
        // Bottom Sheet (Mobile)
        bottomSheet: {
            position: 'fixed' as const,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#1e293b',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '16px',
            transform: showSheet ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease',
            zIndex: 200,
            maxHeight: '50vh',
            overflow: 'auto',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)'
        },
        sheetHandle: {
            width: '40px',
            height: '4px',
            backgroundColor: '#475569',
            borderRadius: '2px',
            margin: '0 auto 16px'
        },
        sheetHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
        },
        doneBtn: {
            padding: '8px 16px',
            backgroundColor: '#0d9488',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer'
        }
    };

    const getEditorTitle = () => {
        if (!selectedElement) return t.noSelection;
        switch (selectedElement.type) {
            case 'image': return t.editImage;
            case 'button': return t.editButton;
            default: return t.editText;
        }
    };

    const getEditorIcon = () => {
        if (!selectedElement) return <Type size={16} />;
        switch (selectedElement.type) {
            case 'image': return <ImageIcon size={16} />;
            case 'button': return <LinkIcon size={16} />;
            default: return <Type size={16} />;
        }
    };

    // Editor Panel Content (shared between sidebar and bottom sheet)
    const EditorPanel = () => (
        <>
            {!selectedElement ? (
                <div style={styles.emptyState}>
                    <p>{t.selectElement}</p>
                </div>
            ) : (
                <>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>{t.content}</label>
                        {selectedElement.type === 'image' ? (
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder={t.imageUrl}
                                style={styles.input}
                            />
                        ) : (
                            <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                style={styles.textarea}
                                rows={3}
                            />
                        )}
                        {selectedElement.type !== 'image' && (
                            <button style={styles.aiBtn}>
                                <Wand2 size={14} />
                                {t.aiRewrite}
                            </button>
                        )}
                    </div>

                    {selectedElement.type === 'button' && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>{t.link}</label>
                            <input
                                type="text"
                                value={linkValue}
                                onChange={(e) => setLinkValue(e.target.value)}
                                placeholder="https://... or #section or tel:..."
                                style={styles.input}
                            />
                        </div>
                    )}

                    {selectedElement.type === 'image' && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>{t.altText}</label>
                            <input
                                type="text"
                                placeholder="Image description"
                                style={styles.input}
                            />
                        </div>
                    )}
                </>
            )}
        </>
    );

    if (loading) {
        return (
            <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div className="spinner large" style={{ margin: '0 auto 16px' }}></div>
                    <p>{t.loading}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <button onClick={() => router.push(`/preview/${id}`)} style={styles.backBtn}>
                        <ArrowLeft size={18} />
                        {t.back}
                    </button>
                    <span style={styles.siteName}>
                        {websiteData?.business?.business_name || 'Editor'}
                    </span>
                </div>
                <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                    <Save size={16} />
                    {saveStatus === 'saving' ? t.saving : saveStatus === 'saved' ? t.saved : t.save}
                </button>
            </header>

            {/* Main Content */}
            <div style={styles.main}>
                {/* Canvas */}
                <div style={styles.canvas}>
                    <div style={styles.iframeWrapper}>
                        <iframe
                            ref={iframeRef}
                            srcDoc={prepareHtmlForEditor(getCurrentHtml())}
                            style={styles.iframe}
                            title="Visual Editor"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>
                </div>

                {/* Sidebar (Desktop) */}
                <div style={styles.sidebar}>
                    <div style={styles.sidebarHeader}>
                        <span style={styles.sidebarTitle}>
                            {getEditorIcon()}
                            {getEditorTitle()}
                        </span>
                        {selectedElement && (
                            <button onClick={closeEditor} style={styles.closeBtn}>
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    <div style={styles.sidebarContent}>
                        <EditorPanel />
                    </div>
                </div>
            </div>

            {/* Bottom Sheet (Mobile) */}
            {isMobile && (
                <div style={styles.bottomSheet}>
                    <div style={styles.sheetHandle} />
                    <div style={styles.sheetHeader}>
                        <span style={styles.sidebarTitle}>
                            {getEditorIcon()}
                            {getEditorTitle()}
                        </span>
                        <button onClick={closeEditor} style={styles.doneBtn}>
                            {t.done}
                        </button>
                    </div>
                    <EditorPanel />
                </div>
            )}
        </div>
    );
}
