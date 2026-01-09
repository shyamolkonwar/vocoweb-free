'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Check, Phone, Edit3 } from 'lucide-react';
import { validateIndianPhone, formatPhoneDisplay, generateBookingMessage } from '@/lib/whatsapp';

interface WhatsAppSettingsProps {
    language: 'en' | 'hi';
    businessName?: string;
    businessType?: string;
    initialPhone?: string;
    initialMessage?: string;
    onConfirm: (phone: string, message: string) => void;
    onSkip: () => void;
}

const content = {
    en: {
        title: "Get bookings via WhatsApp",
        subtitle: "Customers will message you directly on WhatsApp when they click 'Book Now'",
        phoneLabel: "Your WhatsApp Number",
        phonePlaceholder: "98765 43210",
        messageLabel: "Pre-filled Message",
        messageHint: "This is what customers will see when they open the chat",
        confirm: "Enable WhatsApp Booking",
        skip: "Skip (Use Contact Form)",
        invalidPhone: "Please enter a valid 10-digit mobile number",
        preview: "Preview:"
    },
    hi: {
        title: "WhatsApp से bookings पाएं",
        subtitle: "जब customers 'Book Now' click करेंगे, वो सीधे WhatsApp पर message करेंगे",
        phoneLabel: "आपका WhatsApp Number",
        phonePlaceholder: "98765 43210",
        messageLabel: "Pre-filled Message",
        messageHint: "Customers को chat open करते समय ये message दिखेगा",
        confirm: "WhatsApp Booking Enable करें",
        skip: "Skip करें (Contact Form use करें)",
        invalidPhone: "Valid 10-digit number डालें",
        preview: "Preview:"
    }
};

export default function WhatsAppSettings({
    language,
    businessName = 'Your Business',
    businessType = 'shop',
    initialPhone = '',
    initialMessage = '',
    onConfirm,
    onSkip
}: WhatsAppSettingsProps) {
    const [phone, setPhone] = useState(initialPhone);
    const [message, setMessage] = useState(initialMessage);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const t = content[language];

    // Generate default message based on business type
    useEffect(() => {
        if (!message) {
            const defaultMessage = generateBookingMessage(businessType, businessName);
            setMessage(defaultMessage);
        }
    }, [businessType, businessName, message]);

    const handlePhoneChange = (value: string) => {
        // Only allow digits and common separators
        const cleaned = value.replace(/[^\d\s\-+()]/g, '');
        setPhone(cleaned);
        setError('');
    };

    const handleConfirm = () => {
        const validation = validateIndianPhone(phone);
        if (!validation.valid) {
            setError(validation.error || t.invalidPhone);
            return;
        }
        onConfirm(phone, message);
    };

    return (
        <div className="whatsapp-settings">
            <div className="whatsapp-header">
                <div className="whatsapp-icon">
                    <MessageCircle size={24} />
                </div>
                <h3 className="whatsapp-title">{t.title}</h3>
                <p className="whatsapp-subtitle">{t.subtitle}</p>
            </div>

            <div className="whatsapp-form">
                {/* Phone Number Input */}
                <div className="form-group">
                    <label className="form-label">
                        <Phone size={16} />
                        {t.phoneLabel}
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className={`whatsapp-input ${error ? 'error' : ''}`}
                        maxLength={15}
                    />
                    {error && <p className="form-error-text">{error}</p>}
                </div>

                {/* Message Template */}
                <div className="form-group">
                    <label className="form-label">
                        <Edit3 size={16} />
                        {t.messageLabel}
                    </label>
                    {isEditing ? (
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="whatsapp-textarea"
                            rows={3}
                            onBlur={() => setIsEditing(false)}
                            autoFocus
                        />
                    ) : (
                        <div className="message-preview" onClick={() => setIsEditing(true)}>
                            <p className="preview-label">{t.preview}</p>
                            <p className="preview-text">"{message}"</p>
                            <span className="edit-hint">Click to edit</span>
                        </div>
                    )}
                    <p className="form-hint">{t.messageHint}</p>
                </div>
            </div>

            <div className="whatsapp-actions">
                <button
                    onClick={handleConfirm}
                    disabled={!phone.trim()}
                    className="whatsapp-btn primary"
                >
                    <Check size={18} />
                    {t.confirm}
                </button>
                <button
                    onClick={onSkip}
                    className="whatsapp-btn ghost"
                >
                    {t.skip}
                </button>
            </div>
        </div>
    );
}
