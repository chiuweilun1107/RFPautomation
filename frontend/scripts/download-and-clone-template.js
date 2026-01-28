/**
 * 下載原始範本並基於它創建只有目錄的新範本
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
require('dotenv').config({ path: '.env.local' });

async function downloadAndCloneTemplate() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 環境變數');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const filePath = 'documents/8d355ef1-91b3-4cc5-8ceb-1e76cd776c86_1769386806979.docx';

  console.log('📥 正在下載範本文件...');

  // 下載文件
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('raw-files')
    .download(filePath);

  if (downloadError) {
    console.error('❌ 下載失敗:', downloadError);
    process.exit(1);
  }

  console.log('✅ 文件下載成功');

  // 儲存原始文件
  const originalPath = path.join(__dirname, '../../原始範本_00_目錄.docx');
  const buffer = Buffer.from(await fileData.arrayBuffer());
  fs.writeFileSync(originalPath, buffer);
  console.log('💾 原始範本已儲存到:', originalPath);

  // 解析 DOCX 結構
  console.log('');
  console.log('🔍 解析 DOCX 結構...');
  
  const zip = await JSZip.loadAsync(buffer);
  
  // 列出所有文件
  console.log('📦 DOCX 內部文件：');
  Object.keys(zip.files).forEach(fileName => {
    console.log('  -', fileName);
  });

  // 讀取主文檔
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (documentXml) {
    const docPath = path.join(__dirname, 'document.xml');
    fs.writeFileSync(docPath, documentXml);
    console.log('');
    console.log('📄 主文檔已儲存到:', docPath);
  }

  // 讀取頁首
  const header1Xml = await zip.file('word/header1.xml')?.async('string');
  if (header1Xml) {
    const headerPath = path.join(__dirname, 'header1.xml');
    fs.writeFileSync(headerPath, header1Xml);
    console.log('📄 頁首已儲存到:', headerPath);
  }

  // 讀取頁尾
  const footer1Xml = await zip.file('word/footer1.xml')?.async('string');
  if (footer1Xml) {
    const footerPath = path.join(__dirname, 'footer1.xml');
    fs.writeFileSync(footerPath, footer1Xml);
    console.log('📄 頁尾已儲存到:', footerPath);
  }

  console.log('');
  console.log('✅ 解析完成！');
  console.log('');
  console.log('下一步：');
  console.log('1. 檢查原始範本: ' + originalPath);
  console.log('2. 查看頁首內容: scripts/header1.xml');
  console.log('3. 查看頁尾內容: scripts/footer1.xml');
}

downloadAndCloneTemplate().catch(console.error);
