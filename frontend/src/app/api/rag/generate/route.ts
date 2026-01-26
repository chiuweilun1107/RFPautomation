import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    try {
        const { project_id, section_id, section_title } = await request.json();

        if (!project_id || !section_id || !section_title) {
            return NextResponse.json(
                { error: 'Missing required fields: project_id, section_id, section_title' },
                { status: 400 }
            );
        }

        // 呼叫 n8n WF08 RAG Query webhook
        // N8N_WEBHOOK_URL 可能包含特定路徑，所以直接使用 base URL
        const n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
        const webhookUrl = `${n8nBaseUrl}/webhook/rag-query`;

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id,
                section_id,
                query: `請為「${section_title}」章節撰寫專業的標案內容草稿。`,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[RAG Generate] n8n error:', errorText);
            throw new Error(`n8n error: ${response.status} - ${errorText}`);
        }

        // 處理可能的空回應
        const responseText = await response.text();

        interface RagResponse {
            answer?: string;
            response?: string;
            draft?: string;
            sources?: unknown[];
        }

        let data: RagResponse = {};
        if (responseText && responseText.trim()) {
            try {
                data = JSON.parse(responseText) as RagResponse;
            } catch (e) {
                data = { answer: responseText };
            }
        } else {
            return NextResponse.json({
                success: false,
                error: '請重新匯入 WF08 workflow 並設定為同步模式 (responseMode: responseNode)'
            }, { status: 400 });
        }

        // 將生成的草稿和引用來源存入 sections 表
        const draft = data.answer || data.response || data.draft || '';
        const sources = data.sources || [];

        if (draft) {
            const { error: updateError } = await supabase
                .from('sections')
                .update({
                    content_draft: draft,
                    draft_sources: sources
                })
                .eq('id', section_id);

            if (updateError) {
                console.error('[RAG Generate] Failed to save draft:', updateError);
            }
        }

        return NextResponse.json({
            success: true,
            draft,
            sources
        });

    } catch (error) {
        console.error('[RAG Generate] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to generate draft';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

