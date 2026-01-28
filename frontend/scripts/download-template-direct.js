const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function downloadTemplate() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // 直接獲取公開 URL
  const { data } = supabase.storage
    .from('raw-files')
    .getPublicUrl('documents/8d355ef1-91b3-4cc5-8ceb-1e76cd776c86_1769386806979.docx');

  console.log('📥 下載 URL:', data.publicUrl);
  
  // 用 fetch 下載
  const response = await fetch(data.publicUrl);
  
  if (!response.ok) {
    console.error('下載失敗:', response.status);
    process.exit(1);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  const outputPath = path.join(__dirname, '../../原始範本_00_目錄.docx');
  fs.writeFileSync(outputPath, buffer);
  
  console.log('✅ 文件已下載到:', outputPath);
}

downloadTemplate().catch(console.error);
