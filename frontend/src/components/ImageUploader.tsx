'use client';

/**
 * ImageUploader Component
 * 
 * A premium drag-and-drop image uploader that:
 * 1. Gets a presigned URL from the backend
 * 2. Uploads directly to Cloudflare R2
 * 3. Returns the public URL for use in the website
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';

interface ImageUploaderProps {
    websiteId: string;
    accessToken: string | null;
    onUploadComplete: (publicUrl: string) => void;
    onClose: () => void;
    currentImageUrl?: string;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export default function ImageUploader({
    websiteId,
    accessToken,
    onUploadComplete,
    onClose,
    currentImageUrl
}: ImageUploaderProps) {
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_SIZE_MB = 5;

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'Only JPG, PNG, WebP, and GIF images are allowed';
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            return `File size must be under ${MAX_SIZE_MB}MB`;
        }
        return null;
    };

    const uploadFile = async (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setUploadState('uploading');
        setProgress(10);
        setError('');

        try {
            // Step 1: Get presigned URL
            setProgress(20);

            if (!accessToken) {
                throw new Error('Please log in to upload images');
            }

            const presignResponse = await fetch('/api/upload/presign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    content_type: file.type,
                    website_id: websiteId,
                    access_token: accessToken
                })
            });

            if (!presignResponse.ok) {
                const errData = await presignResponse.json();
                throw new Error(errData.error || 'Failed to get upload URL');
            }

            const { upload_url, public_url } = await presignResponse.json();
            setProgress(40);

            // Step 2: Upload directly to R2
            const uploadResponse = await fetch(upload_url, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload to storage');
            }

            setProgress(90);

            // Step 3: Success!
            setProgress(100);
            setUploadState('success');

            // Create preview
            setPreviewUrl(URL.createObjectURL(file));

            // Notify parent after a brief delay to show success state
            setTimeout(() => {
                onUploadComplete(public_url);
            }, 500);

        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Upload failed');
            setUploadState('error');
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            uploadFile(file);
        }
    }, [websiteId]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadFile(file);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)'
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'relative',
                background: 'white',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <ImageIcon size={20} />
                        Upload Image
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex'
                        }}
                    >
                        <X size={18} color="#64748b" />
                    </button>
                </div>

                {/* Drop Zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragOver ? '#0D9488' : '#e2e8f0'}`,
                        borderRadius: '16px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: dragOver ? '#f0fdfa' : '#f8fafc',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_TYPES.join(',')}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    {uploadState === 'uploading' ? (
                        <div>
                            <Loader2
                                size={40}
                                color="#0D9488"
                                style={{
                                    margin: '0 auto 16px',
                                    animation: 'spin 1s linear infinite'
                                }}
                            />
                            <p style={{ color: '#0D9488', fontWeight: 500 }}>
                                Uploading... {progress}%
                            </p>
                            <div style={{
                                marginTop: '12px',
                                height: '4px',
                                background: '#e2e8f0',
                                borderRadius: '2px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${progress}%`,
                                    background: '#0D9488',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>
                    ) : uploadState === 'success' ? (
                        <div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: '#dcfce7',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px'
                            }}>
                                <Check size={24} color="#22c55e" />
                            </div>
                            <p style={{ color: '#22c55e', fontWeight: 500 }}>
                                Upload complete!
                            </p>
                        </div>
                    ) : (
                        <div>
                            <Upload
                                size={40}
                                color={dragOver ? '#0D9488' : '#94a3b8'}
                                style={{ margin: '0 auto 16px' }}
                            />
                            <p style={{
                                color: '#0f172a',
                                fontWeight: 500,
                                marginBottom: '8px'
                            }}>
                                Drop your image here
                            </p>
                            <p style={{
                                color: '#94a3b8',
                                fontSize: '14px'
                            }}>
                                or click to browse
                            </p>
                            <p style={{
                                color: '#cbd5e1',
                                fontSize: '12px',
                                marginTop: '12px'
                            }}>
                                JPG, PNG, WebP, GIF • Max {MAX_SIZE_MB}MB
                            </p>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#dc2626',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                {/* Current Image Preview */}
                {previewUrl && uploadState !== 'uploading' && (
                    <div style={{ marginTop: '16px' }}>
                        <p style={{
                            fontSize: '12px',
                            color: '#64748b',
                            marginBottom: '8px'
                        }}>
                            {uploadState === 'success' ? 'New Image' : 'Current Image'}
                        </p>
                        <img
                            src={previewUrl}
                            alt="Preview"
                            style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}
                        />
                    </div>
                )}
            </div>

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
