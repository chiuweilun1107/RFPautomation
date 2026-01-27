import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

/**
 * 直接從 Supabase Storage 提取段落（簡化版）
 * 不依賴 Python 服務或 n8n，直接從 OnlyOffice 文檔中提取基本段落資訊
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params
    const supabase = await createClient()

    // 1. 獲取範本資料
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (fetchError || !template) {
      return NextResponse.json(
        { error: '範本不存在' },
        { status: 404 }
      )
    }

    // 2. 從 Supabase Storage 下載文檔
    const filePath = template.file_path
    if (!filePath) {
      return NextResponse.json(
        { error: '範本沒有關聯的文檔文件' },
        { status: 400 }
      )
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('raw-files')
      .download(filePath)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: `無法下載文檔: ${downloadError?.message}` },
        { status: 500 }
      )
    }

    // 3. 調用 Python 解析服務
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8004'

    const formData = new FormData()
    formData.append('file', fileData, template.name || 'template.docx')

    const parseResponse = await fetch(`${pythonServiceUrl}/parse-v2`, {
      method: 'POST',
      body: formData,
    })

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text()
      console.error('Python 服務錯誤:', errorText)
      return NextResponse.json(
        { error: 'Python 解析服務失敗，請確認服務是否運行在 http://localhost:8001' },
        { status: 500 }
      )
    }

    const parseResult = await parseResponse.json()

    // 4. 更新範本的段落資料
    const { error: updateError } = await supabase
      .from('templates')
      .update({
        paragraphs: parseResult.paragraphs || [],
        parsed_tables: parseResult.parsed_tables || [],
        parsed_fields: parseResult.parsed_fields || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)

    if (updateError) {
      console.error('更新範本失敗:', updateError)
      return NextResponse.json(
        { error: '更新資料庫失敗' },
        { status: 500 }
      )
    }

    // 5. 返回成功結果
    return NextResponse.json({
      success: true,
      paragraphs_count: parseResult.paragraphs?.length || 0,
      tables_count: parseResult.parsed_tables?.length || 0,
    })

  } catch (error) {
    console.error('提取段落錯誤:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}
