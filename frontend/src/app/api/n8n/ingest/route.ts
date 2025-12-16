import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Default to localhost n8n if env var not set
        const n8nUrl = process.env.N8N_INGEST_WEBHOOK || 'http://localhost:5678/webhook/ingest';

        console.log(`[Proxy] Forwarding ingestion request to: ${n8nUrl}`);

        const response = await fetch(n8nUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error("[Proxy] n8n returned error:", await response.text());
            return NextResponse.json(
                { error: "Failed to trigger n8n workflow" },
                { status: 502 }
            );
        }

        const data = await response.json().catch(() => ({ success: true }));
        return NextResponse.json(data);

    } catch (error) {
        console.error("[Proxy] Error in ingestion proxy:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
