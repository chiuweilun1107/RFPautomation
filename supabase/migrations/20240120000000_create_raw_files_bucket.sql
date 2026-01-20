-- Create the 'raw-files' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('raw-files', 'raw-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'raw-files');

-- Policy to allow public to view files (required for Office Web Viewer)
CREATE POLICY "Allow public to view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'raw-files');

-- Policy to allow authenticated users to delete their own files (optional but good)
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'raw-files');
