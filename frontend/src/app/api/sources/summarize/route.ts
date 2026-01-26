import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAIEWQafKblPqGJNMiRsb2T5L7LbxOUgeU';

export async function POST(request: Request) {
    try {
        const { source_id } = await request.json();

        if (!source_id) {
            return NextResponse.json({ error: 'Missing source_id' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. 獲取來源內容
        const { data: source, error: fetchError } = await supabase
            .from('sources')
            .select('id, title, content')
            .eq('id', source_id)
            .single();

        if (fetchError || !source) {
            return NextResponse.json({ error: 'Source not found' }, { status: 404 });
        }

        if (!source.content) {
            return NextResponse.json({ error: 'Source has no content' }, { status: 400 });
        }

        // 2. 呼叫 Gemini API 生成摘要和話題
        const contentPreview = source.content.slice(0, 8000); // 限制長度
        
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `分析以下文件並生成：
1. 一段簡潔的摘要（100-200字），說明文件的主要內容和重點
2. 3-5個關鍵話題標籤

文件標題：${source.title}

文件內容：
${contentPreview}

請以 JSON 格式回覆：
{
  "summary": "文件摘要...",
  "topics": ["話題1", "話題2", "話題3"]
}

只回覆 JSON，不要其他文字。`
                        }]
                    }]
                })
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', errorText);
            return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // 3. 解析 JSON 回應
        let summary = '';
        let topics: string[] = [];

        try {
            // 移除可能的 markdown 標記
            const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(jsonStr);
            summary = parsed.summary || '';
            topics = Array.isArray(parsed.topics) ? parsed.topics : [];
        } catch (parseError) {
            console.error('Failed to parse AI response:', responseText);
            // 如果解析失敗，直接使用整個回應作為摘要
            summary = responseText.slice(0, 500);
        }

        // 4. 更新資料庫
        const { error: updateError } = await supabase
            .from('sources')
            .update({ summary, topics })
            .eq('id', source_id);

        if (updateError) {
            console.error('Failed to update source:', updateError);
            return NextResponse.json({ error: 'Failed to save summary' }, { status: 500 });
        }

        return NextResponse.json({ success: true, summary, topics });

    } catch (error) {
        console.error('Summarize API error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 });
    }
}

