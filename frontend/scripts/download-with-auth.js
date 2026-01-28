const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function downloadTemplate() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    console.error('需要 SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  const filePath = 'documents/8d355ef1-91b3-4cc5-8ceb-1e76cd776c86_1769386806979.docx';
  
  console.log('📥 正在下載:', filePath);
  
  const { data, error } = await supabase.storage
    .from('raw-files')
    .download(filePath);

  if (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
  
  const buffer = Buffer.from(await data.arrayBuffer());
  const outputPath = path.join(__dirname, '../../原始範本_00_目錄.docx');
  fs.writeFileSync(outputPath, buffer);
  
  console.log('✅ 已下載到:', outputPath);
  console.log('📦 文件大小:', (buffer.length / 1024).toFixed(2), 'KB');
}

downloadTemplate().catch(console.error);
