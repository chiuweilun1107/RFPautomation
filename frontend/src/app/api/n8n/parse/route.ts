import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId, filePath, fileType } = body;

        // Validate request
        if (!projectId || !filePath) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const n8nUrl = process.env.N8N_WEBHOOK_URL;

        // If no n8n URL is configured (Development mode without n8n), just mock success
        if (!n8nUrl) {
            console.warn("N8N_WEBHOOK_URL not set. Mocking successful trigger.");
            return NextResponse.json({ success: true, mocked: true });
        }

        // Call n8n Webhook
        // Note: In production, you might want to add a secret header for security
        const response = await fetch(n8nUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                projectId,
                filePath,
                fileType,
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            console.error("Failed to trigger n8n workflow", await response.text());
            return NextResponse.json(
                { error: "Failed to start parsing workflow" },
                { status: 502 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error in parse proxy:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
