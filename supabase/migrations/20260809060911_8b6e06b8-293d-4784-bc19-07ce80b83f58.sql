-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE public.site_content (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT UPDATE, INSERT ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "admin can update content" ON public.site_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin can insert content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mode text NOT NULL DEFAULT 'whatsapp' CHECK (mode IN ('whatsapp', 'external')),
  whatsapp_number text NOT NULL DEFAULT '258840000000',
  whatsapp_template text NOT NULL DEFAULT 'Olá! Gostaria de encomendar:%0A%0AProduto: {product}%0AQuantidade: {quantity}%0ATotal: {total} MT%0A%0ANome: {name}%0ATelefone: {phone}%0AWhatsApp: {whatsapp}%0ALocalidade: {province}%0AEndereço: {address}%0AHorário: {schedule}',
  external_url text NOT NULL DEFAULT 'https://example.com',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_settings TO anon, authenticated;
GRANT UPDATE, INSERT ON public.order_settings TO authenticated;
GRANT ALL ON public.order_settings TO service_role;
ALTER TABLE public.order_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads settings" ON public.order_settings FOR SELECT USING (true);
CREATE POLICY "admin updates settings" ON public.order_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin inserts settings" ON public.order_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin reads events" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX analytics_events_type_created_idx ON public.analytics_events (event_type, created_at DESC);

INSERT INTO public.site_content (id, data) VALUES (1, '{
  "brand": "Polyset Store",
  "hero": {
    "title": "Sua pele merece o melhor",
    "subtitle": "Descubra o sérum facial revolucionário com Ouro 24K e Niacinamida que transforma a sua pele em apenas 14 dias.",
    "cta": "VER PRODUTOS",
    "stockAlert": "Restam apenas {stock} unidades em stock",
    "stockCount": 27
  },
  "product": {
    "name": "Sérum Facial Ouro 24K",
    "price": 1490,
    "currency": "MT",
    "originalPrice": 2490,
    "description": "Fórmula premium enriquecida com Ouro 24K e Niacinamida para uma pele radiante, firme e uniforme.",
    "benefits": [
      "Reduz manchas e uniformiza o tom da pele",
      "Combate rugas e linhas de expressão",
      "Hidratação profunda por 24h",
      "Efeito lifting imediato",
      "Adequado para todos os tipos de pele"
    ],
    "ingredients": [
      {"name": "Ouro 24K", "description": "Estimula a renovação celular e ilumina a pele"},
      {"name": "Niacinamida 10%", "description": "Reduz poros e uniformiza o tom"},
      {"name": "Ácido Hialurónico", "description": "Hidratação intensa e efeito preenchedor"},
      {"name": "Vitamina C", "description": "Antioxidante que combate os sinais do tempo"}
    ]
  },
  "testimonials": [
    {"name": "Maria Sitoe", "rating": 5, "text": "Uso há 3 semanas e a diferença é impressionante. Minhas manchas quase desapareceram!", "image": ""},
    {"name": "Ana Machava", "rating": 5, "text": "Melhor investimento que fiz. A minha pele nunca esteve tão radiante e hidratada.", "image": ""},
    {"name": "Sofia Nhantumbo", "rating": 5, "text": "Recebi elogios de todos! Vale cada metical. Já é meu queridinho.", "image": ""}
  ],
  "faqs": [
    {"q": "Em quanto tempo vejo resultados?", "a": "Os primeiros resultados aparecem em 7-14 dias de uso contínuo, com resultados completos em 30 dias."},
    {"q": "É seguro para pele sensível?", "a": "Sim, a fórmula é dermatologicamente testada e adequada para todos os tipos de pele."},
    {"q": "Como é feita a entrega?", "a": "Entregamos em todas as províncias de Moçambique em 24-72h após confirmação do pedido."},
    {"q": "Posso pagar na entrega?", "a": "Sim! Aceitamos pagamento na entrega em todas as principais cidades."}
  ],
  "visitorCount": 87,
  "recentSales": [
    "Maria de Maputo acabou de comprar",
    "Ana da Beira acabou de comprar",
    "Sofia de Nampula acabou de comprar",
    "Isabel de Matola acabou de comprar"
  ]
}'::jsonb);

INSERT INTO public.order_settings (id) VALUES (1);

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'MT',
  category TEXT NOT NULL DEFAULT 'Geral',
  image TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  whatsapp_number TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads active products" ON public.products FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin inserts products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin updates products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin deletes products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_product_view(_slug TEXT)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.products SET view_count = view_count + 1 WHERE slug = _slug AND active = true;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 2 AND 80),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(comment) BETWEEN 3 AND 1000),
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reviews_product_id_idx ON public.reviews(product_id);
CREATE INDEX reviews_created_at_idx ON public.reviews(created_at DESC);

GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (approved = true);
CREATE POLICY "Admins can view all reviews" ON public.reviews FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can submit pending reviews" ON public.reviews FOR INSERT TO anon, authenticated
WITH CHECK (
  approved = false
  AND rating BETWEEN 1 AND 5
  AND char_length(btrim(author_name)) BETWEEN 2 AND 60
  AND char_length(btrim(comment)) BETWEEN 3 AND 1000
);
CREATE POLICY "Admins can update reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

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
CREATE POLICY "admin inserts categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin updates categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin deletes categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX categories_slug_key ON public.categories (slug);
CREATE UNIQUE INDEX categories_name_norm_key ON public.categories (lower(btrim(name)));

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_product_view(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_product_view(text) TO service_role;