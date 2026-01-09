'use client';

/**
 * Canvas-First Visual Editor
 * 
 * A Framer/Canva-style editing experience with:
 * - Light canvas background with dotted grid
 * - Floating bottom dock toolbar
 * - Minimalist header with auto-save
 * - iPhone 15 Pro bezel for mobile preview
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Eye,
    Palette,
    Type,
    Image as ImageIcon,
    Smartphone,
    Monitor,
    Rocket,
    Wand2,
    X,
    Check,
    Mic,
    Upload
} from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import ThemeSelector, { ThemeId } from '@/components/ThemeSelector';
import { useAuth } from '@/context/AuthContext';

// Editor Agent script (injected into iframe)
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

export default function CanvasEditor() {

    // Theme State
    const [showThemePanel, setShowThemePanel] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<ThemeId>('trust');
    const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);

    const params = useParams();
    const router = useRouter();
    const { getAccessToken } = useAuth();
    const id = params.id as string;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // State
    const [loading, setLoading] = useState(true);
    const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
    const [currentPage] = useState('index.html');
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [editValue, setEditValue] = useState('');
    const [linkValue, setLinkValue] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [showImageUploader, setShowImageUploader] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);

    // Fetch website data
    useEffect(() => {
        fetchWebsiteData();
    }, [id]);

    const fetchWebsiteData = async () => {
        try {
            const token = getAccessToken();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'}/api/preview/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setWebsiteData(data);
                setProjectName(data.business?.business_name || 'Untitled Project');
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
                    console.log('[Canvas Editor] Agent ready');
                    break;
                case 'ELEMENT_SELECTED':
                    handleElementSelected(data.payload);
                    break;
                case 'CONTENT_UPDATED':
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

    // Handle Theme Update
    const handleThemeUpdate = async (themeId: ThemeId) => {
        setIsUpdatingTheme(true);
        setCurrentTheme(themeId); // Optimistic update of UI state

        try {
            const token = getAccessToken();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'}/api/edit/${id}/theme`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ theme_id: themeId })
            });

            if (!response.ok) throw new Error('Failed to update theme');

            const data = await response.json();
            if (data.success && data.html) {
                setWebsiteData(prev => {
                    if (!prev) return null;
                    const updated = { ...prev, html: data.html };
                    if (updated.pages) {
                        updated.pages = { ...updated.pages, [currentPage]: data.html };
                    }
                    return updated;
                });
                setSaveStatus('saved');
            }
        } catch (err) {
            console.error('Error updating theme:', err);
            alert('Failed to update theme. Please try again.');
        } finally {
            setIsUpdatingTheme(false);
            // Don't close panel immediately so they can try others
            // setShowThemePanel(false);
        }
    };

    const handleElementSelected = (payload: SelectedElement) => {
        setSelectedElement(payload);
        setEditValue(payload.content.text || payload.content.src || '');
        setLinkValue(payload.content.href || '');
        setShowEditPanel(true);
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
            payload: { id: selectedElement.id, content }
        }, '*');
    }, [selectedElement, editValue, linkValue]);

    useEffect(() => {
        if (editValue && selectedElement) {
            sendUpdate();
        }
    }, [editValue, sendUpdate]);

    // Debounced auto-save
    const debouncedSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            requestHtmlAndSave();
        }, 2000);
    }, []);

    const requestHtmlAndSave = () => {
        if (!iframeRef.current?.contentWindow) return;
        setSaveStatus('saving');
        iframeRef.current.contentWindow.postMessage({ type: 'GET_HTML' }, '*');
    };

    const handleHtmlReceived = async (html: string) => {
        try {
            const token = getAccessToken();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'}/api/edit/${id}/html`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ html, page: currentPage })
            });

            if (response.ok) {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            }
        } catch (error) {
            console.error('Save failed:', error);
            setSaveStatus('idle');
        }
    };

    const closeEditPanel = () => {
        setSelectedElement(null);
        setShowEditPanel(false);
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'CLEAR_SELECTION' }, '*');
        }
    };

    const prepareHtmlForEditor = (html: string): string => {
        if (!html) return '';
        if (html.includes('</body>')) {
            return html.replace('</body>', `${EDITOR_AGENT_SCRIPT}</body>`);
        }
        return html + EDITOR_AGENT_SCRIPT;
    };

    const getCurrentHtml = (): string => {
        if (!websiteData) return '';
        if (websiteData.pages && websiteData.pages[currentPage]) {
            return websiteData.pages[currentPage];
        }
        return websiteData.html || '';
    };

    // Loading state
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner large" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#64748b' }}>Loading editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F8FAFC',
            backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Minimalist Header */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #e2e8f0',
                zIndex: 100
            }}>
                {/* Left: Back + Project Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => router.push(`/preview/${id}`)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#64748b'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {isEditingName ? (
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            onBlur={() => setIsEditingName(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                            autoFocus
                            style={{
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#0f172a',
                                border: '1px solid #0D9488',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                outline: 'none',
                                background: 'white'
                            }}
                        />
                    ) : (
                        <button
                            onClick={() => setIsEditingName(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {projectName}
                            <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: '#f1f5f9',
                                color: '#64748b',
                                fontWeight: 500
                            }}>
                                Draft
                            </span>
                        </button>
                    )}
                </div>

                {/* Right: Save Status + Preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                        fontSize: '13px',
                        color: saveStatus === 'saved' ? '#22c55e' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {saveStatus === 'saving' ? (
                            <>
                                <span className="spinner" style={{ width: 12, height: 12 }} />
                                Saving...
                            </>
                        ) : saveStatus === 'saved' ? (
                            <>
                                <Check size={14} />
                                Saved
                            </>
                        ) : (
                            'Auto-save on'
                        )}
                    </span>
                    <button
                        onClick={() => window.open(`/preview/${id}`, '_blank')}
                        style={{
                            background: 'none',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            color: '#64748b'
                        }}
                    >
                        <Eye size={16} />
                        Preview
                    </button>
                </div>
            </header>

            {/* Canvas Area */}
            <main style={{
                paddingTop: '76px',
                paddingBottom: '100px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                minHeight: '100vh'
            }}>
                {/* Device Frame */}
                <div style={{
                    transition: 'all 0.3s ease',
                    ...(viewMode === 'mobile' ? {
                        width: '375px',
                        position: 'relative'
                    } : {
                        width: '90%',
                        maxWidth: '1200px'
                    })
                }}>
                    {/* iPhone Bezel for Mobile */}
                    {viewMode === 'mobile' && (
                        <div style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '120px',
                            height: '28px',
                            background: '#0f172a',
                            borderRadius: '0 0 16px 16px',
                            zIndex: 10
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '60px',
                                height: '6px',
                                background: '#1e293b',
                                borderRadius: '3px'
                            }} />
                        </div>
                    )}

                    {/* Preview Container */}
                    <div style={{
                        background: 'white',
                        borderRadius: viewMode === 'mobile' ? '32px' : '12px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: viewMode === 'mobile' ? '8px solid #0f172a' : '1px solid #e2e8f0'
                    }}>
                        <iframe
                            ref={iframeRef}
                            srcDoc={prepareHtmlForEditor(getCurrentHtml())}
                            style={{
                                width: '100%',
                                height: viewMode === 'mobile' ? '700px' : 'calc(100vh - 200px)',
                                border: 'none',
                                display: 'block'
                            }}
                            title="Visual Editor"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>

                    {/* iPhone Home Indicator */}
                    {viewMode === 'mobile' && (
                        <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '120px',
                            height: '4px',
                            background: '#0f172a',
                            borderRadius: '2px'
                        }} />
                    )}
                </div>
            </main>

            {/* Floating Bottom Dock */}
            <div style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '999px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                zIndex: 100
            }}>
                {/* Theme Button */}
                <div style={{ position: 'relative' }}>
                    {showThemePanel && (
                        <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '12px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            padding: '16px',
                            borderRadius: '20px',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                            zIndex: 200,
                            minWidth: '280px',
                            border: '1px solid rgba(255,255,255,0.5)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px'
                            }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                                    Select Theme
                                </span>
                                <button
                                    onClick={() => setShowThemePanel(false)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                                >
                                    <X size={14} color="#64748b" />
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <ThemeSelector
                                    selectedTheme={currentTheme}
                                    onSelect={handleThemeUpdate}
                                />
                            </div>

                            {isUpdatingTheme && (
                                <div style={{
                                    marginTop: '8px',
                                    textAlign: 'center',
                                    fontSize: '11px',
                                    color: '#64748b'
                                }}>
                                    Updating colors...
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setShowThemePanel(!showThemePanel)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '10px 16px',
                            background: showThemePanel ? '#f1f5f9' : 'none',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '12px',
                            color: showThemePanel ? '#0f172a' : '#64748b',
                            fontSize: '11px',
                            fontWeight: 500,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Palette size={20} />
                        Theme
                    </button>
                </div>

                {/* Content Button */}
                <button style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: 500
                }}>
                    <Type size={20} />
                    Content
                </button>

                {/* Images Button */}
                <button style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: 500
                }}>
                    <ImageIcon size={20} />
                    Images
                </button>

                {/* Device Toggle */}
                <div style={{
                    display: 'flex',
                    background: '#f1f5f9',
                    borderRadius: '10px',
                    padding: '4px',
                    marginLeft: '8px',
                    marginRight: '8px'
                }}>
                    <button
                        onClick={() => setViewMode('desktop')}
                        style={{
                            padding: '8px 12px',
                            background: viewMode === 'desktop' ? 'white' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: viewMode === 'desktop' ? '#0f172a' : '#94a3b8',
                            boxShadow: viewMode === 'desktop' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            fontSize: '12px',
                            fontWeight: 500
                        }}
                    >
                        <Monitor size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('mobile')}
                        style={{
                            padding: '8px 12px',
                            background: viewMode === 'mobile' ? 'white' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: viewMode === 'mobile' ? '#0f172a' : '#94a3b8',
                            boxShadow: viewMode === 'mobile' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            fontSize: '12px',
                            fontWeight: 500
                        }}
                    >
                        <Smartphone size={16} />
                    </button>
                </div>

                {/* Publish Button */}
                <button
                    onClick={() => router.push(`/preview/${id}`)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #0D9488 0%, #0f766e 100%)',
                        border: 'none',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(13, 148, 136, 0.4)'
                    }}
                >
                    <Rocket size={16} />
                    Publish
                </button>
            </div>

            {/* Floating Voice Command Button */}
            <button style={{
                position: 'fixed',
                bottom: '100px',
                right: '24px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0D9488 0%, #0f766e 100%)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 8px 24px rgba(13, 148, 136, 0.4)',
                zIndex: 90
            }}>
                <Mic size={24} />
            </button>

            {/* Floating Edit Panel */}
            {showEditPanel && selectedElement && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '24px',
                    width: '320px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    zIndex: 100
                }}>
                    {/* Panel Header */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#0f172a',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {selectedElement.type === 'image' ? <ImageIcon size={16} /> : <Type size={16} />}
                            {selectedElement.type === 'image' ? 'Edit Image' : 'Edit Text'}
                        </span>
                        <button
                            onClick={closeEditPanel}
                            style={{
                                background: '#f1f5f9',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex'
                            }}
                        >
                            <X size={16} color="#64748b" />
                        </button>
                    </div>

                    {/* Panel Content */}
                    <div style={{ padding: '20px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#64748b',
                                marginBottom: '8px'
                            }}>
                                Content
                            </label>
                            {selectedElement.type === 'image' ? (
                                <>
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        placeholder="Image URL"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '10px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <button
                                        onClick={() => setShowImageUploader(true)}
                                        style={{
                                            width: '100%',
                                            marginTop: '12px',
                                            padding: '10px',
                                            background: '#f0fdfa',
                                            border: '1px solid #0D9488',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: '#0D9488'
                                        }}
                                    >
                                        <Upload size={16} />
                                        Upload Image
                                    </button>
                                </>
                            ) : (
                                <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            )}
                        </div>

                        {/* AI Rewrite Button */}
                        {selectedElement.type !== 'image' && (
                            <button style={{
                                width: '100%',
                                padding: '10px',
                                background: '#fef3c7',
                                border: '1px solid #fcd34d',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#92400e',
                                marginBottom: '16px'
                            }}>
                                <Wand2 size={16} />
                                AI Rewrite ✨
                            </button>
                        )}

                        {/* Link URL for buttons */}
                        {selectedElement.type === 'button' && (
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    color: '#64748b',
                                    marginBottom: '8px'
                                }}>
                                    Link URL
                                </label>
                                <input
                                    type="text"
                                    value={linkValue}
                                    onChange={(e) => setLinkValue(e.target.value)}
                                    placeholder="https://... or tel:..."
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Image Uploader Modal */}
            {showImageUploader && (
                <ImageUploader
                    websiteId={id}
                    accessToken={getAccessToken()}
                    currentImageUrl={editValue}
                    onUploadComplete={(publicUrl) => {
                        setEditValue(publicUrl);
                        setShowImageUploader(false);
                    }}
                    onClose={() => setShowImageUploader(false)}
                />
            )}
        </div>
    );
}
