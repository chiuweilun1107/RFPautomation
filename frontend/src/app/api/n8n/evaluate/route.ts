import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { projectId } = await request.json();

        if (!projectId) {
            return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
        }

        const supabase = await createClient();

        console.log(`[Evaluate API] Fetching sources for project: ${projectId}`);
        // 1. Fetch all source IDs for this project
        const { data: sources, error: sourcesError } = await supabase
            .from('sources')
            .select('id')
            .eq('project_id', projectId);

        if (sourcesError) {
            console.error("[Evaluate API] Supabase error:", sourcesError);
            return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
        }

        if (!sources || sources.length === 0) {
            return NextResponse.json({ error: "No sources found for this project" }, { status: 404 });
        }

        const sourceIds = sources.map(s => s.id);
        console.log(`[Evaluate API] Found ${sourceIds.length} sources:`, sourceIds);

        const targetUrl = process.env.N8N_EVALUATE_WEBHOOK || `${process.env.N8N_BASE_URL || 'http://localhost:5679'}/webhook/evaluate-project`;

        console.log(`[Evaluate API] Requesting n8n at: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                project_id: projectId,
                source_ids: sourceIds,
                timestamp: new Date().toISOString()
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Evaluate API] n8n error:", errorText);
            return NextResponse.json({ error: "Failed to trigger n8n evaluation workflow" }, { status: 502 });
        }

        return NextResponse.json({ success: true, message: "Analysis started" });

    } catch (error: any) {
        console.error("[Evaluate API] Unexpected error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
