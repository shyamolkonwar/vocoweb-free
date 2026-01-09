import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { filename, content_type, website_id, access_token } = body;

        if (!filename || !content_type || !website_id) {
            return NextResponse.json(
                { error: 'filename, content_type, and website_id are required' },
                { status: 400 }
            );
        }

        // Get auth token from request body (passed from client-side AuthContext)
        if (!access_token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Forward to backend
        const response = await fetch(`${BACKEND_URL}/api/upload/presign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            body: JSON.stringify({ filename, content_type, website_id })
        });

        const data = await response.json();

        if (response.ok) {
            return NextResponse.json(data, { status: 200 });
        } else {
            return NextResponse.json(
                { error: data.detail || 'Failed to get presigned URL' },
                { status: response.status }
            );
        }
    } catch (error) {
        console.error('Presign error:', error);
        return NextResponse.json(
            { error: 'Failed to generate upload URL' },
            { status: 500 }
        );
    }
}
