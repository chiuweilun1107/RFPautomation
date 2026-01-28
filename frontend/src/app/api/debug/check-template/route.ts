import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 診斷 API：檢查範本文件是否可訪問
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const templateId = searchParams.get('templateId')

  if (!templateId) {
    return NextResponse.json({ error: '需要 templateId 參數' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. 檢查範本記錄
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError) {
      return NextResponse.json({
        step: 'fetch_template',
        error: templateError,
        success: false
      })
    }

    // 2. 列出 documents bucket 中的所有文件
    const { data: filesList, error: listError } = await supabase.storage
      .from('documents')
      .list('', { limit: 100 })

    // 3. 嘗試下載範本文件
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(template.file_path)

    // 4. 獲取 public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(template.file_path)

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        file_path: template.file_path,
        created_at: template.created_at
      },
      storage: {
        bucket: 'documents',
        files_count: filesList?.length || 0,
        files: filesList?.map(f => f.name) || [],
        download_success: !downloadError,
        download_error: downloadError ? JSON.stringify(downloadError) : null,
        download_size: downloadData?.size || null,
        public_url: urlData.publicUrl
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    })
  }
}
