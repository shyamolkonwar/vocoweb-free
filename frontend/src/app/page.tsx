'use client';

/**
 * Root Page (/)
 * 
 * This page should never actually render in production.
 * The middleware automatically redirects to /in or /en based on user location.
 * 
 * This is just a fallback loading state.
 */

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
