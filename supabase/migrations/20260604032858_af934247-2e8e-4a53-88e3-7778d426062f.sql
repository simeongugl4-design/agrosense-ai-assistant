
CREATE TABLE public.safety_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  owner_name text NOT NULL DEFAULT 'Anonymous',
  product text NOT NULL,
  product_key text NOT NULL,
  active_ingredient text,
  dosage text,
  crop text,
  growth_stage text,
  application_method text,
  overall_risk text,
  safe_to_proceed boolean,
  tank_mix_verdict text,
  summary text,
  version integer NOT NULL DEFAULT 1,
  inputs jsonb NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_plans TO anon, authenticated;
GRANT ALL ON public.safety_plans TO service_role;

ALTER TABLE public.safety_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view safety plans" ON public.safety_plans FOR SELECT USING (true);
CREATE POLICY "Anyone can create safety plans" ON public.safety_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update safety plans" ON public.safety_plans FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete safety plans" ON public.safety_plans FOR DELETE USING (true);

CREATE INDEX safety_plans_owner_product_idx ON public.safety_plans (owner_id, product_key, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_safety_plan_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.version IS NULL OR NEW.version = 1 THEN
    SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version
    FROM public.safety_plans
    WHERE owner_id = NEW.owner_id AND product_key = NEW.product_key;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_safety_plan_version
BEFORE INSERT ON public.safety_plans
FOR EACH ROW EXECUTE FUNCTION public.set_safety_plan_version();

CREATE TRIGGER trg_safety_plans_updated_at
BEFORE UPDATE ON public.safety_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
