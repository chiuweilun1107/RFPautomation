/**
 * 創建測試用的目錄範本
 *
 * 執行方式: node scripts/create-template.js
 */

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle } = require('docx');

async function createTemplate() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // 標題
        new Paragraph({
          text: "服務企劃書",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: {
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
              size: 36, // 18pt = 36 half-points
              color: "FA4028",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 200,
            after: 200,
          },
        }),

        new Paragraph({
          text: "─────────────────────────────────",
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        // 目錄內容 - 章節循環開始
        new Paragraph({
          text: "{#chapters}",
        }),

        // 章節標題（目錄中）
        new Paragraph({
          text: "{title}",
          style: "strong",
          spacing: {
            before: 100,
            after: 50,
          },
        }),

        // 小節循環開始
        new Paragraph({
          text: "  {#sections}",
        }),

        // 小節標題（目錄中，有縮排）
        new Paragraph({
          text: "　　{title}",
          spacing: {
            before: 50,
          },
        }),

        // 小節循環結束
        new Paragraph({
          text: "  {/sections}",
        }),

        // 章節循環結束
        new Paragraph({
          text: "{/chapters}",
          spacing: {
            after: 200,
          },
        }),

        new Paragraph({
          text: "─────────────────────────────────",
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // 分頁
        new Paragraph({
          text: "",
          pageBreakBefore: true,
        }),

        // 詳細內容標題
        new Paragraph({
          text: "═══════════════════════════════════",
          alignment: AlignmentType.CENTER,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "詳細內容",
              bold: true,
              size: 40,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 200,
            after: 200,
          },
        }),

        new Paragraph({
          text: "═══════════════════════════════════",
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // 內容 - 章節循環開始
        new Paragraph({
          text: "{#chapters}",
        }),

        // 章節標題（內容中）
        new Paragraph({
          children: [
            new TextRun({
              text: "{title}",
              bold: true,
              size: 40, // 20pt
              color: "FA4028",
            }),
          ],
          spacing: {
            before: 300,
            after: 200,
          },
        }),

        new Paragraph({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          spacing: { after: 200 },
        }),

        // 小節循環開始
        new Paragraph({
          text: "  {#sections}",
        }),

        // 小節標題（內容中）
        new Paragraph({
          children: [
            new TextRun({
              text: "▸ {title}",
              bold: true,
              size: 32, // 16pt
            }),
          ],
          spacing: {
            before: 200,
            after: 100,
          },
        }),

        new Paragraph({
          text: "  ─────────────────────────────",
          spacing: { after: 100 },
        }),

        // 內容
        new Paragraph({
          text: "  {content}",
          spacing: {
            before: 100,
            after: 200,
            line: 360, // 1.5 行距
          },
        }),

        // 小節循環結束
        new Paragraph({
          text: "  {/sections}",
        }),

        // 章節循環結束
        new Paragraph({
          text: "{/chapters}",
          spacing: {
            after: 400,
          },
        }),

        // 結尾
        new Paragraph({
          text: "═══════════════════════════════════",
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
        }),

        new Paragraph({
          text: "報告結束",
          alignment: AlignmentType.CENTER,
        }),

        new Paragraph({
          text: "═══════════════════════════════════",
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });

  // 生成 buffer
  const buffer = await Packer.toBuffer(doc);

  // 儲存到桌面
  const outputPath = path.join(__dirname, '../../目錄範本_測試用.docx');
  fs.writeFileSync(outputPath, buffer);

  console.log('✅ 範本已創建:', outputPath);
  console.log('📝 請上傳此檔案到系統的 Templates 頁面進行測試');
}

createTemplate().catch(console.error);
