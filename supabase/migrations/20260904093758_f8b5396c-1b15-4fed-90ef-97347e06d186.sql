ALTER TABLE public.groceries ADD COLUMN IF NOT EXISTS owner_key text;

UPDATE public.groceries SET owner_key = 'legacy-demo' WHERE owner_key IS NULL;

ALTER TABLE public.groceries ALTER COLUMN owner_key SET NOT NULL;

CREATE INDEX IF NOT EXISTS groceries_owner_key_idx ON public.groceries (owner_key);

DROP POLICY IF EXISTS "public demo access to groceries" ON public.groceries;

ALTER TABLE public.groceries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.groceries FROM anon;
REVOKE ALL ON public.groceries FROM authenticated;
GRANT ALL ON public.groceries TO service_role;

DROP POLICY IF EXISTS "public demo access to recipes" ON public.recipes;

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes are publicly readable"
  ON public.recipes
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON public.recipes FROM anon;
REVOKE ALL ON public.recipes FROM authenticated;
GRANT SELECT ON public.recipes TO anon;
GRANT SELECT ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;