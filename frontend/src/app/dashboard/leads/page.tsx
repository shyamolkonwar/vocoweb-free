
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

import { LeadsTable, LeadsTableSkeleton, LeadStats } from './components';

export const metadata = {
    title: 'Leads & Customers | Laxizen Dashboard',
};

async function getLeads() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return { leads: [], stats: null };

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

    try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/leads`, {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            },
            next: { revalidate: 0 }
        });

        if (!res.ok) return { leads: [], stats: null };

        return await res.json();
    } catch (e) {
        console.error("Error fetching leads:", e);
        return { leads: [], stats: null };
    }
}

async function LeadsContent() {
    const { leads, stats } = await getLeads();

    return (
        <>
            {stats && <LeadStats stats={stats} />}
            <LeadsTable leads={leads} />
        </>
    );
}

export default async function LeadsPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="leads-page">
            <div className="leads-header mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Leads & Customers</h2>
                <p className="text-gray-600 mt-1">Manage leads captured from your websites</p>
            </div>

            <Suspense fallback={<LeadsTableSkeleton />}>
                <LeadsContent />
            </Suspense>
        </div>
    );
}
