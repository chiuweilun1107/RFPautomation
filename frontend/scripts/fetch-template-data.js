/**
 * 從 Supabase 獲取特定範本的完整資料
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fetchTemplateData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 環境變數');
    console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const templateId = '8d355ef1-91b3-4cc5-8ceb-1e76cd776c86';

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    console.error('❌ 查詢錯誤:', error);
    process.exit(1);
  }

  if (!data) {
    console.error('❌ 找不到範本');
    process.exit(1);
  }

  console.log('✅ 範本資料：');
  console.log('ID:', data.id);
  console.log('名稱:', data.name);
  console.log('描述:', data.description);
  console.log('檔案路徑:', data.file_path);
  console.log('');
  console.log('📋 結構資訊：');
  console.log('段落數量:', data.paragraphs?.length || 0);
  console.log('表格數量:', data.parsed_tables?.length || 0);
  console.log('頁首頁腳:', data.headers_footers ? '有' : '無');
  console.log('');

  if (data.headers_footers && data.headers_footers.length > 0) {
    console.log('📄 頁首頁腳詳細資訊：');
    console.log(JSON.stringify(data.headers_footers, null, 2));
  }

  // 儲存完整資料到文件
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, 'template-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log('');
  console.log('💾 完整資料已儲存到:', outputPath);
}

fetchTemplateData().catch(console.error);
