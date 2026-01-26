import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/rag-new';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { query } = await req.json();
        console.log(`[n8n Chat] Sending query: "${query.substring(0, 50)}..."`);

        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            console.error('n8n Webhook Error:', n8nResponse.status, errorText);
            throw new Error(`n8n workflow failed: ${n8nResponse.status} ${errorText}`);
        }

        const data = await n8nResponse.json();
        const answer = data.answer || data[0]?.answer || "I received a response but couldn't parse the answer.";

        return NextResponse.json({ answer });

    } catch (error) {
        console.error("Chat Proxy Error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
