CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admin inserts categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin updates categories" ON public.categories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin deletes categories" ON public.categories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE UNIQUE INDEX categories_slug_key ON public.categories (slug);
CREATE UNIQUE INDEX categories_name_norm_key ON public.categories (lower(btrim(name)));

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.products SET category = btrim(category);

INSERT INTO public.categories (name, slug, sort_order)
SELECT DISTINCT ON (lower(btrim(p.category)))
  btrim(p.category),
  regexp_replace(lower(translate(btrim(p.category), 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')), '[^a-z0-9]+', '-', 'g'),
  0
FROM public.products p
WHERE btrim(p.category) <> ''
ORDER BY lower(btrim(p.category)), btrim(p.category);
