'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function UseCaseCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const useCases = [
        {
            title: 'For the Home Baker',
            quote: 'Showcase your menu and take cake orders directly on WhatsApp.',
            emoji: '🧁',
            gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
        },
        {
            title: 'For the Tutor',
            quote: 'List your subjects and let parents book a demo class instantly.',
            emoji: '📚',
            gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
        },
        {
            title: 'For the Plumber',
            quote: 'Look professional on Google so high-value clients trust you.',
            emoji: '🔧',
            gradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
        },
        {
            title: 'For the Freelancer',
            quote: 'A portfolio that looks like it cost $2,000, built in 2 minutes.',
            emoji: '💼',
            gradient: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)'
        }
    ];

    // Auto-advance every 4 seconds
    useEffect(() => {
        if (!isPaused) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % useCases.length);
            }, 4000);
            return () => clearInterval(timer);
        }
    }, [isPaused, useCases.length]);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + useCases.length) % useCases.length);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % useCases.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <section
            id="use-cases"
            className="use-case-carousel-section"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="carousel-container">
                <h2 className="carousel-title">Built for every local hero</h2>

                <div className="carousel-wrapper">
                    <button
                        className="carousel-nav carousel-nav-prev"
                        onClick={goToPrevious}
                        aria-label="Previous use case"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="carousel-track">
                        {useCases.map((useCase, index) => (
                            <div
                                key={index}
                                className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
                                style={{
                                    background: useCase.gradient,
                                    display: index === currentIndex ? 'flex' : 'none'
                                }}
                            >
                                <div className="carousel-emoji">{useCase.emoji}</div>
                                <h3 className="carousel-slide-title">{useCase.title}</h3>
                                <p className="carousel-slide-quote">&quot;{useCase.quote}&quot;</p>
                            </div>
                        ))}
                    </div>

                    <button
                        className="carousel-nav carousel-nav-next"
                        onClick={goToNext}
                        aria-label="Next use case"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                <div className="carousel-dots">
                    {useCases.map((_, index) => (
                        <button
                            key={index}
                            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
