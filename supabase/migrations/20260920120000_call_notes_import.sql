-- Admin CSV import of historical call notes.
-- Extends the existing accounts table (does not replace or duplicate it).
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS suburb text;

-- Raw, unprocessed historical notes bulk-loaded by an admin. Deliberately
-- separate from public.visits (AI-processed, rep-logged in the app) so an
-- import never fabricates AI intelligence for a visit that never happened
-- through the product.
CREATE TABLE public.call_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  rep_name text NOT NULL,
  call_date date NOT NULL,
  raw_note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX call_notes_account_idx ON public.call_notes(account_id, call_date DESC);
CREATE INDEX call_notes_owner_idx ON public.call_notes(owner_id, created_at DESC);

ALTER TABLE public.call_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin reads call notes"
ON public.call_notes FOR SELECT TO authenticated
USING ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner or admin inserts call notes"
ON public.call_notes FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner or admin updates call notes"
ON public.call_notes FOR UPDATE TO authenticated
USING ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner or admin deletes call notes"
ON public.call_notes FOR DELETE TO authenticated
USING ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));
