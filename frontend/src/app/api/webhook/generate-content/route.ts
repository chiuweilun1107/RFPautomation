import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/errorUtils';

export const maxDuration = 300; // 5 minutes timeout

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Use environment variable for n8n base URL (Standardized)
        const n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5679';
        // Allow specific override, but default to standard naming
        const n8nUrl = process.env.N8N_DOCUMENT_GENERATE_WEBHOOK || `${n8nBaseUrl}/webhook/generate-content`;

        if (!n8nUrl) {
            return NextResponse.json(
                { error: 'Webhook URL configuration failed' },
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
