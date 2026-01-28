/**
 * 創建只有目錄頁的範本（帶頁首頁腳）
 *
 * 這個腳本會創建一個簡潔的目錄範本，包含：
 * - 頁首：公司資訊
 * - 目錄主體（支援章節和小節循環）
 * - 頁尾：頁碼
 *
 * 執行方式: node scripts/create-toc-only-template.js
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
  NumberFormat,
  BorderStyle
} = require('docx');

async function createTOCTemplate() {
  const doc = new Document({
    sections: [{
      // 頁首設定
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "企業服務企劃書",
                  bold: true,
                  size: 20,
                  color: "333333",
                }),
              ],
              alignment: AlignmentType.LEFT,
              border: {
                bottom: {
                  color: "FA4028",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
              spacing: {
                after: 100,
              },
            }),
          ],
        }),
      },
      // 頁尾設定
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "第 ",
                  size: 18,
                  color: "666666",
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  color: "666666",
                }),
                new TextRun({
                  text: " 頁",
                  size: 18,
                  color: "666666",
                }),
              ],
              alignment: AlignmentType.CENTER,
              border: {
                top: {
                  color: "CCCCCC",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
              spacing: {
                before: 100,
              },
            }),
          ],
        }),
      },
      // 主要內容
      children: [
        // 標題
        new Paragraph({
          text: "服務企劃書",
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

        // === 目錄內容區域 ===
        // 章節循環開始
        new Paragraph({
          text: "{#chapters}",
          spacing: { before: 0 },
        }),

        // 章節標題（目錄中）- 使用 Tab Stop 和點線
        new Paragraph({
          children: [
            new TextRun({
              text: "{title}",
              bold: true,
              size: 28, // 14pt
              color: "000000",
            }),
            new TextRun({
              text: "\t{page}",
              size: 24,
              color: "666666",
            }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
              leader: LeaderType.DOT, // 點線
            },
          ],
          spacing: {
            before: 150,
            after: 80,
          },
        }),

        // 小節循環開始
        new Paragraph({
          text: "{#sections}",
        }),

        // 小節標題（目錄中，有縮排和點線）
        new Paragraph({
          children: [
            new TextRun({
              text: "  {title}",
              size: 24, // 12pt
              color: "555555",
            }),
            new TextRun({
              text: "\t{page}",
              size: 20,
              color: "888888",
            }),
          ],
          indent: {
            left: 720, // 0.5 inch = 720 twips
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

        // 小節循環結束
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
          spacing: {
            before: 200,
            after: 200,
          },
        }),

        // 使用說明（可選，可以刪除）
        new Paragraph({
          children: [
            new TextRun({
              text: "💡 使用說明",
              bold: true,
              size: 20,
              color: "3182CE",
            }),
          ],
          spacing: {
            before: 400,
            after: 100,
          },
        }),

        new Paragraph({
          text: "此範本支援動態章節與小節生成：",
          spacing: { after: 50 },
        }),

        new Paragraph({
          text: "• {#chapters} 循環會生成所有章節",
          indent: { left: 360 },
          spacing: { after: 30 },
        }),

        new Paragraph({
          text: "• {#sections} 巢狀循環會生成章節下的小節",
          indent: { left: 360 },
          spacing: { after: 30 },
        }),

        new Paragraph({
          text: "• {title} 變數會被替換為實際標題",
          indent: { left: 360 },
          spacing: { after: 30 },
        }),

        new Paragraph({
          text: "• {page} 變數會被替換為頁碼",
          indent: { left: 360 },
          spacing: { after: 200 },
        }),
      ],
    }],
  });

  // 生成 buffer
  const buffer = await Packer.toBuffer(doc);

  // 儲存到桌面
  const outputPath = path.join(__dirname, '../../目錄範本_僅目錄頁_含頁首頁腳.docx');
  fs.writeFileSync(outputPath, buffer);

  console.log('✅ 目錄範本已創建:', outputPath);
  console.log('');
  console.log('📋 範本特色：');
  console.log('   ✓ 包含頁首（企業服務企劃書）');
  console.log('   ✓ 包含頁尾（頁碼）');
  console.log('   ✓ 章節標題（粗體、14pt）');
  console.log('   ✓ 小節標題（縮排、12pt）');
  console.log('   ✓ 使用 Tab Stops 和點線連接頁碼');
  console.log('   ✓ 支援 {#chapters} 和 {#sections} 循環');
  console.log('');
  console.log('📤 下一步：請上傳此檔案到系統的 Templates 頁面');
}

createTOCTemplate().catch(console.error);
