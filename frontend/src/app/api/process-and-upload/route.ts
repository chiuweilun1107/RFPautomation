import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * API Route: 處理 DOCX 字體並上傳到 Supabase
 *
 * POST /api/process-and-upload
 * - 接收 .docx 文件
 * - 替換字體名稱（標楷體 → AR PL KaitiM Big5）
 * - 上傳到 Supabase Storage
 * - 返回公開 URL
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'documents'; // 可選：指定 bucket
    const folder = (formData.get('folder') as string) || 'test-uploads'; // 可選：指定文件夾

    if (!file) {
      return NextResponse.json({ error: '未提供文件' }, { status: 400 });
    }

    if (!file.name.endsWith('.docx')) {
      return NextResponse.json({ error: '僅支援 .docx 文件' }, { status: 400 });
    }

    console.log('[處理] 接收文件:', file.name);
    console.log('[處理] Bucket:', bucket, 'Folder:', folder);

    // 建立臨時文件路徑
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const inputPath = path.join(tempDir, `input_${timestamp}.docx`);
    const outputPath = path.join(tempDir, `output_${timestamp}.docx`);

    try {
      // 將上傳的文件寫入臨時文件
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(inputPath, buffer);

      console.log('[處理] 替換字體...');

      // 執行 Python 腳本替換字體
      const scriptPath = path.join(process.cwd(), 'scripts', 'replace-font-in-docx.py');
      const { stderr } = await execAsync(`python3 "${scriptPath}" "${inputPath}" "${outputPath}"`);

      if (stderr) {
        console.log('[處理] Python 輸出:', stderr);
      }

      // 讀取處理後的文件
      const processedBuffer = fs.readFileSync(outputPath);

      console.log('[上傳] 上傳到 Supabase...');

      // 初始化 Supabase 客戶端（使用 service role key）
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // 上傳到 Supabase Storage（使用指定的 bucket 和 folder）
      const fileExtension = 'docx';
      const safeFileName = `${folder}/${timestamp}.${fileExtension}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(safeFileName, processedBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 獲取公開 URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

      console.log('[完成] 文件 URL:', urlData.publicUrl);

      return NextResponse.json({
        success: true,
        url: urlData.publicUrl,
        fileName: file.name,
        processedPath: data.path,
      });

    } finally {
      // 清理臨時文件
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (cleanupError) {
        console.error('[清理] 清理臨時文件失敗:', cleanupError);
      }
    }

  } catch (error) {
    console.error('[錯誤]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '處理失敗',
      },
      { status: 500 }
    );
  }
}
