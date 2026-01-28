import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 臨時 API：下載範本文件
 * GET /api/download-template?id=8d355ef1-91b3-4cc5-8ceb-1e76cd776c86
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ error: '缺少 template ID' }, { status: 400 })
    }

    // 使用 service role key 繞過 RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 獲取範本資料
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (fetchError || !template) {
      return NextResponse.json({ error: '範本不存在' }, { status: 404 })
    }

    if (!template.file_path) {
      return NextResponse.json({ error: '範本沒有文件' }, { status: 400 })
    }

    // 從 Storage 下載文件
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('raw-files')
      .download(template.file_path)

    if (downloadError || !fileData) {
      console.error('下載錯誤:', downloadError)
      return NextResponse.json(
        { error: `下載失敗: ${downloadError?.message}` },
        { status: 500 }
      )
    }

    // 返回文件
    const buffer = Buffer.from(await fileData.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${template.name || 'template'}.docx"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('API 錯誤:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}
