'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface Translations {
    // Sidebar
    myWebsites: string;
    leadsCustomers: string;
    popupManager: string;
    billingCredits: string;
    freePlan: string;

    // Header
    dashboard: string;
    welcome: string;
    logout: string;

    // Dashboard page
    availableCredits: string;
    buyMoreCredits: string;
    createNewWebsite: string;

    // Leads page
    leadsTitle: string;
    leadsDescription: string;
    noLeadsYet: string;

    // Popup page
    popupTitle: string;
    popupDescription: string;
    noWebsitesYet: string;

    // Common
    loading: string;
    save: string;
    cancel: string;
    edit: string;
    preview: string;
    published: string;
    draft: string;
}

const translations: Record<Language, Translations> = {
    en: {
        myWebsites: 'My Websites',
        leadsCustomers: 'Leads & Customers',
        popupManager: 'Popup Manager',
        billingCredits: 'Billing & Credits',
        freePlan: 'Free Plan',
        dashboard: 'Dashboard',
        welcome: 'Welcome',
        logout: 'Logout',
        availableCredits: 'Available Credits',
        buyMoreCredits: 'Buy more credits',
        createNewWebsite: 'Create New Website',
        leadsTitle: 'Leads & Customers',
        leadsDescription: 'Manage leads captured from your websites',
        noLeadsYet: 'No Leads Yet',
        popupTitle: 'Popup Manager',
        popupDescription: 'Configure lead capture popups for your websites',
        noWebsitesYet: 'No Websites Yet',
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        preview: 'Preview',
        published: 'Published',
        draft: 'Draft',
    },
    hi: {
        myWebsites: 'मेरी वेबसाइटें',
        leadsCustomers: 'लीड्स और ग्राहक',
        popupManager: 'पॉपअप मैनेजर',
        billingCredits: 'बिलिंग और क्रेडिट',
        freePlan: 'मुफ्त प्लान',
        dashboard: 'डैशबोर्ड',
        welcome: 'स्वागत है',
        logout: 'लॉगआउट',
        availableCredits: 'उपलब्ध क्रेडिट',
        buyMoreCredits: 'और क्रेडिट खरीदें',
        createNewWebsite: 'नई वेबसाइट बनाएं',
        leadsTitle: 'लीड्स और ग्राहक',
        leadsDescription: 'अपनी वेबसाइटों से कैप्चर की गई लीड्स प्रबंधित करें',
        noLeadsYet: 'अभी तक कोई लीड नहीं',
        popupTitle: 'पॉपअप मैनेजर',
        popupDescription: 'अपनी वेबसाइटों के लिए लीड कैप्चर पॉपअप कॉन्फ़िगर करें',
        noWebsitesYet: 'अभी तक कोई वेबसाइट नहीं',
        loading: 'लोड हो रहा है...',
        save: 'सेव करें',
        cancel: 'रद्द करें',
        edit: 'संपादित करें',
        preview: 'प्रीव्यू',
        published: 'प्रकाशित',
        draft: 'ड्राफ्ट',
    },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    const value = {
        language,
        setLanguage,
        t: translations[language],
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
