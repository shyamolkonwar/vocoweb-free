/**
 * Market Configuration - Source of Truth
 * 
 * This is the "Control Center" for all India vs Global feature differentiation.
 * Do NOT scatter if (lang === 'in') checks throughout code - use this config instead.
 * 
 * @see /docs/enIn.txt for engineering specification
 */

export type MarketKey = 'IN' | 'GLOBAL';

export type MarketConfig = {
    // Market Identification
    key: MarketKey;
    locale: 'in' | 'en';

    // Currency
    currency: 'INR' | 'USD';
    currencySymbol: string;

    // Feature Flags
    features: {
        whatsappBooking: boolean;    // If true, show WhatsApp input on create page
        brandVoiceEngine: boolean;   // If true, show Voice Analysis step
        lifetimeDeal: boolean;       // If true, show LTD pricing instead of subscription
        smsLogin: boolean;           // If true, allow phone login (OTP)
        advancedSEO: boolean;        // If true, show advanced SEO controls
        analytics: boolean;          // If true, show analytics dashboard
    };

    // Default Behaviors
    defaults: {
        contactMethod: 'whatsapp' | 'email';
        themePreset: 'high-contrast' | 'modern-glass';
        templateFilter: string[];
    };

    // UI/UX
    ui: {
        vibe: 'trust' | 'premium';
        showTrustBadges: boolean;
        showMadeInIndia: boolean;
    };

    // Pricing
    pricing: {
        model: 'lifetime' | 'subscription';
        amount: number;
        displayPrice: string;
        originalPrice?: string;
        discount?: string;
    };
};

/**
 * Market configurations for India and Global markets
 */
export const MARKETS: Record<MarketKey, MarketConfig> = {
    IN: {
        key: 'IN',
        locale: 'in',

        currency: 'INR',
        currencySymbol: '₹',

        features: {
            whatsappBooking: true,      // PRIMARY conversion method
            brandVoiceEngine: false,    // Keep flow simple for India
            lifetimeDeal: true,         // Offer LTD
            smsLogin: true,             // Allow OTP login 
            advancedSEO: false,         // Basic SEO only
            analytics: false,           // Simple stats only
        },

        defaults: {
            contactMethod: 'whatsapp',
            themePreset: 'high-contrast',
            templateFilter: ['clean', 'high-contrast', 'simple'],
        },

        ui: {
            vibe: 'trust',
            showTrustBadges: true,
            showMadeInIndia: true,
        },

        pricing: {
            model: 'lifetime',
            amount: 5999,
            displayPrice: '₹5,999',
            originalPrice: '₹15,000',
            discount: '60% OFF',
        },
    },

    GLOBAL: {
        key: 'GLOBAL',
        locale: 'en',

        currency: 'USD',
        currencySymbol: '$',

        features: {
            whatsappBooking: false,     // Use email/form instead
            brandVoiceEngine: true,     // KEY differentiator for Global
            lifetimeDeal: false,        // SaaS subscription
            smsLogin: false,            // Email login only
            advancedSEO: true,          // Full SEO suite
            analytics: true,            // Advanced analytics
        },

        defaults: {
            contactMethod: 'email',
            themePreset: 'modern-glass',
            templateFilter: ['modern', 'glassmorphism', 'premium'],
        },

        ui: {
            vibe: 'premium',
            showTrustBadges: true,
            showMadeInIndia: false,
        },

        pricing: {
            model: 'subscription',
            amount: 39,
            displayPrice: '$39/month',
        },
    },
};

/**
 * Helper: Get market config by locale
 */
export function getMarketConfig(locale: 'in' | 'en'): MarketConfig {
    return locale === 'in' ? MARKETS.IN : MARKETS.GLOBAL;
}

/**
 * Helper: Get market key by locale
 */
export function getMarketKey(locale: 'in' | 'en'): MarketKey {
    return locale === 'in' ? 'IN' : 'GLOBAL';
}

/**
 * Helper: Get market from URL path
 */
export function getMarketFromPath(pathname: string): MarketKey {
    return pathname.startsWith('/in') ? 'IN' : 'GLOBAL';
}
