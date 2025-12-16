import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Search API - 使用 n8n WF09 + Gemini Google Search Grounding
 *
 * Fast Research: 快速搜索 5-8 個來源
 * Deep Research: 深度搜索 10-15 個來源 + AI 摘要分析
 */

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';

export async function POST(request: NextRequest) {
    try {
        const { query, mode, source, project_id } = await request.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Google Drive 功能尚未實作
        if (source === 'drive') {
            return NextResponse.json({
                error: 'Google Drive 功能即將推出',
                results: []
            }, { status: 200 });
        }

        console.log('[AI Search] Calling WF09:', { query, mode, project_id });

        // 調用 n8n WF09-AI-Search webhook
        const webhookUrl = `${N8N_BASE_URL}/webhook/ai-search`;

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: query.trim(),
                mode: mode || 'fast', // fast or deep
                project_id
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI Search] n8n error:', errorText);
            throw new Error(`n8n error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        console.log('[AI Search] Results:', {
            totalResults: data.totalResults,
            mode: data.researchMode
        });

        return NextResponse.json({
            success: true,
            query: data.query,
            mode: data.mode,
            results: data.results || [],
            summary: data.summary,
            searchQueries: data.searchQueries,
            totalResults: data.totalResults,
            researchMode: data.researchMode,
            message: data.results?.length > 0
                ? `找到 ${data.results.length} 個相關來源`
                : '沒有找到相關來源'
        });

    } catch (error) {
        console.error('AI search error:', error);
        return NextResponse.json(
            { error: 'AI search failed', details: String(error) },
            { status: 500 }
        );
    }
}

