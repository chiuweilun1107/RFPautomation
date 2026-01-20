import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// 使用 service role key 查詢範本（繞過 RLS）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // 'toc' 表示查詢目錄範本

    const supabase = await createClient()

    let query = supabase
      .from('templates')
      .select('id, name, description, category, paragraphs, parsed_tables, styles')
      .order('created_at', { ascending: false })

    // 如果有篩選條件
    if (filter === 'toc') {
      query = query.or('category.ilike.%目錄%,name.ilike.%目錄%')
    }

    const { data, error } = await query

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates: data || [] })
  } catch (error) {
    console.error('API error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
