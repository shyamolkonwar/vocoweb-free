'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: 'Will I have to pay hidden fees later?',
            answer: 'No. During our Beta period, the plan you lock in is free forever. We believe in transparent pricing.'
        },
        {
            question: 'Can I use my own domain (like .com or .in)?',
            answer: 'Yes! You can connect any custom domain to your VocoWeb site in seconds.'
        },
        {
            question: 'Is the text generic AI nonsense?',
            answer: 'No. Our AI is trained on successful local business websites. It writes sales-focused copy, not generic filler text.'
        },
        {
            question: "What if I don't speak good English?",
            answer: "That's our superpower. Speak to the app in Hindi, Hinglish, or broken English—we will polish it into professional business language for you."
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="faq-section">
            <div className="faq-container">
                <h2 className="faq-title">Frequently Asked Questions</h2>

                <div className="faq-list">
                    {faqs.map((faq, index) => (
                        <div key={index} className="faq-item">
                            <button
                                className="faq-question-btn"
                                onClick={() => toggleFAQ(index)}
                                aria-expanded={openIndex === index}
                            >
                                <span className="faq-question">{faq.question}</span>
                                <span className="faq-icon">
                                    {openIndex === index ? (
                                        <Minus size={20} strokeWidth={2} />
                                    ) : (
                                        <Plus size={20} strokeWidth={2} />
                                    )}
                                </span>
                            </button>

                            <div className={`faq-answer ${openIndex === index ? 'open' : ''}`}>
                                <p>{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
