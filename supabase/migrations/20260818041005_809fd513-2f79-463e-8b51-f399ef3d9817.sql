CREATE TYPE public.memory_version_source AS ENUM ('ai_adopted', 'manual_edit', 'restore');

CREATE TABLE public.account_memory_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  memory text NOT NULL DEFAULT '',
  source public.memory_version_source NOT NULL DEFAULT 'manual_edit',
  visit_id uuid REFERENCES public.visits(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX account_memory_versions_account_created_idx
  ON public.account_memory_versions (account_id, created_at DESC);

GRANT SELECT, INSERT ON public.account_memory_versions TO authenticated;
GRANT ALL ON public.account_memory_versions TO service_role;

ALTER TABLE public.account_memory_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin reads memory versions"
ON public.account_memory_versions FOR SELECT TO authenticated
USING ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner inserts memory versions"
ON public.account_memory_versions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);