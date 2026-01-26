/**
 * 上傳字體到 ONLYOFFICE 伺服器
 *
 * 使用方式：
 * 1. 從 Windows 系統複製字體檔（如 kaiu.ttf）到此目錄
 * 2. 執行：npx tsx scripts/upload-font-to-onlyoffice.ts <字體檔路徑>
 *
 * 標楷體位置（Windows）：
 * C:\Windows\Fonts\kaiu.ttf
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function uploadFont(fontPath: string) {
  // 檢查檔案是否存在
  if (!fs.existsSync(fontPath)) {
    console.error(`❌ 找不到字體檔：${fontPath}`);
    console.log('');
    console.log('請提供字體檔路徑，例如：');
    console.log('  npx tsx scripts/upload-font-to-onlyoffice.ts ./kaiu.ttf');
    console.log('');
    console.log('💡 如何獲取標楷體：');
    console.log('  1. 從 Windows 系統複製：C:\\Windows\\Fonts\\kaiu.ttf');
    console.log('  2. 或使用任何 .ttf/.ttc 字體檔');
    process.exit(1);
  }

  const fontName = path.basename(fontPath);
  console.log(`📤 準備上傳字體：${fontName}`);
  console.log(`📁 本地路徑：${fontPath}`);

  try {
    // 1. 複製字體到伺服器
    console.log('');
    console.log('[1/4] 上傳字體到伺服器...');
    await execAsync(
      `scp -i ~/.ssh/id_hetzner_migration "${fontPath}" root@5.78.118.41:/tmp/${fontName}`
    );
    console.log('✅ 上傳成功');

    // 2. 複製到 ONLYOFFICE 容器
    console.log('');
    console.log('[2/4] 複製到 ONLYOFFICE 容器...');
    await execAsync(
      `ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "docker cp /tmp/${fontName} onlyoffice-documentserver:/usr/share/fonts/truetype/${fontName}"`
    );
    console.log('✅ 複製成功');

    // 3. 更新字體緩存
    console.log('');
    console.log('[3/4] 更新字體緩存...');
    const { stdout: fcOutput } = await execAsync(
      `ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "docker exec onlyoffice-documentserver fc-cache -f -v" 2>&1 | tail -5`
    );
    console.log('✅ 字體緩存已更新');

    // 4. 重新生成 ONLYOFFICE 字體列表
    console.log('');
    console.log('[4/4] 重新生成 ONLYOFFICE 字體列表...');
    const { stdout: generateOutput } = await execAsync(
      `ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "docker exec onlyoffice-documentserver documentserver-generate-allfonts.sh" 2>&1`
    );
    console.log('✅ 字體列表已生成');

    // 5. 驗證字體
    console.log('');
    console.log('[驗證] 檢查字體是否安裝成功...');
    const { stdout: verifyOutput } = await execAsync(
      `ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "docker exec onlyoffice-documentserver fc-list | grep -i '${fontName.replace('.ttf', '').replace('.ttc', '')}' || echo '未找到'"`
    );

    if (verifyOutput.includes('未找到')) {
      console.log('⚠️  字體可能未正確安裝');
    } else {
      console.log('✅ 字體安裝成功！');
      console.log('');
      console.log('字體資訊：');
      console.log(verifyOutput.trim());
    }

    // 完成
    console.log('');
    console.log('🎉 完成！');
    console.log('');
    console.log('下一步：');
    console.log('  1. 重新整理 ONLYOFFICE 編輯器');
    console.log('  2. 在字體選單中應該可以看到新字體');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ 錯誤：', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// 主程式
const fontPath = process.argv[2];

if (!fontPath) {
  console.log('❌ 請提供字體檔路徑');
  console.log('');
  console.log('使用方式：');
  console.log('  npx tsx scripts/upload-font-to-onlyoffice.ts <字體檔路徑>');
  console.log('');
  console.log('範例：');
  console.log('  npx tsx scripts/upload-font-to-onlyoffice.ts ./kaiu.ttf');
  console.log('  npx tsx scripts/upload-font-to-onlyoffice.ts ~/Downloads/標楷體.ttf');
  console.log('');
  console.log('💡 標楷體位置（Windows）：');
  console.log('  C:\\Windows\\Fonts\\kaiu.ttf');
  console.log('');
  process.exit(1);
}

uploadFont(fontPath);
