import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300; // 5 minutes timeout

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('[Proxy] Calling n8n Sub-section Generation (WF10):', body);

        // Fetch sourceIds if missing
        // Fetch sourceIds if missing
        if (!body.sourceIds || body.sourceIds.length === 0) {
            // Debug logs
            console.log('[Proxy] DEBUG - Supabase Config - URL Defined:', !!supabaseUrl, 'Key Defined:', !!supabaseServiceKey);

            if (!supabaseUrl || !supabaseServiceKey) {
                console.error('[Proxy] CRITICAL: Supabase environment variables missing');
                throw new Error('Missing Supabase configuration');
            }

            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const { data: projectSources, error } = await supabase
                .from('project_sources')
                .select('source_id')
                .eq('project_id', body.projectId);

            if (error) {
                console.error('[Proxy] Supabase Query Error:', error);
            }

            if (projectSources && projectSources.length > 0) {
                body.sourceIds = projectSources.map(ps => ps.source_id);
                console.log('[Proxy] Auto-filled sourceIds from project_sources:', body.sourceIds);
            }
        }

        // Use environment variable for n8n base URL
        const n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5679';
        const webhookUrl = `${n8nBaseUrl}/webhook/generate-requirements`;

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

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
