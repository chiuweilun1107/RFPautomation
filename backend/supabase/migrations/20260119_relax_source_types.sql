-- Remove the restrictive type check constraint
ALTER TABLE public.sources DROP CONSTRAINT IF EXISTS sources_type_check;

-- Optional: If you want to enforce specific types in the future, you can add a new constraint with more allowed values.
-- For now, dropping it allows all file extensions sent by the frontend (doc, xlsx, ppt, png, etc.)
