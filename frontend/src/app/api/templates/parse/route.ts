import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { template_id, file_path } = body

        // Validate request
        if (!template_id || !file_path) {
            return NextResponse.json(
                { error: "Missing required fields: template_id, file_path" },
                { status: 400 }
            )
        }

        // Get n8n webhook URL from environment
        const n8nUrl = process.env.N8N_TEMPLATE_PARSE_WEBHOOK || 'http://localhost:5679/webhook/parse-template-v2'

        // Call n8n webhook to parse template
        const response = await fetch(n8nUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                template_id,
                file_path,
                bucket: 'raw-files',
                timestamp: new Date().toISOString(),
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("[Template Parse] n8n workflow failed:", errorText)
            return NextResponse.json(
                { error: "Failed to start template parsing workflow" },
                { status: 502 }
            )
        }

        const result = await response.json().catch(() => ({ success: true }))

        return NextResponse.json({
            success: true,
            message: "Template parsing started",
            ...result
        })

    } catch (error) {
        console.error("[Template Parse] Error:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
