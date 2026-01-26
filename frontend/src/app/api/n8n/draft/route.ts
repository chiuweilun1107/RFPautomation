
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { taskId, requirement, context, projectId } = await request.json();

        // 1. Check if N8N URL is configured
        const n8nUrl = process.env.N8N_WEBHOOK_URL;
        if (!n8nUrl) {
            console.error("Missing N8N_WEBHOOK_URL");
            // Fallback for simulation if no N8N
            return NextResponse.json({
                draft: `[Simulated AI Draft]\n\nRegarding: ${requirement}\n\nOur solution proposes a comprehensive approach...`
            });
        }

        // 2. Call n8n Webhook
        // Use validated ID-based URL for robustness
        const targetUrl = 'http://localhost:5678/webhook/draft';

        console.log("Calling Drafting Webhook:", targetUrl);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, requirement, context, projectId })
        });

        if (!response.ok) {
            throw new Error(`n8n error: ${response.statusText}`);
        }

        const data = await response.json();
        // Expecting { "draft": "..." }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Draft API Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate draft" },
            { status: 500 }
        );
    }
}
