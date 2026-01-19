-- Drop the authenticated-only upload policy
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

-- Allow public (anonymous) to upload to 'assets' bucket
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'assets' );

-- Ensure public access for reading is still there (idempotent)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'assets' );
