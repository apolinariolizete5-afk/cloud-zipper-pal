-- 1) Reviews: public submissions must be pending moderation and validated
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
ALTER TABLE public.reviews ALTER COLUMN approved SET DEFAULT false;

CREATE POLICY "Public can submit pending reviews"
ON public.reviews FOR INSERT TO anon, authenticated
WITH CHECK (
  approved = false
  AND rating BETWEEN 1 AND 5
  AND char_length(btrim(author_name)) BETWEEN 2 AND 60
  AND char_length(btrim(comment)) BETWEEN 3 AND 1000
  AND product_id IS NOT NULL
);

-- 2) Analytics: no direct public inserts; only server-side (service_role)
DROP POLICY IF EXISTS "anyone logs events" ON public.analytics_events;
REVOKE INSERT ON public.analytics_events FROM anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;

-- 3) SECURITY DEFINER functions must not be directly callable from the API
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_product_view(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_product_view(text) TO service_role;