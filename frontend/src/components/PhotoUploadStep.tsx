'use client';

/**
 * PhotoUploadStep Component
 * 
 * India market only - allows users to upload their real shop photos
 * before generation. Photos are uploaded to R2 and URLs are passed
 * to the generate API for use in Hero/About sections.
 */

import { useState, useRef, useEffect } from 'react';
import { Plus, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface PhotoUploadStepProps {
    accessToken: string | null;
    tempRequestId: string;
    onImagesChange: (urls: string[]) => void;
    language: 'en' | 'hi';
}

interface PhotoSlot {
    id: number;
    label: { en: string; hi: string };
    sublabel: { en: string; hi: string };
    url: string | null;
    uploading: boolean;
}

const content = {
    en: {
        title: "Show customers your shop!",
        subtitle: "Websites with real photos get 3x more orders. Upload 1 to 3 photos.",
        skip: "Skip (Use Stock Photos)",
        uploading: "Uploading..."
    },
    hi: {
        title: "अपना दुकान दिखाएं!",
        subtitle: "असली photos वाली websites को 3x ज्यादा orders मिलते हैं। 1 से 3 photos upload करें।",
        skip: "Skip करें (Stock Photos इस्तेमाल करें)",
        uploading: "Upload हो रहा है..."
    }
};

export default function PhotoUploadStep({
    accessToken,
    tempRequestId,
    onImagesChange,
    language
}: PhotoUploadStepProps) {
    const t = content[language];
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

    const [slots, setSlots] = useState<PhotoSlot[]>([
        {
            id: 0,
            label: { en: "Shop Front", hi: "दुकान का Front" },
            sublabel: { en: "Your storefront or office", hi: "आपकी दुकान या office" },
            url: null,
            uploading: false
        },
        {
            id: 1,
            label: { en: "Owner/Team", hi: "Owner/Team" },
            sublabel: { en: "A photo of you or your team", hi: "आपकी या team की photo" },
            url: null,
            uploading: false
        },
        {
            id: 2,
            label: { en: "Product/Service", hi: "Product/Service" },
            sublabel: { en: "What you sell or do", hi: "आप क्या बेचते या करते हैं" },
            url: null,
            uploading: false
        }
    ]);

    // Notify parent whenever slots change
    useEffect(() => {
        const urls = slots.filter(s => s.url).map(s => s.url as string);
        onImagesChange(urls);
    }, [slots, onImagesChange]);

    const uploadToR2 = async (file: File, slotId: number) => {
        // Update slot to uploading state
        setSlots(prev => prev.map(slot =>
            slot.id === slotId ? { ...slot, uploading: true } : slot
        ));

        try {
            // Step 1: Get presigned URL
            const presignResponse = await fetch('/api/upload/presign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    content_type: file.type,
                    website_id: `temp_${tempRequestId}`,
                    access_token: accessToken
                })
            });

            if (!presignResponse.ok) {
                throw new Error('Failed to get upload URL');
            }

            const { upload_url, public_url } = await presignResponse.json();

            // Step 2: Upload directly to R2
            const uploadResponse = await fetch(upload_url, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            // Step 3: Update slot with public URL
            setSlots(prev => prev.map(slot =>
                slot.id === slotId ? { ...slot, url: public_url, uploading: false } : slot
            ));

        } catch (error) {
            console.error('Upload error:', error);
            setSlots(prev => prev.map(slot =>
                slot.id === slotId ? { ...slot, uploading: false } : slot
            ));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, slotId: number) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                return;
            }
            uploadToR2(file, slotId);
        }
    };

    const removePhoto = (slotId: number) => {
        setSlots(prev => prev.map(slot =>
            slot.id === slotId ? { ...slot, url: null } : slot
        ));
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)',
            border: '1px solid #99f6e4',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                }}>
                    <ImageIcon size={24} color="#0d9488" />
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#0f172a',
                        margin: 0
                    }}>
                        {t.title}
                    </h3>
                </div>
                <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: 0
                }}>
                    {t.subtitle}
                </p>
            </div>

            {/* Photo Slots */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '16px'
            }}>
                {slots.map((slot) => (
                    <div key={slot.id} style={{ position: 'relative' }}>
                        <input
                            ref={el => { fileInputRefs.current[slot.id] = el; }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, slot.id)}
                            style={{ display: 'none' }}
                        />

                        {slot.url ? (
                            // Photo Preview
                            <div style={{
                                position: 'relative',
                                aspectRatio: '1',
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}>
                                <img
                                    src={slot.url}
                                    alt={slot.label[language]}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <button
                                    onClick={() => removePhoto(slot.id)}
                                    style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '6px',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'rgba(0,0,0,0.6)',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            // Upload Button
                            <button
                                onClick={() => fileInputRefs.current[slot.id]?.click()}
                                disabled={slot.uploading}
                                style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    background: slot.uploading ? '#f1f5f9' : 'white',
                                    border: '2px dashed #cbd5e1',
                                    borderRadius: '12px',
                                    cursor: slot.uploading ? 'wait' : 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {slot.uploading ? (
                                    <Loader2 size={24} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <Plus size={24} color="#94a3b8" />
                                )}
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: '#64748b',
                                    textAlign: 'center',
                                    padding: '0 4px'
                                }}>
                                    {slot.uploading ? t.uploading : slot.label[language]}
                                </span>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Helper text */}
            <p style={{
                fontSize: '12px',
                color: '#94a3b8',
                textAlign: 'center',
                margin: 0
            }}>
                {language === 'en'
                    ? "Tip: Photos from your phone gallery work great!"
                    : "Tip: Phone gallery से photos अच्छे काम करते हैं!"}
            </p>

            {/* Spin animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
}
