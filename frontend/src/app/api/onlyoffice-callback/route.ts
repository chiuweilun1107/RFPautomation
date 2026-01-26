import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * ONLYOFFICE Document Server Callback API
 *
 * 當用戶在 ONLYOFFICE 中保存文檔時，Document Server 會調用此 API
 *
 * 文檔：https://api.onlyoffice.com/editors/callback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[ONLYOFFICE Callback] 收到回調:', JSON.stringify(body, null, 2));

    const { status, url, key } = body;

    /**
     * Status codes:
     * 0 - 文檔尚未準備好
     * 1 - 文檔正在編輯
     * 2 - 文檔已準備好保存
     * 3 - 文檔保存出錯
     * 4 - 文檔已關閉，無變更
     * 6 - 文檔正在編輯，但當前用戶已保存
     * 7 - 強制保存時出錯
     */

    // 只處理 status = 2（文檔已準備好保存）
    if (status === 2 || status === 6) {
      console.log('[ONLYOFFICE Callback] 文檔已準備保存，下載 URL:', url);

      // 從 key 中提取 ID 和類型
      // key 格式: "template_{id}_{timestamp}" 或 "section_{id}_{timestamp}"
      const templateMatch = key.match(/^template_([a-f0-9-]+)_\d+$/);
      const sectionMatch = key.match(/^section_([a-f0-9-]+)_(?:\d+|stable)$/);

      let entityType: 'template' | 'section' | null = null;
      let entityId: string | null = null;

      if (templateMatch) {
        entityType = 'template';
        entityId = templateMatch[1];
      } else if (sectionMatch) {
        entityType = 'section';
        entityId = sectionMatch[1];
      } else {
        console.error('[ONLYOFFICE Callback] 無法從 key 解析 ID:', key);
        return NextResponse.json({ error: 0 }); // 返回 error: 0 表示成功
      }

      console.log(`[ONLYOFFICE Callback] ${entityType} ID:`, entityId);

      // 下載編輯後的文檔
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`下載文檔失敗: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('[ONLYOFFICE Callback] 文檔已下載，大小:', blob.size);

      // 使用 service role key 上傳到 Supabase
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // 生成新的文件名和選擇正確的 bucket
      const timestamp = Date.now();
      let bucketName: string;
      let newFileName: string;

      if (entityType === 'section') {
        // Section 文件存儲在 raw-files bucket
        bucketName = 'raw-files';
        newFileName = `section-templates/${entityId}_${timestamp}.docx`;
      } else {
        // Template 文件存儲在 documents bucket
        bucketName = 'documents';
        newFileName = `${entityId}_${timestamp}.docx`;
      }

      // 上傳到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(newFileName, blob, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      console.log(`[ONLYOFFICE Callback] 文檔已上傳到 Supabase (${bucketName}):`, uploadData.path);

      // 獲取 public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path);

      console.log('[ONLYOFFICE Callback] Public URL:', publicUrl);

      // 根據類型更新對應的表
      if (entityType === 'section') {
        // 更新 sections 表的 template_file_url
        const { error: updateError } = await supabase
          .from('sections')
          .update({
            template_file_url: publicUrl,
          })
          .eq('id', entityId);

        if (updateError) {
          throw updateError;
        }

        console.log('[ONLYOFFICE Callback] Section 已更新');
      } else {
        // 更新 templates 表的 file_path
        const { error: updateError } = await supabase
          .from('templates')
          .update({
            file_path: uploadData.path,
            updated_at: new Date().toISOString(),
          })
          .eq('id', entityId);

        if (updateError) {
          throw updateError;
        }

        console.log('[ONLYOFFICE Callback] Template 已更新');
      }

      // 返回 error: 0 表示成功
      return NextResponse.json({ error: 0 });
    }

    // 其他 status 也返回成功
    return NextResponse.json({ error: 0 });

  } catch (error) {
    console.error('[ONLYOFFICE Callback] 錯誤:', error);
    // 即使出錯也返回 error: 0，避免 ONLYOFFICE 重試
    return NextResponse.json({ error: 0 });
  }
}
