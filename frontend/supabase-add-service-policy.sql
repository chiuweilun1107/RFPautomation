-- 允許 service role 查詢所有偏好設置（用於 AI proxy）
-- 這樣後端可以在沒有用戶 session 的情況下查詢偏好

-- 刪除舊的限制性政策（如果需要的話可以保留）
-- DROP POLICY IF EXISTS "Users can read own preferences" ON public.ai_preferences;

-- 添加新的政策：允許讀取任何偏好（用於 AI proxy 查詢）
CREATE POLICY "Allow read for AI proxy"
  ON public.ai_preferences
  FOR SELECT
  USING (true);

-- 註解
COMMENT ON POLICY "Allow read for AI proxy" ON public.ai_preferences 
IS '允許 AI proxy 讀取偏好設置，以便在跨域請求時也能獲取用戶設置';
