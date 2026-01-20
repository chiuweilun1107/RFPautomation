const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

async function testLocalGeneration() {
  console.log("🧪 本地測試範本生成...\n");

  // 測試數據
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
    // 1. 檢查範本文件
    const templatePath = "/Users/chiuyongren/Desktop/服務建議書範本/00_目錄.docx";

    if (!fs.existsSync(templatePath)) {
      console.error("❌ 找不到範本文件:", templatePath);
      console.log("\n請先準備範本文件，並在 Word 中加入佔位符：");
      console.log("  {#chapters}");
      console.log("  {romanNumber}、{title}");
      console.log("    {#sections}");
      console.log("    {index}、{name}...{page}");
      console.log("    {/sections}");
      console.log("  {/chapters}");
      return;
    }

    console.log("✅ 找到範本文件");
    console.log("📄 範本:", path.basename(templatePath));

    // 2. 讀取範本
    console.log("\n⏳ 讀取範本...");
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // 3. 創建 docxtemplater
    console.log("⏳ 初始化 docxtemplater...");
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    });

    // 4. 渲染數據
    console.log("⏳ 渲染數據...");
    console.log("\n填充的數據:");
    console.log(JSON.stringify(testData, null, 2));

    doc.render(testData);

    // 5. 生成文檔
    console.log("\n⏳ 生成文檔...");
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // 6. 保存文件
    const outputPath = '/tmp/test_generated.docx';
    fs.writeFileSync(outputPath, buffer);

    console.log("\n✅ 生成成功！");
    console.log("📁 輸出位置:", outputPath);
    console.log("📊 文件大小:", (buffer.length / 1024).toFixed(2), "KB");

    console.log("\n🎉 測試完成！請打開文件查看結果。");

  } catch (error) {
    console.error("\n❌ 錯誤:", error.message);

    if (error.properties && error.properties.errors) {
      console.error("\n範本錯誤詳情:");
      error.properties.errors.forEach((err, idx) => {
        console.error(`  [${idx + 1}] ${err.message}`);
        console.error(`      位置: ${err.part}`);
      });
    }

    console.error("\n💡 提示:");
    console.error("  1. 確認範本文件中有正確的佔位符");
    console.error("  2. 佔位符格式：{變數名}");
    console.error("  3. 迴圈格式：{#陣列名}...{/陣列名}");
  }
}

// 檢查依賴
try {
  require('docxtemplater');
  require('pizzip');
  console.log("✅ 依賴已安裝\n");
  testLocalGeneration();
} catch (error) {
  console.error("❌ 缺少依賴，請先執行: npm install");
  console.error("   需要的套件: docxtemplater, pizzip");
}
