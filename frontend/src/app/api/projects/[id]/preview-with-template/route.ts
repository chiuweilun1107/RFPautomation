import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

export const maxDuration = 60

/**
 * 生成帶範本格式的預覽
 *
 * 使用 docxtemplater 填充範本，上傳到 Storage，返回預覽 URL
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { templateId } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: '請選擇範本' },
        { status: 400 }
      )
    }

    // 使用 service role key 繞過 RLS 策略
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. 獲取專案的章節結構
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (sectionsError || !sections) {
      return NextResponse.json(
        { error: '無法讀取章節資料' },
        { status: 500 }
      )
    }

    // 2. 獲取範本
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: '無法讀取範本資料' },
        { status: 404 }
      )
    }

    console.log('Template data:', {
      id: template.id,
      name: template.name,
      file_path: template.file_path
    })

    if (!template.file_path) {
      return NextResponse.json(
        { error: '範本沒有關聯的文檔文件' },
        { status: 400 }
      )
    }

    // 3. 下載範本檔案
    // 嘗試多種方式下載
    let templateFile: Blob | null = null
    let downloadError: any = null

    // 方式1: 直接使用 file_path（如果它已經是完整路徑）
    console.log('嘗試方式1: 直接使用 file_path')
    const result1 = await supabase.storage
      .from('documents')
      .download(template.file_path)

    if (!result1.error && result1.data) {
      templateFile = result1.data
      console.log('✅ 方式1 成功')
    } else {
      console.log('❌ 方式1 失敗:', result1.error)

      // 方式2: 清理 bucket 前綴後嘗試
      let cleanPath = template.file_path
      if (cleanPath.startsWith('documents/')) {
        cleanPath = cleanPath.replace('documents/', '')
      }

      console.log('嘗試方式2: 清理後的路徑:', cleanPath)
      const result2 = await supabase.storage
        .from('documents')
        .download(cleanPath)

      if (!result2.error && result2.data) {
        templateFile = result2.data
        console.log('✅ 方式2 成功')
      } else {
        console.log('❌ 方式2 失敗:', result2.error)
        downloadError = result2.error
      }
    }

    if (!templateFile) {
      // 方式3: 使用 public URL 直接下載
      console.log('嘗試方式3: 使用 public URL')

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(template.file_path)

      console.log('Public URL:', urlData.publicUrl)

      try {
        const response = await fetch(urlData.publicUrl)
        if (response.ok) {
          templateFile = await response.blob()
          console.log('✅ 方式3 成功, size:', templateFile.size)
        } else {
          console.log('❌ 方式3 失敗, status:', response.status)
        }
      } catch (fetchError) {
        console.log('❌ 方式3 fetch 失敗:', fetchError)
      }
    }

    if (!templateFile) {
      console.error('所有下載方式都失敗')
      return NextResponse.json(
        {
          error: `無法下載範本`,
          details: {
            file_path: template.file_path,
            downloadError: JSON.stringify(downloadError)
          }
        },
        { status: 500 }
      )
    }

    console.log('Template file downloaded, size:', templateFile.size)

    // 4. 組織資料結構
    const chapters = buildChapterTree(sections)

    // 5. 填充範本
    const arrayBuffer = await templateFile.arrayBuffer()
    const zip = new PizZip(arrayBuffer)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    // 填充資料
    doc.render({
      chapters: chapters.map((ch: any) => ({
        title: ch.title || '（無標題）',
        sections: ch.sections.map((sec: any) => ({
          title: sec.title || '（無標題）',
          content: sec.content || ''
        }))
      }))
    })

    // 6. 生成填好的文檔
    const filledBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    })

    // 7. 上傳到 Supabase Storage（臨時檔案）
    const previewFileName = `previews/${projectId}_${templateId}_${Date.now()}.docx`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('raw-files')
      .upload(previewFileName, filledBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `上傳失敗: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 8. 生成公開 URL（1小時有效）
    const { data: urlData } = await supabase.storage
      .from('raw-files')
      .createSignedUrl(previewFileName, 3600) // 1 hour

    if (!urlData?.signedUrl) {
      return NextResponse.json(
        { error: '無法生成預覽 URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      previewUrl: urlData.signedUrl,
      templateName: template.name,
      fileName: previewFileName
    })

  } catch (error) {
    console.error('Preview generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}

/**
 * 組織章節樹狀結構
 */
function buildChapterTree(sections: any[]) {
  const sectionMap = new Map()
  const chapters: any[] = []

  // 建立映射
  sections.forEach(s => {
    sectionMap.set(s.id, { ...s, sections: [] })
  })

  // 組織層級
  // 注意：資料庫欄位是 parent_id，不是 parent_section_id
  sections.forEach(s => {
    const section = sectionMap.get(s.id)
    if (!s.parent_id) {
      chapters.push(section)
    } else {
      const parent = sectionMap.get(s.parent_id)
      if (parent) {
        parent.sections.push(section)
      }
    }
  })

  return chapters
}
