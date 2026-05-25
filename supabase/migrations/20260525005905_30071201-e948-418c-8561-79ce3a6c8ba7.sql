
-- file type enum
do $$ begin
  create type public.library_file_type as enum ('pdf','xlsx','pptx','docx','other');
exception when duplicate_object then null; end $$;

create table if not exists public.library_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  account_id uuid references public.accounts(id) on delete set null,
  name text not null,
  file_type public.library_file_type not null,
  storage_path text not null,
  size_bytes bigint not null default 0,
  mime_type text not null default '',
  extracted_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.library_files enable row level security;

create policy "Owner or admin reads library files"
  on public.library_files for select to authenticated
  using ((auth.uid() = owner_id) or has_role(auth.uid(), 'admin'::app_role));

create policy "Owner inserts library files"
  on public.library_files for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "Owner or admin updates library files"
  on public.library_files for update to authenticated
  using ((auth.uid() = owner_id) or has_role(auth.uid(), 'admin'::app_role))
  with check ((auth.uid() = owner_id) or has_role(auth.uid(), 'admin'::app_role));

create policy "Owner or admin deletes library files"
  on public.library_files for delete to authenticated
  using ((auth.uid() = owner_id) or has_role(auth.uid(), 'admin'::app_role));

create index if not exists library_files_owner_idx on public.library_files(owner_id, created_at desc);
create index if not exists library_files_account_idx on public.library_files(account_id);
create index if not exists library_files_type_idx on public.library_files(file_type);

drop trigger if exists trg_library_files_updated_at on public.library_files;
create trigger trg_library_files_updated_at
  before update on public.library_files
  for each row execute function public.set_updated_at();

-- storage bucket
insert into storage.buckets (id, name, public)
values ('library','library', false)
on conflict (id) do nothing;

-- storage policies: files keyed by {owner_id}/...
create policy "Owner reads library objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'library' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Owner uploads library objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'library' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Owner updates library objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'library' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Owner deletes library objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'library' and auth.uid()::text = (storage.foldername(name))[1]);
