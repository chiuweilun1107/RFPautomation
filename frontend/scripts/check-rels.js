const fs = require('fs');
const JSZip = require('jszip');

async function checkRels() {
  const sourcePath = '/Users/chiuyongren/Desktop/服務建議書範本/00_目錄.docx';
  const buffer = fs.readFileSync(sourcePath);
  const zip = await JSZip.loadAsync(buffer);

  // 讀取 document.xml.rels
  const relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string');
  
  if (relsXml) {
    console.log('📄 document.xml.rels:');
    console.log(relsXml);
    
    fs.writeFileSync('scripts/document.xml.rels', relsXml);
  }

  // 讀取原始 document.xml 的 sectPr 部分
  const docXml = await zip.file('word/document.xml')?.async('string');
  if (docXml) {
    const sectPrMatch = docXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
    if (sectPrMatch) {
      console.log('');
      console.log('📄 原始 sectPr:');
      console.log(sectPrMatch[0]);
    }
  }
}

checkRels().catch(console.error);
