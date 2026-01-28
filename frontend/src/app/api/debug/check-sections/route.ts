import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 診斷 API：檢查專案的章節層級結構
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: '需要 projectId 參數' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 獲取所有章節
    const { data: sections, error } = await supabase
      .from('sections')
      .select('id, title, parent_section_id, order_index, level')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (error) throw error

    // 分析結構
    const chapters = sections?.filter(s => !s.parent_section_id) || []
    const childSections = sections?.filter(s => s.parent_section_id) || []

    // 建立層級樹
    const tree = chapters.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      level: chapter.level,
      order_index: chapter.order_index,
      children: childSections
        .filter(s => s.parent_section_id === chapter.id)
        .map(child => ({
          id: child.id,
          title: child.title,
          level: child.level,
          order_index: child.order_index,
          parent_id: child.parent_section_id
        }))
    }))

    return NextResponse.json({
      success: true,
      projectId,
      totalSections: sections?.length || 0,
      chaptersCount: chapters.length,
      childSectionsCount: childSections.length,
      orphanedSections: childSections.filter(s =>
        !chapters.find(c => c.id === s.parent_section_id)
      ),
      tree,
      rawSections: sections
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 })
  }
}
