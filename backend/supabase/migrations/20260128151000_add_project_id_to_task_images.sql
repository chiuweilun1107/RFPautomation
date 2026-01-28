-- Add project_id to task_images
ALTER TABLE public.task_images 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Backfill project_id from tasks table
UPDATE public.task_images ti
SET project_id = t.project_id
FROM public.tasks t
WHERE ti.task_id = t.id
AND ti.project_id IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_task_images_project_id ON public.task_images(project_id);
