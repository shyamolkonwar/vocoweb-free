'use client';

/**
 * Market Context Provider
 * 
 * Provides market-aware configuration throughout the app using React Context.
 * This eliminates prop drilling and allows any component to access market config.
 * 
 * Usage:
 * ```tsx
 * const { features, pricing, currencySymbol } = useMarket();
 * 
 * if (features.whatsappBooking) {
 *   return <WhatsAppInput />;
 * }
 * ```
 * 
 * @see /docs/enIn.txt for engineering specification
 */

import { createContext, useContext, ReactNode } from 'react';
import { MARKETS, MarketConfig, MarketKey } from '@/config/markets';

// Create context with GLOBAL as default fallback
const MarketContext = createContext<MarketConfig>(MARKETS.GLOBAL);

interface MarketProviderProps {
    market: MarketKey;
    children: ReactNode;
}

/**
 * MarketProvider
 * 
 * Wraps the app to provide market configuration based on the detected market.
 * Should be placed in the root layout.
 * 
 * @param market - 'IN' or 'GLOBAL'
 */
export function MarketProvider({ market, children }: MarketProviderProps) {
    const config = MARKETS[market] || MARKETS.GLOBAL;

    return (
        <MarketContext.Provider value={config}>
            {children}
        </MarketContext.Provider>
    );
}

/**
 * useMarket Hook
 * 
 * Access the full market configuration from any component.
 * 
 * @returns MarketConfig object with features, pricing, currency, etc.
 * 
 * @example
 * ```tsx
 * function PricingCard() {
 *   const { pricing, features } = useMarket();
 *   
 *   if (features.lifetimeDeal) {
 *     return <LifetimeDealCard price={pricing.displayPrice} />;
 *   }
 *   return <SubscriptionCard price={pricing.displayPrice} />;
 * }
 * ```
 */
export function useMarket(): MarketConfig {
    const context = useContext(MarketContext);

    if (!context) {
        console.warn('useMarket called outside of MarketProvider, using GLOBAL defaults');
        return MARKETS.GLOBAL;
    }

    return context;
}

/**
 * useFeatures Hook
 * 
 * Shorthand to access just the feature flags.
 */
export function useFeatures() {
    const { features } = useMarket();
    return features;
}

/**
 * usePricing Hook
 * 
 * Shorthand to access just the pricing config.
 */
export function usePricing() {
    const { pricing, currencySymbol } = useMarket();
    return { ...pricing, currencySymbol };
}

/**
 * useIsIndia Hook
 * 
 * Quick check if current market is India.
 */
export function useIsIndia(): boolean {
    const { key } = useMarket();
    return key === 'IN';
}

/**
 * useIsGlobal Hook
 * 
 * Quick check if current market is Global.
 */
export function useIsGlobal(): boolean {
    const { key } = useMarket();
    return key === 'GLOBAL';
}

// Re-export types for convenience
export type { MarketConfig, MarketKey };
