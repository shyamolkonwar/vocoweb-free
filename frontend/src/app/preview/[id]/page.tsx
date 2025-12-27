'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone, Monitor, Wand2, Pencil, Rocket, X, Check, Copy } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/context/AuthContext';

const content = {
    en: {
        loading: "Loading preview...",
        mobile: "Mobile",
        desktop: "Desktop",
        regenerate: "Regenerate",
        publish: "Publish Website",
        published: "Published",
        republish: "Republish",
        publishing: "Publishing...",
        edit: "Edit",
        editPrompt: "Edit with text",
        editWebsite: "Edit Website",
        back: "← Back to edit",
        draft: "Draft",
        live: "Live",
        publishSuccess: "🎉 Your website is live!",
        visitSite: "Visit Website",
        copyLink: "Copy Link",
        copied: "Copied!",
        close: "Close"
    },
    hi: {
        loading: "Preview load हो रहा है...",
        mobile: "Mobile",
        desktop: "Desktop",
        regenerate: "फिर से",
        publish: "Publish",
        published: "Published",
        republish: "Republish",
        publishing: "Publish हो रहा...",
        edit: "Edit",
        back: "वापas",
        draft: "Draft",
        live: "Live",
        publishSuccess: "🎉 आपकी website live है!",
        visitSite: "Website देखें",
        copyLink: "Link Copy",
        copied: "Copy हो गया!",
        close: "बंद करें"
    }
};

interface WebsiteData {
    id: string;
    html: string;  // Legacy single-page HTML
    pages?: { [filename: string]: string };  // Multi-page HTML dict
    business: {
        business_name: string;
        business_type: string;
        location: string;
    };
}

interface PublishData {
    subdomain: string;
    url: string;
    published_at: string;
}

/**
 * Prepares HTML for safe preview by injecting:
 * 1. Base tag to keep navigation within iframe
 * 2. Interceptor script to prevent link breakouts
 */
function prepareHtmlForPreview(html: string): string {
    if (!html) return '';

    // The interceptor script that prevents navigation breakouts
    // We use a more aggressive approach to block navigation
    const interceptorScript = `
    <script>
    (function() {
        console.log('[Preview Mode] Interceptor active');
        
        // Helper to show toast
        function showToast(message) {
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#334155;color:white;padding:8px 16px;border-radius:20px;font-family:sans-serif;font-size:12px;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;box-shadow:0 4px 6px rgba(0,0,0,0.1);';
            toast.textContent = message;
            document.body.appendChild(toast);
            requestAnimationFrame(() => toast.style.opacity = '1');
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }

        // 1. Monkey patch window.open
        window.open = function(url) {
            console.log('[Preview Mode] window.open blocked:', url);
            showToast('External links are blocked in preview');
            return null;
        };

        // 2. Intercept click events
        document.addEventListener('click', function(e) {
            // Find closest anchor or button
            const target = e.target.closest('a, button');
            
            if (!target) return;
            
            // Handle regular links
            if (target.tagName === 'A') {
                const href = target.getAttribute('href');
                
                // Allow anchors within page
                if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
                
                // Allow contact links
                if (href.startsWith('tel:') || href.startsWith('mailto:')) return;
                
                // Block everything else
                e.preventDefault();
                e.stopPropagation();
                console.log('[Preview Mode] Link blocked:', href);
                showToast('Navigation blocked in preview mode');
            }
            
            // Handle buttons that might submit forms
            if (target.tagName === 'BUTTON' && target.type === 'submit') {
                // Let the submit listener handle it
            }
        }, true); // Capture phase required
        
        // 3. Intercept form submissions
        document.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Preview Mode] Form submission blocked');
            showToast('Forms are disabled in preview');
        }, true);

        // 4. Attempt to block location changes (best effort)
        try {
            Object.defineProperty(window, 'location', {
                configurable: false,
                enumerable: true, 
                get: function() { return document.location; },
                set: function(val) { 
                    console.log('[Preview Mode] location set blocked:', val);
                    showToast('Redirect blocked in preview');
                }
            });
        } catch(e) {
            // Some browsers don't allow re-defining location
            console.log("Could not lock window.location");
        }

    })();
    </script>
    `;

    const baseTag = '<base target="_self" />';
    let processedHtml = html;

    // Robust injection using Regex
    // Inject <base> after <head>
    if (/<head>/i.test(processedHtml)) {
        processedHtml = processedHtml.replace(/<head>/i, `<head>\n${baseTag}`);
    } else if (/<html.*?>/i.test(processedHtml)) {
        processedHtml = processedHtml.replace(/(<html.*?>)/i, `$1\n<head>${baseTag}</head>`);
    } else {
        processedHtml = `${baseTag}\n${processedHtml}`;
    }

    // Inject script before </body>
    if (/<\/body>/i.test(processedHtml)) {
        processedHtml = processedHtml.replace(/<\/body>/i, `${interceptorScript}\n</body>`);
    } else {
        processedHtml = `${processedHtml}\n${interceptorScript}`;
    }

    return processedHtml;
}

export default function StudioPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const containerRef = useRef<HTMLDivElement>(null);

    const [language, setLanguage] = useState<'en' | 'hi'>('en');
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [publishData, setPublishData] = useState<PublishData | null>(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [scale, setScale] = useState(1);
    const [currentPage, setCurrentPage] = useState('index.html');  // Multi-page navigation

    const { isAuthenticated, getAccessToken } = useAuth();
    const t = content[language];

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Calculate scale for desktop view on mobile
    useEffect(() => {
        if (isMobile && viewMode === 'desktop' && containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth - 32; // padding
            const desktopWidth = 1440;
            setScale(Math.min(containerWidth / desktopWidth, 1));
        } else if (isMobile && viewMode === 'mobile') {
            setScale(1);
        } else {
            setScale(1);
        }
    }, [isMobile, viewMode]);

    useEffect(() => {
        fetchPreview();
        checkPublishStatus();
    }, [id]);

    // Listen for postMessage navigation events from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NAVIGATE_PREVIEW') {
                const targetPath = event.data.payload;

                // Normalize path (handle "services" vs "services.html")
                const cleanPath = targetPath.endsWith('.html')
                    ? targetPath
                    : `${targetPath.replace(/^\//, '')}.html`;

                // Check if page exists in our data
                if (websiteData?.pages && websiteData.pages[cleanPath]) {
                    setCurrentPage(cleanPath);
                    console.log('[Preview] Navigated to:', cleanPath);
                } else {
                    console.warn('[Preview] Page not found:', cleanPath);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [websiteData]);

    const fetchPreview = async () => {
        try {
            const response = await fetch(`/api/preview/${id}`);
            const data = await response.json();
            if (response.ok) {
                setWebsiteData(data);
            } else {
                setError(data.error || 'Failed to load preview');
            }
        } catch {
            setError('Failed to load preview');
        } finally {
            setLoading(false);
        }
    };

    const checkPublishStatus = async () => {
        try {
            const response = await fetch(`/api/publish/${id}/status`);
            const data = await response.json();
            if (data.published) {
                setPublishData({
                    subdomain: data.subdomain,
                    url: data.url,
                    published_at: data.published_at
                });
            }
        } catch {
            // Not published yet
        }
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        try {
            const response = await fetch(`/api/regenerate/${id}`, { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                setWebsiteData(data);
            } else {
                setError(data.error || 'Failed to regenerate');
            }
        } catch {
            setError('Failed to regenerate');
        } finally {
            setRegenerating(false);
        }
    };

    const handlePublish = async () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        setPublishing(true);
        setError('');

        try {
            const token = getAccessToken();
            const endpoint = publishData ? `/api/republish/${id}` : `/api/publish/${id}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setPublishData({
                    subdomain: data.subdomain,
                    url: data.url,
                    published_at: data.published_at
                });
                setShowPublishModal(true);
            } else if (response.status === 401) {
                setShowAuthModal(true);
            } else {
                setError(data.detail || 'Failed to publish');
            }
        } catch {
            setError('Failed to publish');
        } finally {
            setPublishing(false);
        }
    };

    const copyLink = () => {
        if (publishData?.url) {
            navigator.clipboard.writeText(publishData.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const siteName = websiteData?.business?.business_name || 'Your Website';

    // Styles
    const styles = {
        container: {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column' as const,
            backgroundColor: isMobile ? '#f8fafc' : '#0f172a'
        },
        // Mobile Header (50px, minimal)
        mobileHeader: {
            height: '50px',
            display: isMobile ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            backgroundColor: 'white',
            borderBottom: '1px solid #e2e8f0',
            position: 'sticky' as const,
            top: 0,
            zIndex: 50
        },
        // Desktop Toolbar
        desktopToolbar: {
            height: '60px',
            display: isMobile ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155'
        },
        // Preview Area
        previewArea: {
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: isMobile ? '0' : '24px',
            paddingBottom: isMobile ? '80px' : '24px',
            overflow: 'auto'
        },
        // Device Frame Wrapper
        deviceWrapper: {
            width: viewMode === 'mobile' ? (isMobile ? '100%' : '390px') : (isMobile ? '1440px' : '100%'),
            maxWidth: isMobile ? '100%' : '1200px',
            transform: isMobile && viewMode === 'desktop' ? `scale(${scale})` : 'none',
            transformOrigin: 'top center',
            transition: 'transform 0.3s ease'
        },
        // Browser Frame
        browserFrame: {
            backgroundColor: 'white',
            borderRadius: isMobile ? '0' : '12px',
            overflow: 'hidden',
            boxShadow: isMobile ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        },
        browserHeader: {
            display: isMobile && viewMode === 'mobile' ? 'none' : 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
            gap: '12px'
        },
        browserDots: {
            display: 'flex',
            gap: '6px'
        },
        dot: (color: string) => ({
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: color
        }),
        urlBar: {
            flex: 1,
            backgroundColor: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#64748b',
            border: '1px solid #e2e8f0'
        },
        iframe: {
            width: '100%',
            height: isMobile ? 'calc(100vh - 130px)' : '70vh',
            border: 'none'
        },
        // Bottom Action Bar (Mobile)
        bottomBar: {
            position: 'fixed' as const,
            bottom: 0,
            left: 0,
            right: 0,
            height: '70px',
            display: isMobile ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 16px',
            backgroundColor: 'white',
            borderTop: '1px solid #e2e8f0',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
            zIndex: 50
        },
        // Action Buttons
        actionBtn: (primary: boolean) => ({
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '4px',
            padding: primary ? '10px 24px' : '10px 16px',
            backgroundColor: primary ? '#0d9488' : 'transparent',
            color: primary ? 'white' : '#64748b',
            border: 'none',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            minWidth: '70px'
        }),
        // Desktop Buttons
        toolbarBtn: (primary: boolean) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: primary ? '10px 20px' : '10px 16px',
            backgroundColor: primary ? '#0d9488' : 'transparent',
            color: primary ? 'white' : '#94a3b8',
            border: primary ? 'none' : '1px solid #475569',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
        }),
        viewToggle: {
            display: 'flex',
            backgroundColor: '#334155',
            borderRadius: '8px',
            padding: '4px'
        },
        viewBtn: (active: boolean) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: active ? '#475569' : 'transparent',
            color: active ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer'
        })
    };

    if (loading) {
        return (
            <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', color: isMobile ? '#1e293b' : 'white' }}>
                    <div className="spinner large" style={{ margin: '0 auto 16px' }}></div>
                    <p>{t.loading}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', color: '#ef4444' }}>
                    <p>{error}</p>
                    <button onClick={() => router.push('/dashboard')} style={styles.toolbarBtn(true)}>
                        {t.back}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Mobile Header - Minimal */}
            <header style={styles.mobileHeader}>
                <button
                    onClick={() => router.push('/dashboard')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                >
                    <ArrowLeft size={20} color="#64748b" />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{siteName}</span>
                    <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: publishData ? '#dcfce7' : '#fef3c7',
                        color: publishData ? '#166534' : '#92400e',
                        borderRadius: '4px',
                        fontWeight: 500
                    }}>
                        {publishData ? 'Live' : t.draft}
                    </span>
                </div>

                <button
                    onClick={() => setViewMode(viewMode === 'mobile' ? 'desktop' : 'mobile')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                >
                    {viewMode === 'mobile' ? <Monitor size={20} color="#64748b" /> : <Smartphone size={20} color="#64748b" />}
                </button>
            </header>

            {/* Desktop Toolbar */}
            <header style={styles.desktopToolbar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => router.push('/dashboard')}
                        style={{ ...styles.toolbarBtn(false), border: 'none' }}
                    >
                        <ArrowLeft size={18} />
                        {t.back}
                    </button>
                    <span style={{ color: 'white', fontWeight: 600 }}>{siteName}</span>
                </div>

                {/* Center - View Toggle */}
                <div style={styles.viewToggle}>
                    <button
                        style={styles.viewBtn(viewMode === 'mobile')}
                        onClick={() => setViewMode('mobile')}
                    >
                        <Smartphone size={16} />
                        {t.mobile}
                    </button>
                    <button
                        style={styles.viewBtn(viewMode === 'desktop')}
                        onClick={() => setViewMode('desktop')}
                    >
                        <Monitor size={16} />
                        {t.desktop}
                    </button>
                </div>

                {/* Right - Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        style={styles.toolbarBtn(false)}
                    >
                        <Wand2 size={16} />
                        {regenerating ? '...' : t.regenerate}
                    </button>
                    <a href={`/editor/${id}`} style={{ ...styles.toolbarBtn(false), textDecoration: 'none' }}>
                        <Pencil size={16} />
                        {t.edit}
                    </a>
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        style={{
                            ...styles.toolbarBtn(true),
                            backgroundColor: publishData ? '#22c55e' : '#0d9488',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {publishData && (
                            <span style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#86efac',
                                borderRadius: '50%',
                                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                            }}></span>
                        )}
                        <Rocket size={16} />
                        {publishing ? t.publishing : (publishData ? t.published : t.publish)}
                    </button>
                </div>
            </header>

            {/* Preview Area */}
            <div ref={containerRef} style={styles.previewArea}>
                <div style={styles.deviceWrapper}>
                    <div style={styles.browserFrame}>
                        {/* Browser Header */}
                        <div style={styles.browserHeader}>
                            <div style={styles.browserDots}>
                                <span style={styles.dot('#ef4444')}></span>
                                <span style={styles.dot('#eab308')}></span>
                                <span style={styles.dot('#22c55e')}></span>
                            </div>
                            <div style={styles.urlBar}>
                                {publishData?.url || `${siteName.toLowerCase().replace(/\s+/g, '-')}.laxizen.fun`}
                            </div>
                        </div>
                        {/* Website Preview */}
                        <iframe
                            srcDoc={prepareHtmlForPreview(
                                websiteData?.pages
                                    ? (websiteData.pages[currentPage] || websiteData.pages['index.html'] || '')
                                    : (websiteData?.html || '')
                            )}
                            style={styles.iframe}
                            title="Website Preview"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar - Mobile Only */}
            <div style={styles.bottomBar}>
                <button onClick={handleRegenerate} disabled={regenerating} style={styles.actionBtn(false)}>
                    <Wand2 size={20} />
                    <span>{t.regenerate}</span>
                </button>
                <a href={`/editor/${id}`} style={{ ...styles.actionBtn(false), textDecoration: 'none' }}>
                    <Pencil size={20} />
                    <span>{t.edit}</span>
                </a>
                <button
                    onClick={handlePublish}
                    disabled={publishing}
                    style={{
                        ...styles.actionBtn(true),
                        backgroundColor: publishData ? '#22c55e' : '#0d9488',
                        position: 'relative'
                    }}
                >
                    {publishData && (
                        <span style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#86efac',
                            borderRadius: '50%',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }}></span>
                    )}
                    <Rocket size={20} />
                    <span>{publishing ? '...' : (publishData ? t.published : t.publish)}</span>
                </button>
            </div>

            {/* Publish Success Modal */}
            {showPublishModal && publishData && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    padding: '16px'
                }} onClick={() => setShowPublishModal(false)}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '400px',
                        width: '100%',
                        textAlign: 'center'
                    }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowPublishModal(false)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={24} color="#64748b" />
                        </button>

                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>{t.publishSuccess}</h2>

                        <div style={{
                            backgroundColor: '#f8fafc',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#22c55e',
                                borderRadius: '50%',
                                animation: 'pulse 2s infinite'
                            }}></span>
                            <code style={{ fontSize: '14px', color: '#0d9488' }}>{publishData.url}</code>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <a
                                href={publishData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    flex: 1,
                                    ...styles.toolbarBtn(true),
                                    textDecoration: 'none',
                                    justifyContent: 'center'
                                }}
                            >
                                {t.visitSite}
                            </a>
                            <button onClick={copyLink} style={{ ...styles.toolbarBtn(false), flex: 1, justifyContent: 'center' }}>
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? t.copied : t.copyLink}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Modal */}
            {showAuthModal && (
                <AuthModal
                    language={language}
                    onClose={() => setShowAuthModal(false)}
                    title={language === 'en' ? 'Login to Publish' : 'Publish करने के लिए Login करें'}
                    subtitle={language === 'en'
                        ? 'Sign in to publish your website and make it live'
                        : 'अपनी website publish और live करने के लिए sign in करें'
                    }
                />
            )}
        </div>
    );
}
