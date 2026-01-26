import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes timeout

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // [MIGRATION] Reroute to WF01 (Ingestion)
        // Original Body: { projectId, filePath, fileName, mode }
        // WF01 Expects: { title (path), type, projectId, source_id? }

        const n8nUrl = process.env.N8N_INGEST_WEBHOOK || 'http://localhost:5678/webhook/ingest';

        console.log('[Proxy] Forwarding Template Parsing to WF01 (Ingestion):', n8nUrl);

        // Adapt payload for WF01
        const wf01Payload = {
            title: body.filePath,      // WF01 uses 'title' as the file path/url
            type: 'template',          // Mark as template so WF01 logic can distinguish if needed
            projectId: body.projectId,
            originalFileName: body.fileName,
            mode: body.mode            // Pass mode (replace/append) for downstream logic
        };

        const response = await fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wf01Payload),
        });

        // Read response as text first to avoid JSON parsing errors
        const responseText = await response.text();
        console.log('[Proxy] WF01 response text:', responseText);

        if (!response.ok) {
            console.error('[Proxy] WF01 error:', responseText);
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
    } catch (error) {
        console.error('[Proxy] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
