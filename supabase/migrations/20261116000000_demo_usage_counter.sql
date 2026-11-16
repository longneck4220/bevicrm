-- Per-visitor daily counter for the public /try demo, which calls the paid AI
-- without a login. The key is a sha256 hash of client IP + day, never the raw IP.
-- Disposable counter data: not part of the offsite backup.
CREATE TABLE public.demo_usage (
  key text NOT NULL,
  day date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, day)
);

-- RLS on with no policies: only the service role (which bypasses RLS) can touch it.
ALTER TABLE public.demo_usage ENABLE ROW LEVEL SECURITY;

-- Atomically adds one to the visitor's count for the day and returns the new total.
CREATE OR REPLACE FUNCTION public.increment_demo_usage(p_key text, p_day date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO public.demo_usage (key, day, count)
  VALUES (p_key, p_day, 1)
  ON CONFLICT (key, day) DO UPDATE SET count = public.demo_usage.count + 1
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_demo_usage(text, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_demo_usage(text, date) TO service_role;
