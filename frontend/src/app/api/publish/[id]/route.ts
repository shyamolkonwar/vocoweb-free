import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const response = await fetch(`${BACKEND_URL}/api/publish/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (response.ok) {
            return NextResponse.json(data, { status: 200 });
        } else {
            return NextResponse.json(data, { status: response.status });
        }
    } catch (error) {
        console.error('Publish error:', error);
        return NextResponse.json(
            { error: 'Failed to publish website' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const url = new URL(request.url);
        const isStatus = url.pathname.endsWith('/status');

        const endpoint = isStatus
            ? `${BACKEND_URL}/api/publish/${id}/status`
            : `${BACKEND_URL}/api/publish/${id}/status`;

        const response = await fetch(endpoint);
        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Publish status error:', error);
        return NextResponse.json(
            { error: 'Failed to get publish status' },
            { status: 500 }
        );
    }
}
