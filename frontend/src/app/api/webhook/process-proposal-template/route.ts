import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes timeout

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Use environment variable for n8n base URL
        const n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5679';
        const webhookUrl = `${n8nBaseUrl}/webhook/process-proposal-template`;

        console.log('[Proxy] Calling n8n Template Processing:', webhookUrl);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        // Read response as text first to avoid JSON parsing errors
        const responseText = await response.text();
        console.log('[Proxy] n8n response text:', responseText);

        if (!response.ok) {
            console.error('[Proxy] n8n error:', responseText);
            return NextResponse.json(
                { error: responseText || 'Workflow failed' },
                { status: response.status }
            );
        }

        let data;
        try {
            data = responseText ? JSON.parse(responseText) : { success: true };
        } catch (e) {
            console.warn('[Proxy] Received non-JSON success response:', responseText);
            data = { success: true, message: responseText };
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Proxy] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
