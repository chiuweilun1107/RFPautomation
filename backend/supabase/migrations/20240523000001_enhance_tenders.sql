-- Add status and deadline_date columns to tenders table
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '招標中';
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS deadline_date TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN public.tenders.status IS '標案狀態：招標中、已撤案、已廢標、已決標等';
COMMENT ON COLUMN public.tenders.deadline_date IS '投標截止日期';
