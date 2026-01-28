/**
 * 創建帶有動態佔位符的目錄範本
 *
 * 保留原始範本的頁首頁尾，但內容改為動態循環
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function createDynamicTOC() {
  const sourcePath = '/Users/chiuyongren/Desktop/服務建議書範本/00_目錄.docx';
  const outputPath = '/Users/chiuyongren/Desktop/AI dev/目錄範本_動態版.docx';

  console.log('📖 讀取原始範本...');
  const buffer = fs.readFileSync(sourcePath);
  const zip = await JSZip.loadAsync(buffer);

  // 保留頁首、頁尾不變
  // 只修改主文檔內容

  // 創建新的主文檔內容
  const newDocumentContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid wp14">
  <w:body>
    <!-- 標題：目錄 -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="400" w:after="400"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:szCs w:val="36"/>
        </w:rPr>
        <w:t>目錄</w:t>
      </w:r>
    </w:p>

    <!-- 空行 -->
    <w:p>
      <w:pPr>
        <w:spacing w:after="200"/>
      </w:pPr>
    </w:p>

    <!-- 章節循環開始 -->
    <w:p>
      <w:r>
        <w:t>{#chapters}</w:t>
      </w:r>
    </w:p>

    <!-- 章節標題 -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="150" w:after="80"/>
        <w:tabs>
          <w:tab w:val="right" w:leader="dot" w:pos="9360"/>
        </w:tabs>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t>{title}</w:t>
      </w:r>
      <w:r>
        <w:tab/>
      </w:r>
      <w:r>
        <w:rPr>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>{page}</w:t>
      </w:r>
    </w:p>

    <!-- 小節循環開始 -->
    <w:p>
      <w:r>
        <w:t>{#sections}</w:t>
      </w:r>
    </w:p>

    <!-- 小節標題（有縮排） -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="60"/>
        <w:ind w:left="720"/>
        <w:tabs>
          <w:tab w:val="right" w:leader="dot" w:pos="9360"/>
        </w:tabs>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="24"/>
          <w:color w:val="555555"/>
        </w:rPr>
        <w:t>  {title}</w:t>
      </w:r>
      <w:r>
        <w:tab/>
      </w:r>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
          <w:color w:val="888888"/>
        </w:rPr>
        <w:t>{page}</w:t>
      </w:r>
    </w:p>

    <!-- 小節循環結束 -->
    <w:p>
      <w:r>
        <w:t>{/sections}</w:t>
      </w:r>
    </w:p>

    <!-- 章節循環結束 -->
    <w:p>
      <w:r>
        <w:t>{/chapters}</w:t>
      </w:r>
    </w:p>

    <!-- 分節符 -->
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId7"/>
      <w:footerReference w:type="default" r:id="rId8"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="851" w:footer="992" w:gutter="0"/>
      <w:cols w:space="425"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  // 更新主文檔
  zip.file('word/document.xml', newDocumentContent);

  // 生成新的 DOCX
  const newBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(outputPath, newBuffer);

  console.log('✅ 動態目錄範本已創建:', outputPath);
  console.log('');
  console.log('📋 佔位符說明：');
  console.log('   {#chapters} ... {/chapters}  - 章節循環');
  console.log('   {#sections} ... {/sections}  - 小節循環（巢狀）');
  console.log('   {title}                      - 標題');
  console.log('   {page}                       - 頁碼');
  console.log('');
  console.log('✨ 保留的部分：');
  console.log('   ✓ 頁首（交通部觀光署 + LOGO）');
  console.log('   ✓ 頁尾（© Hamastar + 頁碼）');
}

createDynamicTOC().catch(console.error);
