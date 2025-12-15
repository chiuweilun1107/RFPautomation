-- Create a new private bucket 'rfp_docs'
insert into storage.buckets (id, name, public)
values ('rfp_docs', 'rfp_docs', false);

-- Policy: Allow authenticated users to upload files
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'rfp_docs' );

-- Policy: Allow users to view their own files (based on owner_id path convention or just authenticated for now)
-- For simplicity in MVP, allowing authenticated users to read files in this bucket
-- In production, we should restrict path access like: (storage.foldername(name))[1] = auth.uid()::text
create policy "Allow authenticated downloads"
on storage.objects for select
to authenticated
using ( bucket_id = 'rfp_docs' );
