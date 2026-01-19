-- 直球對決：直接修改資料庫約束，允許更多採購相關的檔案格式
-- Drop old constraint
ALTER TABLE public.sources DROP CONSTRAINT IF EXISTS sources_type_check;

-- Add new constraint with all supported types
ALTER TABLE public.sources 
ADD CONSTRAINT sources_type_check 
CHECK (type IN (
  'markdown', 
  'pdf', 
  'docx', 'doc', 
  'xlsx', 'xls', 'csv', 
  'txt', 'text',
  'png', 'jpg', 'jpeg', 'webp', 
  'web_crawl', 'web', 'url',
  'unknown'
));
