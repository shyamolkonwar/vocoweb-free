import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

import { CreditCard, WebsitesCountCard } from './components/StatsCards';
import { WebsiteList } from './components/WebsiteList';
import { CardSkeleton, WebsiteListSkeleton } from './components/Skeletons';

export const metadata = {
    title: 'Dashboard | Laxizen',
};

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Stats Cards - Responsive grid */}
            <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
            >
                <Suspense fallback={<CardSkeleton />}>
                    <WebsitesCountCard />
                </Suspense>

                <Suspense fallback={<CardSkeleton />}>
                    <CreditCard />
                </Suspense>
            </div>

            {/* Main Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link
                    href="/create"
                    style={{
                        backgroundColor: '#0d9488',
                        color: 'white',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'background 0.15s ease',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    Create New Website
                </Link>
            </div>

            {/* Websites List */}
            <div>
                <h2 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#1e293b',
                    marginBottom: '16px'
                }}>My Websites</h2>
                <Suspense fallback={<WebsiteListSkeleton />}>
                    <WebsiteList />
                </Suspense>
            </div>
        </div>
    );
}
