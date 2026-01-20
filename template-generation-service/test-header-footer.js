const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');

async function testHeaderFooter() {
  console.log("🧪 測試頁首頁尾保留...\n");

  const testData = {
    title: "服務建議書",
    author: "AI 生成系統",
    date: "2026-01-21",
    page_number: "1",
    items: [
      { index: 1, name: "企劃書之可行性及完整性" },
      { index: 2, name: "資訊安全" },
      { index: 3, name: "專案管理規劃" }
    ]
  };

  try {
    const templatePath = "/tmp/test_with_header_footer.docx";
    
    console.log("📄 範本: test_with_header_footer.docx");
    console.log("⏳ 讀取範本...");
    
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    });

    console.log("⏳ 渲染數據...");
    doc.render(testData);

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const outputPath = '/tmp/test_with_header_footer_generated.docx';
    fs.writeFileSync(outputPath, buffer);

    console.log("\n✅ 生成成功！");
    console.log("📁 輸出位置:", outputPath);
    console.log("📊 文件大小:", (buffer.length / 1024).toFixed(2), "KB");

  } catch (error) {
    console.error("\n❌ 錯誤:", error.message);
  }
}

testHeaderFooter();
