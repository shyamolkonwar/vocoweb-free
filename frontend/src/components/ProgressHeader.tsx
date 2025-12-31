'use client';

import React from 'react';

interface ProgressHeaderProps {
    currentStep: 'identity' | 'preview' | 'launch';
}

export default function ProgressHeader({ currentStep }: ProgressHeaderProps) {
    const steps = [
        { id: 'identity', label: 'Identity', sublabel: 'Input' },
        { id: 'preview', label: 'Preview', sublabel: 'Design' },
        { id: 'launch', label: 'Launch', sublabel: 'Publish' }
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="progress-header">
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className={`progress-step ${index <= currentIndex ? 'active' : ''}`}>
                        <div className="progress-step-number">
                            {index <= currentIndex ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            ) : (
                                <span>{index + 1}</span>
                            )}
                        </div>
                        <div className="progress-step-labels">
                            <span className="progress-step-label">{step.label}</span>
                            <span className="progress-step-sublabel">{step.sublabel}</span>
                        </div>
                    </div>
                    {index < steps.length - 1 && (
                        <div key={`line-${index}`} className={`progress-line ${index < currentIndex ? 'active' : ''}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
