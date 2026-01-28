/**
 * 基於現有範本創建目錄範本
 * 
 * 由於無法直接下載原始文件，我們創建一個腳本：
 * 1. 在瀏覽器中打開現有範本
 * 2. 創建一個新的目錄範本 DOCX
 * 3. 用戶手動複製頁首頁腳
 */

const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  TabStopType,
  TabStopPosition,
  LeaderType,
  Header,
  Footer,
  PageNumber,
  BorderStyle
} = require('docx');

console.log('');
console.log('🎯 創建目錄範本（基於現有範本結構）');
console.log('');
console.log('📋 步驟：');
console.log('1. 先在瀏覽器打開現有範本：');
console.log('   http://localhost:3000/dashboard/templates/8d355ef1-91b3-4cc5-8ceb-1e76cd776c86/design');
console.log('');
console.log('2. 下載或匯出該範本的 DOCX 文件');
console.log('');
console.log('3. 我現在創建一個基礎的目錄範本，你可以在 Word/OnlyOffice 中：');
console.log('   - 開啟原始範本');
console.log('   - 複製頁首');
console.log('   - 複製頁尾');
console.log('   - 貼到新範本中');
console.log('');

async function createBasicTOC() {
  // 創建一個基礎的目錄範本（無頁首頁腳）
  const doc = new Document({
    sections: [{
      children: [
        // 標題
        new Paragraph({
          children: [
            new TextRun({
              text: "服務企劃書",
              bold: true,
              size: 48, // 24pt
            }),
          ],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 200,
            after: 400,
          },
        }),

        // 分隔線
        new Paragraph({
          text: "═══════════════════════════════════",
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // 目錄標題
        new Paragraph({
          children: [
            new TextRun({
              text: "📋 目  錄",
              bold: true,
              size: 36, // 18pt
              color: "FA4028",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 200,
            after: 300,
          },
        }),

        new Paragraph({
          text: "─────────────────────────────────",
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),

        // === 目錄內容 ===
        // 章節循環開始
        new Paragraph({
          text: "{#chapters}",
        }),

        // 章節標題（目錄中）
        new Paragraph({
          children: [
            new TextRun({
              text: "{title}",
              bold: true,
              size: 28, // 14pt
            }),
            new TextRun({
              text: "\t{page}",
              size: 24,
            }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
              leader: LeaderType.DOT,
            },
          ],
          spacing: {
            before: 150,
            after: 80,
          },
        }),

        // 小節循環
        new Paragraph({
          text: "{#sections}",
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "  {title}",
              size: 24,
            }),
            new TextRun({
              text: "\t{page}",
              size: 20,
            }),
          ],
          indent: {
            left: 720,
          },
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
              leader: LeaderType.DOT,
            },
          ],
          spacing: {
            before: 60,
          },
        }),

        new Paragraph({
          text: "{/sections}",
        }),

        // 章節循環結束
        new Paragraph({
          text: "{/chapters}",
          spacing: {
            after: 300,
          },
        }),

        // 底部分隔線
        new Paragraph({
          text: "─────────────────────────────────",
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '../../目錄範本_待補頁首頁腳.docx');
  fs.writeFileSync(outputPath, buffer);

  console.log('');
  console.log('✅ 基礎目錄範本已創建:', outputPath);
  console.log('');
  console.log('⚠️  注意：此範本還缺少頁首和頁尾');
  console.log('');
  console.log('📝 手動步驟：');
  console.log('1. 打開原始範本（在瀏覽器設計器中下載）');
  console.log('2. 在 Word/OnlyOffice 中打開原始範本');
  console.log('3. 複製頁首內容（Ctrl+C）');
  console.log('4. 打開新創建的範本: ' + outputPath);
  console.log('5. 貼上頁首（進入頁首編輯模式）');
  console.log('6. 重複步驟 3-5 以複製頁尾');
  console.log('7. 儲存並上傳到系統');
  console.log('');
}

createBasicTOC().catch(console.error);
