import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, origin_url, type, project_id, status, source_type } = body;

        const supabase = await createClient();

        // 1. Insert into Sources Table
        const { data, error } = await supabase
            .from('sources')
            .insert({
                title,
                origin_url,
                type,
                project_id: project_id || null, // Ensure explicit null if undefined
                status: status || 'processing',
                source_type: source_type || 'upload' // 'upload' | 'url' | 'search' | 'rfp'
            })
            .select()
            .single();

        if (error) {
            console.error("DB Insert Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 2. Trigger n8n Ingestion (Server-to-Server)
        // We can reuse the logic or call the n8n endpoint directly here
        const n8nUrl = process.env.N8N_INGEST_WEBHOOK || 'http://localhost:5678/webhook/ingest';

        fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: origin_url, // n8n expects path in 'title' field based on WF01 logic
                type: type,
                projectId: project_id,
                source_id: data.id // CHANGED: Pass ID for update
            })
        }).catch(err => console.error("Failed to trigger n8n from API:", err));

        return NextResponse.json({ success: true, source: data });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
