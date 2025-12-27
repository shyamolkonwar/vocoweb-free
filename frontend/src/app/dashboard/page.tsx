
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

import DashboardClientWrapper from './components/DashboardClientWrapper';
import DashboardHeader from './components/DashboardHeader';
import { CreditCard, WebsitesCountCard } from './components/StatsCards';
import { WebsiteList } from './components/WebsiteList';
import { CardSkeleton, WebsiteListSkeleton } from './components/Skeletons';

export const metadata = {
    title: 'Dashboard | Laxizen',
};

export default async function DashboardPage() {
    // Server-side auth check
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    return (
        <DashboardClientWrapper>
            <div className="dashboard-container">
                <DashboardHeader />

                {/* Stats Cards - Parallel Fetching */}
                <div className="dashboard-cards">
                    <Suspense fallback={<CardSkeleton />}>
                        <WebsitesCountCard />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton />}>
                        <CreditCard />
                    </Suspense>
                </div>

                {/* Main Action */}
                <div className="dashboard-cta">
                    <Link href="/create" className="btn-primary btn-large">
                        Create New Website
                    </Link>
                </div>

                {/* Websites List - Parallel Fetching */}
                <Suspense fallback={<WebsiteListSkeleton />}>
                    <WebsiteList />
                </Suspense>
            </div>
        </DashboardClientWrapper>
    );
}
