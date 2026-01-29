-- 創建 AI 偏好設置資料表
CREATE TABLE IF NOT EXISTS public.ai_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  source_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 確保每個用戶只有一筆偏好設置
  UNIQUE(user_id)
);

-- 建立索引加速查詢
CREATE INDEX IF NOT EXISTS idx_ai_preferences_user_id ON public.ai_preferences(user_id);

-- 啟用 RLS
ALTER TABLE public.ai_preferences ENABLE ROW LEVEL SECURITY;

-- 用戶只能讀寫自己的偏好
CREATE POLICY "Users can read own preferences"
  ON public.ai_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.ai_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.ai_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_ai_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_preferences_updated_at
  BEFORE UPDATE ON public.ai_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_preferences_updated_at();

-- 註解
COMMENT ON TABLE public.ai_preferences IS 'AI 專案和文件選擇偏好設置';
COMMENT ON COLUMN public.ai_preferences.user_id IS '用戶 ID';
COMMENT ON COLUMN public.ai_preferences.project_id IS '選中的專案 ID';
COMMENT ON COLUMN public.ai_preferences.source_ids IS '選中的文件 ID 陣列';
