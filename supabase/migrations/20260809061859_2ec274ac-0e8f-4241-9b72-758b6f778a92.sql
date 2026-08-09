-- 1. Ownership model for uploads
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.upload_files ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Public can create uploads" ON public.uploads;
DROP POLICY IF EXISTS "Public can read uploads" ON public.uploads;
DROP POLICY IF EXISTS "Public can create upload files" ON public.upload_files;
DROP POLICY IF EXISTS "Public can read upload files" ON public.upload_files;

REVOKE ALL ON public.uploads FROM anon;
REVOKE ALL ON public.upload_files FROM anon;
GRANT SELECT, DELETE ON public.uploads TO authenticated;
GRANT SELECT, DELETE ON public.upload_files TO authenticated;
GRANT ALL ON public.uploads TO service_role;
GRANT ALL ON public.upload_files TO service_role;

CREATE POLICY "Owners read their uploads" ON public.uploads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners delete their uploads" ON public.uploads
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners read their upload files" ON public.upload_files
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners delete their upload files" ON public.upload_files
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Storage: owner-scoped access to the private uploads bucket
DROP POLICY IF EXISTS "Public can read uploads bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload to uploads bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public read uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public insert uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload uploads" ON storage.objects;

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%uploads%' OR with_check ILIKE '%uploads%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Owners read own upload objects" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners write own upload objects" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete own upload objects" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Order settings no longer readable by anonymous visitors
DROP POLICY IF EXISTS "anyone reads settings" ON public.order_settings;
CREATE POLICY "authenticated reads settings" ON public.order_settings
  FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.order_settings FROM anon;
GRANT SELECT ON public.order_settings TO authenticated;
GRANT ALL ON public.order_settings TO service_role;

-- 4. Products: anonymous visitors never evaluate has_role
DROP POLICY IF EXISTS "anyone reads active products" ON public.products;
CREATE POLICY "anyone reads active products" ON public.products
  FOR SELECT TO anon USING (active = true);
CREATE POLICY "signed-in read active products" ON public.products
  FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.increment_product_view(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_product_view(text) TO service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;