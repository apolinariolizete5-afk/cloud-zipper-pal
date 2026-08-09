DROP POLICY IF EXISTS "Public can submit pending reviews" ON public.reviews;
CREATE POLICY "Public can submit pending reviews"
ON public.reviews FOR INSERT TO anon, authenticated
WITH CHECK (
  approved = false
  AND rating BETWEEN 1 AND 5
  AND char_length(btrim(author_name)) BETWEEN 2 AND 60
  AND char_length(btrim(comment)) BETWEEN 3 AND 1000
);