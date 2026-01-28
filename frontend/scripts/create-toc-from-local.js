/**
 * 從本地範本創建只有目錄頁的新範本
 *
 * 步驟：
 * 1. 讀取原始範本 DOCX
 * 2. 解析並提取頁首、頁尾
 * 3. 保留目錄部分，刪除其他內容
 * 4. 創建新的 DOCX 文件
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function createTOCFromLocal() {
  const sourcePath = '/Users/chiuyongren/Desktop/服務建議書範本/00_目錄.docx';
  const outputPath = '/Users/chiuyongren/Desktop/AI dev/目錄範本_僅目錄頁.docx';

  console.log('📖 讀取原始範本:', sourcePath);

  const buffer = fs.readFileSync(sourcePath);
  const zip = await JSZip.loadAsync(buffer);

  console.log('');
  console.log('📦 DOCX 內部結構：');
  Object.keys(zip.files).forEach(fileName => {
    if (!zip.files[fileName].dir) {
      console.log('  ', fileName);
    }
  });

  // 讀取主文檔
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (documentXml) {
    console.log('');
    console.log('📄 主文檔長度:', documentXml.length, '字符');

    // 儲存原始文檔以供檢查
    fs.writeFileSync(
      path.join(__dirname, 'original-document.xml'),
      documentXml
    );
    console.log('   已儲存到: scripts/original-document.xml');
  }

  // 讀取頁首
  const headerFiles = Object.keys(zip.files).filter(f => f.match(/word\/header\d*.xml/));
  console.log('');
  console.log('📋 頁首文件:', headerFiles.length, '個');
  headerFiles.forEach(async (headerFile, index) => {
    const content = await zip.file(headerFile)?.async('string');
    if (content) {
      const outPath = path.join(__dirname, `header${index + 1}.xml`);
      fs.writeFileSync(outPath, content);
      console.log(`   ${headerFile} -> scripts/header${index + 1}.xml`);
    }
  });

  // 讀取頁尾
  const footerFiles = Object.keys(zip.files).filter(f => f.match(/word\/footer\d*.xml/));
  console.log('');
  console.log('📋 頁尾文件:', footerFiles.length, '個');
  footerFiles.forEach(async (footerFile, index) => {
    const content = await zip.file(footerFile)?.async('string');
    if (content) {
      const outPath = path.join(__dirname, `footer${index + 1}.xml`);
      fs.writeFileSync(outPath, content);
      console.log(`   ${footerFile} -> scripts/footer${index + 1}.xml`);
    }
  });

  // 直接複製整個文件作為起點
  fs.writeFileSync(outputPath, buffer);

  console.log('');
  console.log('✅ 已複製範本到:', outputPath);
  console.log('');
  console.log('📝 下一步：');
  console.log('1. 查看解析出的 XML 文件');
  console.log('2. 在 Word/OnlyOffice 中打開新範本');
  console.log('3. 手動刪除不需要的內容（保留目錄部分）');
  console.log('4. 確保頁首頁尾保持完整');
  console.log('5. 儲存並上傳到系統');
}

createTOCFromLocal().catch(console.error);
