'use client';

/**
 * ThemeSelector Component
 * 
 * Allows users to switch between 5 strategic color palettes.
 * Used in /create (India) and Editor (Global).
 */

import { Check } from 'lucide-react';

export type ThemeId = 'trust' | 'warmth' | 'growth' | 'modern' | 'luxury';

interface Theme {
    id: ThemeId;
    name: { en: string; hi: string };
    primary: string;
    accent: string;
}

const THEMES: Theme[] = [
    {
        id: 'trust',
        name: { en: 'Trust', hi: 'Trust' },
        primary: '#0F766E', // Deep Teal
        accent: '#CCFBF1'   // Light Mint
    },
    {
        id: 'warmth',
        name: { en: 'Warmth', hi: 'Warmth' },
        primary: '#C2410C', // Burnt Orange
        accent: '#FFF7ED'   // Soft Cream
    },
    {
        id: 'growth',
        name: { en: 'Growth', hi: 'Growth' },
        primary: '#15803D', // Forest Green
        accent: '#ECFCCB'   // Pale Lime
    },
    {
        id: 'modern',
        name: { en: 'Modern', hi: 'Modern' },
        primary: '#4F46E5', // Electric Indigo
        accent: '#F3F4F6'   // Cool Grey
    },
    {
        id: 'luxury',
        name: { en: 'Luxury', hi: 'Luxury' },
        primary: '#18181B', // Charcoal Black
        accent: '#D4AF37'   // Gold
    }
];

interface ThemeSelectorProps {
    selectedTheme: ThemeId;
    onSelect: (themeId: ThemeId) => void;
    language?: 'en' | 'hi';
}

export default function ThemeSelector({
    selectedTheme,
    onSelect,
    language = 'en'
}: ThemeSelectorProps) {

    return (
        <div className="flex items-center gap-3">
            {THEMES.map((theme) => {
                const isSelected = selectedTheme === theme.id;

                return (
                    <button
                        key={theme.id}
                        onClick={() => onSelect(theme.id)}
                        className={`
                            relative w-10 h-10 rounded-full flex items-center justify-center
                            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                            ${isSelected ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}
                        `}
                        style={{
                            backgroundColor: theme.primary,
                            borderColor: theme.accent,
                            // Use CSS variable if needed for focus ring color, but simple ring-gray-400 is safer fallback
                            // or match ring color to primary
                            boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${theme.primary}` : 'none'
                        }}
                        title={theme.name[language]}
                        aria-label={`Select ${theme.name[language]} theme`}
                    >
                        {/* Inner accent dot/border simulation */}
                        <div
                            className="absolute inset-0 rounded-full border-2"
                            style={{ borderColor: theme.accent }}
                        />

                        {isSelected && (
                            <Check
                                size={16}
                                className="text-white relative z-10"
                                strokeWidth={3}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
