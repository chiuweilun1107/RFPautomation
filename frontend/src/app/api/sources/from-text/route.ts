import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { title, content, project_id } = await request.json();

        if (!content || content.trim().length < 10) {
            return NextResponse.json({ error: '內容太短，請至少輸入 10 個字' }, { status: 400 });
        }

        const supabase = await createClient();

        // 創建 Source 記錄（直接存入 content，WF07 會處理 embedding）
        const { data: source, error: insertError } = await supabase
            .from('sources')
            .insert({
                title: title || `文字筆記 ${new Date().toISOString().split('T')[0]}`,
                type: 'markdown',
                content: content.trim(),
                status: 'processing',
                project_id: project_id || null,
                source_type: 'text'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // WF07 會定時輪詢 processing 狀態的 sources 並進行 embedding

        return NextResponse.json({ 
            success: true, 
            source,
            message: '文字已添加，正在處理中...'
        });

    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}

