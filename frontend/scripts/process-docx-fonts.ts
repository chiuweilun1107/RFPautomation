/**
 * 處理 DOCX 文件字體替換的 Node.js 包裝器
 *
 * 使用方式：
 * npx tsx scripts/process-docx-fonts.ts <input.docx> [output.docx]
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

async function processDocxFonts(inputPath: string, outputPath?: string): Promise<string> {
  // 檢查文件是否存在
  if (!fs.existsSync(inputPath)) {
    throw new Error(`找不到文件: ${inputPath}`);
  }

  // 如果沒有指定輸出路徑，則覆蓋原文件
  const finalOutputPath = outputPath || inputPath;

  // 取得 Python 腳本路徑
  const scriptPath = path.join(__dirname, 'replace-font-in-docx.py');

  console.log(`📄 處理文件: ${inputPath}`);
  console.log(`💾 輸出路徑: ${finalOutputPath}`);

  try {
    // 執行 Python 腳本
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" "${inputPath}" "${finalOutputPath}"`
    );

    if (stderr) {
      console.log(stderr);
    }
    if (stdout) {
      console.log(stdout);
    }

    return finalOutputPath;
  } catch (error) {
    throw new Error(`處理失敗: ${error instanceof Error ? error.message : error}`);
  }
}

// 導出函數供其他模組使用
export { processDocxFonts };

// 如果直接執行此腳本
if (require.main === module) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile) {
    console.error('使用方式: npx tsx scripts/process-docx-fonts.ts <input.docx> [output.docx]');
    process.exit(1);
  }

  processDocxFonts(inputFile, outputFile)
    .then((output) => {
      console.log('✅ 完成!');
      console.log(`📁 處理後的文件: ${output}`);
    })
    .catch((error) => {
      console.error('❌ 錯誤:', error.message);
      process.exit(1);
    });
}
