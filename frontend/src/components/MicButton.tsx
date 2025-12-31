'use client';

import { Mic } from 'lucide-react';

interface MicButtonProps {
    isRecording: boolean;
    isProcessing?: boolean;
    onClick: () => void;
    disabled?: boolean;
}

export default function MicButton({ isRecording, isProcessing = false, onClick, disabled = false }: MicButtonProps) {
    return (
        <div className="mic-button-container">
            <button
                className={`mic-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
                onClick={onClick}
                disabled={disabled || isProcessing}
                aria-label="Record voice input"
            >
                {isProcessing ? (
                    <div className="spinner" />
                ) : (
                    <Mic size={32} strokeWidth={2} color="white" />
                )}
            </button>
            {isRecording && (
                <>
                    <div className="ripple ripple-1" />
                    <div className="ripple ripple-2" />
                </>
            )}
        </div>
    );
}
