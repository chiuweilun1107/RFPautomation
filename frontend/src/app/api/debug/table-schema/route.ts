import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 診斷 API：查看資料表結構
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const tableName = url.searchParams.get('table') || 'projects';

    // 查詢一筆資料來看結構
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({
        error: error.message,
        table: tableName,
        hint: '請確認表名是否正確'
      });
    }

    // 返回欄位名稱和示例值
    const columns = data ? Object.keys(data) : [];

    return NextResponse.json({
      table: tableName,
      columns: columns,
      sampleData: data,
      columnCount: columns.length
    });

  } catch (error) {
    console.error('[Table Schema Debug]:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
