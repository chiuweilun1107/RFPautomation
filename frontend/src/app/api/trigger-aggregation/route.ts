import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL || "http://localhost:5679/webhook/parse-tender";

        // Server-side fetch to n8n
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const errorText = await response.text();
        if (!response.ok) {
            throw new Error(`n8n responded with ${response.status} ${response.statusText}: ${errorText}`);
        }

        return NextResponse.json({ success: true, message: 'Aggregation triggered successfully' });
    } catch (error) {
        console.error('Error triggering n8n webhook:', error);
        return NextResponse.json(
            { success: false, message: `Failed to trigger aggregation: ${String(error)}` },
            { status: 500 }
        );
    }
}
