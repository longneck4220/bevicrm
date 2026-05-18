
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  memory text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  raw_note text not null,
  supporting_context text not null default '',
  ai_output jsonb,
  rating text check (rating in ('good','needs_edit')),
  created_at timestamptz not null default now()
);

create index visits_account_idx on public.visits(account_id, created_at desc);

alter table public.accounts enable row level security;
alter table public.visits enable row level security;

create policy "trial open accounts" on public.accounts for all using (true) with check (true);
create policy "trial open visits" on public.visits for all using (true) with check (true);

-- Seed Surfers Pavilion for the documented test run
insert into public.accounts (name, contact, memory) values (
  'Surfers Pavilion',
  'Tom',
  'Busy venue. Volume-driven. Staffing stretched. Not interested in complex cocktail execution.
Tom is practical and direct. Likes ideas that make weekend trade easier, not more complicated.
Previous chat suggested tequila is moving but margin needs proof.'
);
