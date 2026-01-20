const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');

async function testDemoTemplate() {
  console.log("🧪 測試動態範本...\n");

  const testData = {
    chapters: [
      {
        romanNumber: "壹",
        title: "企劃書之可行性及完整性",
        sections: [
          { index: "一", name: "專案緣起", page: "1-1" },
          { index: "二", name: "計畫期程", page: "1-2" },
          { index: "三", name: "主要工作項目", page: "1-5" },
        ]
      },
      {
        romanNumber: "貳",
        title: "資訊安全",
        sections: [
          { index: "一", name: "資安管理規劃", page: "2-1" },
          { index: "二", name: "資安事件應變", page: "2-3" },
        ]
      },
      {
        romanNumber: "參",
        title: "專案管理規劃",
        sections: [
          { index: "一", name: "專案人力配置", page: "3-1" },
          { index: "二", name: "執行能力", page: "3-4" },
        ]
      }
    ]
  };

  try {
    const templatePath = "/tmp/00_目錄_範本_示範.docx";

    if (!fs.existsSync(templatePath)) {
      console.error("❌ 找不到範本文件");
      return;
    }

    console.log("✅ 找到範本文件");
    console.log("📄 範本: 00_目錄_範本_示範.docx\n");

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

    const outputPath = '/tmp/test_demo_generated.docx';
    fs.writeFileSync(outputPath, buffer);

    console.log("\n✅ 生成成功！");
    console.log("📁 輸出位置:", outputPath);
    console.log("📊 文件大小:", (buffer.length / 1024).toFixed(2), "KB");
    console.log("\n🎉 測試完成！");

  } catch (error) {
    console.error("\n❌ 錯誤:", error.message);

    if (error.properties && error.properties.errors) {
      console.error("\n範本錯誤詳情:");
      error.properties.errors.forEach((err, idx) => {
        console.error(`  [${idx + 1}] ${err.message}`);
        console.error(`      位置: ${err.part}`);
      });
    }
  }
}

testDemoTemplate();
