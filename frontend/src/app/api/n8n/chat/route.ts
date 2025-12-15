
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/rag-new';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { query } = await req.json();
        const apiKeyPresent = !!GEMINI_API_KEY;
        console.log(`[n8n Chat] Sending query: "${query.substring(0, 50)}...", hasKey: ${apiKeyPresent}`);

        // 1. Proxy request to n8n Webhook (rag-new)
        // We pass the API Key from Next.js env to n8n so it runs with the Paid Key
        const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/rag-new';

        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                apiKey: GEMINI_API_KEY
            }),
        });

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            console.error('n8n Webhook Error:', n8nResponse.status, errorText);
            throw new Error(`n8n workflow failed: ${n8nResponse.status} ${errorText}`);
        }

        const data = await n8nResponse.json();

        // Handle n8n response structure
        // WF08 returns: { answer: "..." }
        const answer = data.answer || data[0]?.answer || "I received a response but couldn't parse the answer.";

        return NextResponse.json({ answer });

        /*
        // n8n Webhook Proxy (DISABLED due to persistent 404 error)
        // Even with v4 path and active workflow, n8n returns 404.
        const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/rag-chat-webhook-v4';
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                apiKey: GEMINI_API_KEY
            }),
        });

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            throw new Error(`n8n workflow failed: ${n8nResponse.status} ${errorText}`);
        }

        const data = await n8nResponse.json();
        const answer = data.answer || data[0]?.answer || "I received a response but couldn't parse the answer.";
        return NextResponse.json({ answer });
        */

        /*
        // SERVERLESS RAG IMPLEMENTATION (Active - Recommended)
        // Direct connection to Google Gemini + Supabase using Paid API Key

        // 1. Generate Embedding for Query
        const embedRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: { parts: [{ text: query }] }
                })
            }
        );

        if (!embedRes.ok) {
            const errorText = await embedRes.text();
            console.error("Gemini Embedding Error:", errorText);
            throw new Error(`Gemini Embedding Failed: ${embedRes.statusText}`);
        }

        const embedData = await embedRes.json();
        const queryEmbedding = embedData.embedding.values;

        // 2. Vector Search via Supabase RPC
        const { data: documents, error: searchError } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 5
        });

        if (searchError) throw new Error(`Vector search failed: ${searchError.message}`);

        const contextText = documents?.map((doc: any) => doc.content).join('\n---\n') || "No relevant context found.";

        // 3. Generate Answer via Gemini
        const generateRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are a helpful AI assistant. Answer the user's question based ONLY on the following context. If the answer is not in the context, say you don't know.\n\nContext:\n${contextText}\n\nQuestion: ${query}`
                        }]
                    }]
                })
            }
        );

        if (!generateRes.ok) {
            const errorText = await generateRes.text();
            console.error("Gemini Generation Error:", errorText);
            throw new Error(`Gemini Generation Failed: ${generateRes.statusText}`);
        }

        const generateData = await generateRes.json();
        const answer = generateData.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate an answer.";

        return NextResponse.json({ answer });
        */

    } catch (error: any) {
        console.error("Chat Proxy Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
