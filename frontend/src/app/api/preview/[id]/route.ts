import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // SECURITY: VULN-04 fix - Require authentication
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const response = await fetch(`${BACKEND_URL}/api/preview/${id}`, {
            headers: {
                'X-Authorization': `Bearer ${session.access_token}`,  // Forward auth token
            }
        });
        const data = await response.json();

        if (response.ok) {
            return NextResponse.json(data);
        } else {
            return NextResponse.json(
                { error: data.detail || 'Website not found' },
                { status: response.status }
            );
        }
    } catch (error) {
        console.error('Preview error:', error);
        return NextResponse.json(
            { error: 'Failed to load preview' },
            { status: 500 }
        );
    }
}
