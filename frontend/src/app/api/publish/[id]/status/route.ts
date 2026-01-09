import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // SECURITY: Require authentication for publish status
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            // Return unpublished status for unauthenticated users
            return NextResponse.json({ published: false }, { status: 200 });
        }

        const response = await fetch(`${BACKEND_URL}/api/publish/${id}/status`, {
            headers: {
                'X-Authorization': `Bearer ${session.access_token}`,
            }
        });
        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Publish status error:', error);
        return NextResponse.json(
            { published: false },
            { status: 200 }
        );
    }
}
