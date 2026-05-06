
CREATE TABLE public.disease_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  owner_name text NOT NULL DEFAULT 'Anonymous',
  crop text NOT NULL,
  disease text NOT NULL,
  initial_severity text,
  initial_confidence numeric,
  initial_photo_url text,
  initial_summary text,
  initial_result jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disease_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view disease cases" ON public.disease_cases FOR SELECT USING (true);
CREATE POLICY "Anyone can create disease cases" ON public.disease_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update disease cases" ON public.disease_cases FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete disease cases" ON public.disease_cases FOR DELETE USING (true);

CREATE TRIGGER update_disease_cases_updated_at
BEFORE UPDATE ON public.disease_cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.disease_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.disease_cases(id) ON DELETE CASCADE,
  owner_id text NOT NULL,
  scheduled_date date NOT NULL,
  completed_at timestamptz,
  photo_url text,
  notes text,
  farmer_progress_rating text,
  ai_assessment jsonb,
  ai_summary text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disease_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view disease followups" ON public.disease_followups FOR SELECT USING (true);
CREATE POLICY "Anyone can create disease followups" ON public.disease_followups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update disease followups" ON public.disease_followups FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete disease followups" ON public.disease_followups FOR DELETE USING (true);

CREATE TRIGGER update_disease_followups_updated_at
BEFORE UPDATE ON public.disease_followups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_disease_followups_case ON public.disease_followups(case_id);
CREATE INDEX idx_disease_cases_owner ON public.disease_cases(owner_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('disease-photos', 'disease-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Disease photos are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'disease-photos');

CREATE POLICY "Anyone can upload disease photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'disease-photos');

CREATE POLICY "Anyone can update disease photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'disease-photos');

CREATE POLICY "Anyone can delete disease photos" ON storage.objects
FOR DELETE USING (bucket_id = 'disease-photos');
