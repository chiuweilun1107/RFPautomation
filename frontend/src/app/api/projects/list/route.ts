import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 獲取用戶的專案列表
 *
 * 用於 AI 專案選擇器
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn('[Projects List] Unauthorized request');
      return NextResponse.json({ projects: [] });
    }

    console.log('[Projects List] Fetching projects for user:', session.user.id);

    // 獲取專案列表（使用 * 自動獲取所有欄位）
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[Projects List] Supabase error:', error);
      return NextResponse.json(
        { error: error.message, projects: [] },
        { status: 500 }
      );
    }

    console.log('[Projects List] Found projects:', data?.length || 0);

    // 如果有資料，打印第一筆的欄位名稱（用於調試）
    if (data && data.length > 0) {
      console.log('[Projects List] Available columns:', Object.keys(data[0]));
    }

    return NextResponse.json({ projects: data || [] });

  } catch (error) {
    console.error('[Projects List] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', projects: [] },
      { status: 500 }
    );
  }
}
