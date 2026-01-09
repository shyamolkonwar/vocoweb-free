/**
 * WhatsApp Deep Link Utilities
 * Builds wa.me URLs with pre-filled messages for instant customer messaging
 */

export interface WhatsAppConfig {
    phoneNumber: string;
    message?: string;
    countryCode?: string;
}

/**
 * Cleans and formats a phone number for WhatsApp
 * - Removes all non-numeric characters
 * - Auto-prepends country code if missing
 */
export function cleanPhoneNumber(phone: string, countryCode: string = '91'): string {
    // Remove all non-numeric characters
    const digits = phone.replace(/\D/g, '');

    // Remove leading zeros
    const trimmed = digits.replace(/^0+/, '');

    // If already has country code, return as is
    if (trimmed.length > 10 && trimmed.startsWith(countryCode)) {
        return trimmed;
    }

    // If 10 digits, prepend country code
    if (trimmed.length === 10) {
        return `${countryCode}${trimmed}`;
    }

    // Return as is if unusual length (let WhatsApp handle validation)
    return trimmed;
}

/**
 * Validates an Indian phone number
 */
export function validateIndianPhone(phone: string): { valid: boolean; error?: string } {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 0) {
        return { valid: false, error: 'Phone number is required' };
    }

    // Check for 10-digit Indian number (without country code)
    if (digits.length === 10) {
        // Indian mobile numbers start with 6, 7, 8, or 9
        if (!/^[6-9]/.test(digits)) {
            return { valid: false, error: 'Invalid Indian mobile number' };
        }
        return { valid: true };
    }

    // Check for number with country code (12 digits: 91 + 10 digits)
    if (digits.length === 12 && digits.startsWith('91')) {
        const localNumber = digits.slice(2);
        if (!/^[6-9]/.test(localNumber)) {
            return { valid: false, error: 'Invalid Indian mobile number' };
        }
        return { valid: true };
    }

    return { valid: false, error: 'Please enter a valid 10-digit mobile number' };
}

/**
 * Builds a WhatsApp deep link URL
 */
export function buildWhatsAppLink(config: WhatsAppConfig): string {
    const cleanNumber = cleanPhoneNumber(config.phoneNumber, config.countryCode || '91');
    const message = config.message || '';

    const baseUrl = `https://wa.me/${cleanNumber}`;

    if (message) {
        return `${baseUrl}?text=${encodeURIComponent(message)}`;
    }

    return baseUrl;
}

/**
 * Generates a context-aware booking message based on business type
 */
export function generateBookingMessage(businessType: string, businessName: string): string {
    const type = businessType.toLowerCase();

    // Business-specific templates
    const templates: Record<string, string> = {
        bakery: `Hi ${businessName}, I would like to place an order. Please share your menu and prices.`,
        restaurant: `Hi ${businessName}, I would like to make a reservation. When are you available?`,
        cafe: `Hi ${businessName}, I would like to visit your cafe. What are today's specials?`,
        dentist: `Hi Dr. ${businessName}, I would like to book an appointment for a dental checkup. When are you available?`,
        dental: `Hi Dr. ${businessName}, I would like to book an appointment for a dental checkup. When are you available?`,
        clinic: `Hi ${businessName}, I would like to book an appointment. When are you available?`,
        doctor: `Hi Dr. ${businessName}, I would like to book a consultation. When are you available?`,
        salon: `Hi ${businessName}, I would like to book an appointment. What services are available?`,
        parlour: `Hi ${businessName}, I would like to book an appointment. What services are available?`,
        gym: `Hi ${businessName}, I'm interested in joining your gym. Can you share the membership details?`,
        tuition: `Hi ${businessName}, I'm interested in enrolling for classes. Can you share the details?`,
        coaching: `Hi ${businessName}, I'm interested in your coaching classes. When can we discuss?`,
        plumber: `Hi ${businessName}, I need urgent repair service at my location. Please call me back.`,
        electrician: `Hi ${businessName}, I need electrical work done. When are you available?`,
        repair: `Hi ${businessName}, I need repair service. Can you visit my location?`,
        shop: `Hi ${businessName}, I saw your website and I'm interested in your products. Can you help me?`,
        store: `Hi ${businessName}, I would like to inquire about your products. Please share details.`,
    };

    // Find matching template
    for (const [key, template] of Object.entries(templates)) {
        if (type.includes(key)) {
            return template;
        }
    }

    // Default generic message
    return `Hi ${businessName}, I found you online and would like to know more about your services. Please share the details.`;
}

/**
 * Formats a phone number for display (adds spaces for readability)
 */
export function formatPhoneDisplay(phone: string): string {
    const clean = cleanPhoneNumber(phone);

    if (clean.length === 12) {
        // Format: +91 98765 43210
        return `+${clean.slice(0, 2)} ${clean.slice(2, 7)} ${clean.slice(7)}`;
    }

    if (clean.length === 10) {
        // Format: 98765 43210
        return `${clean.slice(0, 5)} ${clean.slice(5)}`;
    }

    return phone;
}
