import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 用戶 AI 偏好設置 API
 *
 * 保存用戶選擇的 AI 參考專案
 */

// GET - 獲取用戶當前選擇的專案和文件
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({
        selectedProjectId: null,
        selectedSourceIds: []
      });
    }

    const userId = session.user.id;

    // 從資料表讀取偏好設置
    const { data: preferences, error } = await supabase
      .from('ai_preferences')
      .select('project_id, source_ids')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[AI Preferences] GET Error:', error);
    }

    const selectedProjectId = preferences?.project_id || null;
    const selectedSourceIds = preferences?.source_ids || [];

    console.log('[AI Preferences] GET - User:', userId);
    console.log('[AI Preferences] - Project:', selectedProjectId || 'none');
    console.log('[AI Preferences] - Sources:', selectedSourceIds.length);

    return NextResponse.json({
      selectedProjectId,
      selectedSourceIds,
      userId // 返回 user_id 供前端使用
    });

  } catch (error) {
    console.error('[AI Preferences] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - 保存用戶選擇的專案和文件
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { projectId, sourceIds } = await request.json();

    console.log(`[AI Preferences] User ${userId} selected:`, {
      projectId,
      sourceIds: sourceIds?.length || 0
    });

    // 使用 upsert 保存到資料表（如果不存在則插入，存在則更新）
    const { error: upsertError } = await supabase
      .from('ai_preferences')
      .upsert({
        user_id: userId,
        project_id: projectId,
        source_ids: sourceIds || []
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('[AI Preferences] Failed to save to database:', upsertError);
      return NextResponse.json({
        error: 'Failed to save preferences',
        details: upsertError.message
      }, { status: 500 });
    }

    console.log('[AI Preferences] ✅ Saved to database');

    return NextResponse.json({
      success: true,
      selectedProjectId: projectId,
      selectedSourceIds: sourceIds || [],
      userId
    });

  } catch (error) {
    console.error('[AI Preferences] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
