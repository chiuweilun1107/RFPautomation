#!/usr/bin/env node
/**
 * 批量移除 console.log 的腳本
 * 保留 console.error 和 console.warn
 * 排除測試文件
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// 排除的目錄和文件模式
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/test-*.tsx',
  '**/test-*.ts',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/scripts/**',
  '**/__tests__/**',
  '**/public/**',
  '**/.next/**',
];

// 要清理的 console 方法（保留 error 和 warn）
const CONSOLE_METHODS_TO_REMOVE = ['log', 'info', 'debug'];

/**
 * 檢查是否應該跳過此文件
 */
function shouldSkipFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    // 簡單的模式匹配
    if (pattern.includes('**')) {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

/**
 * 處理單個文件
 */
function processFile(filePath) {
  if (shouldSkipFile(filePath)) {
    if (VERBOSE) console.log(`⏭️  Skipping: ${filePath}`);
    return { removed: 0, skipped: true };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let removedCount = 0;

  // 匹配 console.log/info/debug 語句
  // 支持多種格式：
  // - console.log('...')
  // - console.log('[Tag]', data)
  // - console.log(`template ${var}`)
  CONSOLE_METHODS_TO_REMOVE.forEach(method => {
    const patterns = [
      // 單行 console 語句
      new RegExp(`^\\s*console\\.${method}\\([^)]*\\);?\\s*$`, 'gm'),
      // 帶前導空格的 console 語句
      new RegExp(`(\\s+)console\\.${method}\\([^)]*\\);?\\s*\\n`, 'g'),
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        removedCount += matches.length;
        newContent = newContent.replace(pattern, '');
      }
    });
  });

  // 清理多餘的空行（超過 2 個連續空行）
  newContent = newContent.replace(/\n{3,}/g, '\n\n');

  if (removedCount > 0) {
    console.log(`🧹 ${filePath}: 移除 ${removedCount} 個 console 語句`);

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  } else if (VERBOSE) {
    console.log(`✨ ${filePath}: 無需清理`);
  }

  return { removed: removedCount, skipped: false };
}

/**
 * 主函數
 */
async function main() {
  console.log('🚀 開始清理 console.log...\n');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN 模式 - 不會實際修改文件\n');
  }

  // 查找所有 TypeScript 和 TypeScript React 文件
  const files = await glob('src/**/*.{ts,tsx}', {
    cwd: path.resolve(process.cwd()),
    absolute: true,
    ignore: EXCLUDE_PATTERNS,
  });

  console.log(`📁 找到 ${files.length} 個文件\n`);

  let totalRemoved = 0;
  let totalSkipped = 0;
  let totalProcessed = 0;

  for (const file of files) {
    const result = processFile(file);
    if (result.skipped) {
      totalSkipped++;
    } else {
      totalProcessed++;
      totalRemoved += result.removed;
    }
  }

  console.log('\n✅ 清理完成！');
  console.log(`📊 統計：`);
  console.log(`   - 處理文件: ${totalProcessed}`);
  console.log(`   - 跳過文件: ${totalSkipped}`);
  console.log(`   - 移除 console 語句: ${totalRemoved}`);

  if (DRY_RUN) {
    console.log('\n💡 使用 `node scripts/remove-console-logs.mjs` 實際執行清理');
  }
}

main().catch(console.error);
