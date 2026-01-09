import { NextRequest, NextResponse } from 'next/server';

/**
 * Geographic Routing Middleware (Option 3: Landing Pages Only)
 * 
 * ONLY redirects the root path (/) to market-specific landing pages.
 * All other routes (/create, /dashboard, etc.) are UNTOUCHED.
 * 
 * Routes:
 * - India users: / → /in
 * - Global users: / → /en
 * - Everything else: Works as before
 */

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // CRITICAL: Only intercept root path
    // This ensures /create, /dashboard, etc. are NOT affected
    if (pathname !== '/') {
        return NextResponse.next();
    }

    // Skip for static files and API routes (safety check)
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // 1. Check for user preference cookie
    const userLocale = request.cookies.get('NEXT_LOCALE')?.value as 'in' | 'en' | undefined;

    if (userLocale && (userLocale === 'in' || userLocale === 'en')) {
        // User has a preference, redirect to their choice
        const url = new URL(`/${userLocale}`, request.url);
        return NextResponse.redirect(url);
    }

    // 2. Geo-IP detection
    let detectedCountry: string | null = null;

    // Try Vercel header first
    detectedCountry = request.headers.get('x-vercel-ip-country');

    // Fallback to Cloudflare header
    if (!detectedCountry) {
        detectedCountry = request.headers.get('cf-ipcountry');
    }

    // Fallback to development default
    if (!detectedCountry && process.env.NODE_ENV === 'development') {
        detectedCountry = process.env.DEFAULT_DEV_LOCALE?.toUpperCase() || 'IN';
    }

    // Default to US if no detection method works
    if (!detectedCountry) {
        detectedCountry = 'US';
    }

    // 3. Determine target locale
    const targetLocale = detectedCountry === 'IN' ? 'in' : 'en';

    // 4. Redirect to locale-specific landing page
    const url = new URL(`/${targetLocale}`, request.url);
    const response = NextResponse.redirect(url);

    // Set a cookie to remember the detected locale (expires in 1 year)
    response.cookies.set('NEXT_LOCALE', targetLocale, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        sameSite: 'lax'
    });

    return response;
}

/**
 * Matcher configuration
 * 
 * ONLY matches root path (/)
 * This ensures core app (/create, /dashboard) is never touched
 */
export const config = {
    matcher: ['/'],
};
