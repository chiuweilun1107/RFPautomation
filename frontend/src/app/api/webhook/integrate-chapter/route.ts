import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/errorUtils';

export const maxDuration = 300; // 5 minutes timeout

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Use environment variable for n8n webhook URL
        const n8nUrl = process.env.N8N_INTEGRATE_CHAPTER_WEBHOOK || 'http://localhost:5679/webhook/integrate-chapter';

        if (!n8nUrl) {
            return NextResponse.json(
                { error: 'N8N_INTEGRATE_CHAPTER_WEBHOOK environment variable not configured' },
                { status: 500 }
            );
        }

        const response = await fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Proxy] n8n error:', errorText);
            return NextResponse.json(
                { error: errorText || 'Workflow failed' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[Proxy] Error:', error);
        return NextResponse.json(
            { error: getErrorMessage(error) || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
