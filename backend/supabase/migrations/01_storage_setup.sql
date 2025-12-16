-- Create Storage Bucket for Raw Files
insert into storage.buckets (id, name, public)
values ('raw-files', 'raw-files', true)
on conflict (id) do nothing;

-- Security Policies for Storage
create policy "Give users access to own folder 1u1h1_0" on storage.objects
  for select
  to public
  using (bucket_id = 'raw-files');

create policy "Give users access to own folder 1u1h1_1" on storage.objects
  for insert
  to public
  with check (bucket_id = 'raw-files');

create policy "Give users access to own folder 1u1h1_2" on storage.objects
  for update
  to public
  using (bucket_id = 'raw-files');

create policy "Give users access to own folder 1u1h1_3" on storage.objects
  for delete
  to public
  using (bucket_id = 'raw-files');
