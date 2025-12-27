import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
    try {
        // Get auth token from Supabase session
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Fetch websites from backend
        const websitesResponse = await fetch(`${BACKEND_URL}/api/websites`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        // Fetch credits from backend
        const creditsResponse = await fetch(`${BACKEND_URL}/api/credits`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        let websites = [];
        let credits = { balance: 0, lifetime_earned: 0, lifetime_spent: 0 };

        if (websitesResponse.ok) {
            const websitesData = await websitesResponse.json();
            websites = websitesData.websites || [];
        }

        if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            // Backend returns { balance, lifetime_earned, lifetime_spent } directly
            credits = creditsData;
        }

        return NextResponse.json({
            websites,
            credits
        });

    } catch (error) {
        console.error('Dashboard data error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data', websites: [], credits: { balance: 0 } },
            { status: 500 }
        );
    }
}
