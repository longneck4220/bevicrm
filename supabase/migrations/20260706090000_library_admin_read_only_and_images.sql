-- Add image files to the library while keeping each user's uploads isolated.
alter type public.library_file_type add value if not exists 'image';

-- Admins may inspect uploaded library records, but only the owner can modify or delete them.
drop policy if exists "Owner or admin updates library files" on public.library_files;
drop policy if exists "Owner or admin deletes library files" on public.library_files;

drop policy if exists "Owner updates library files" on public.library_files;
create policy "Owner updates library files"
  on public.library_files for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owner deletes library files" on public.library_files;
create policy "Owner deletes library files"
  on public.library_files for delete to authenticated
  using (auth.uid() = owner_id);

-- Bucket stays private. Admins can read objects for support/audit, but cannot update/delete them.
drop policy if exists "Admin reads library objects" on storage.objects;
create policy "Admin reads library objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'library' and public.has_role(auth.uid(), 'admin'::public.app_role));
