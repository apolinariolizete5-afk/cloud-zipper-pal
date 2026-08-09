CREATE TABLE public.uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename text NOT NULL,
  size_bytes bigint NOT NULL,
  file_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.uploads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uploads TO authenticated;
GRANT ALL ON public.uploads TO service_role;

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read uploads" ON public.uploads
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can create uploads" ON public.uploads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.upload_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id uuid NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
  path text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  storage_path text NOT NULL,
  preview_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.upload_files TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.upload_files TO authenticated;
GRANT ALL ON public.upload_files TO service_role;

ALTER TABLE public.upload_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read upload files" ON public.upload_files
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can create upload files" ON public.upload_files
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Storage object policies for the uploads bucket
CREATE POLICY "Public can read upload objects" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'uploads');
CREATE POLICY "Public can upload upload objects" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'uploads');