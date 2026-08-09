
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

-- Site content (single row)
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

-- Order settings (single row)
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

-- Analytics events
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone logs events" ON public.analytics_events FOR INSERT WITH CHECK (event_type IN ('page_view', 'order_click', 'order_submit'));
CREATE POLICY "admin reads events" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX analytics_events_type_created_idx ON public.analytics_events (event_type, created_at DESC);

-- Seed content
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
