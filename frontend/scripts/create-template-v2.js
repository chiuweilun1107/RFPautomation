/**
 * 創建測試用的目錄範本（修正版）
 *
 * 解決問題：
 * 1. 正確的嵌套層級結構
 * 2. 子章節縮排
 * 3. 目錄中的點線和頁碼（使用 Tab Stops）
 *
 * 執行方式: node scripts/create-template-v2.js
 */

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, TabStopType, TabStopPosition, LeaderType } = require('docx');

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

        // === 目錄內容區域 ===
        // 注意：docxtemplater 的循環標記需要在文本內容中，不能單獨成段落

        // 章節循環（目錄）
        new Paragraph({
          text: "{#chapters}",
          spacing: { before: 0 },
        }),

        // 章節標題（目錄中） - 使用 Tab Stop 和點線
        new Paragraph({
          children: [
            new TextRun({
              text: "{title}",
              bold: true,
              size: 28, // 14pt
              color: "000000",
            }),
            new TextRun({
              text: "\t頁碼待定",
              size: 24,
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
            before: 100,
            after: 50,
          },
        }),

        // 小節循環（目錄）
        new Paragraph({
          text: "{#sections}",
        }),

        // 小節標題（目錄中，有縮排和點線）
        new Paragraph({
          children: [
            new TextRun({
              text: "  {title}",
              size: 24, // 12pt
              color: "666666",
            }),
            new TextRun({
              text: "\t頁碼待定",
              size: 20,
              color: "666666",
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
            before: 50,
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

        // === 詳細內容區域 ===
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
          text: "{#sections}",
        }),

        // 小節標題（內容中，有縮排）
        new Paragraph({
          children: [
            new TextRun({
              text: "▸ {title}",
              bold: true,
              size: 32, // 16pt
            }),
          ],
          indent: {
            left: 360, // 0.25 inch
          },
          spacing: {
            before: 200,
            after: 100,
          },
        }),

        new Paragraph({
          text: "─────────────────────────────",
          indent: {
            left: 360,
          },
          spacing: { after: 100 },
        }),

        // 內容（有縮排）
        new Paragraph({
          text: "{content}",
          indent: {
            left: 360,
          },
          spacing: {
            before: 100,
            after: 200,
            line: 360, // 1.5 行距
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
  const outputPath = path.join(__dirname, '../../目錄範本_v2.docx');
  fs.writeFileSync(outputPath, buffer);

  console.log('✅ 範本已創建:', outputPath);
  console.log('📝 改進項目：');
  console.log('   - ✓ 修正嵌套循環結構');
  console.log('   - ✓ 添加子章節縮排');
  console.log('   - ✓ 目錄添加 Tab Stops 和點線');
  console.log('   - ✓ 詳細內容區域添加縮排');
}

createTemplate().catch(console.error);
