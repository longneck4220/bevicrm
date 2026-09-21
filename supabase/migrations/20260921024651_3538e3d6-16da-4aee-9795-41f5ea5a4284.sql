ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS suburb text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS memory_draft text;

CREATE TABLE IF NOT EXISTS public.call_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  rep_name text not null default '',
  call_date date not null,
  raw_note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_notes TO authenticated;
GRANT ALL ON public.call_notes TO service_role;

ALTER TABLE public.call_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner inserts call notes" ON public.call_notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner or admin reads call notes" ON public.call_notes
  FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin updates call notes" ON public.call_notes
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin deletes call notes" ON public.call_notes
  FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS call_notes_account_id_idx ON public.call_notes(account_id);
CREATE TRIGGER trg_call_notes_updated_at BEFORE UPDATE ON public.call_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();