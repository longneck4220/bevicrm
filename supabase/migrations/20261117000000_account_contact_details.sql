-- Contact details for the Customers page. Plain nullable text columns only:
-- existing rows are untouched and the owner-scoped RLS policies on accounts
-- already cover new columns, so no policy change is needed.
alter table public.accounts
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists notes text;
