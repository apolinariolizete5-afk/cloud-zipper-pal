export type Ingredient = { name: string; description: string };
export type Testimonial = { name: string; rating: number; text: string; image?: string };
export type FAQ = { q: string; a: string; image?: string };
export type Benefit = { title: string; text: string; image?: string };

export const DEFAULT_BENEFITS: Benefit[] = [
  {
    title: "ENTREGAS RÁPIDAS",
    text: "Entregamos em Maputo em 2 a 4 horas e em todo o país por transportadora.",
  },
  {
    title: "PAGAMENTO NA ENTREGA",
    text: "Faça a encomenda e pague só quando o produto chegar à sua casa.",
  },
  {
    title: "ATENDIMENTO PELO WHATSAPP",
    text: "Fale connosco pelo 83 410 2205. Compra segura e acompanhada.",
  },
];

export interface SiteContent {
  brand: string;
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    stockAlert: string;
    stockCount: number;
    image?: string;
  };
  product: {
    name: string;
    price: number;
    currency: string;
    originalPrice?: number;
    description: string;
    benefits: string[];
    ingredients: Ingredient[];
    beforeAfterImage?: string;
  };
  testimonials: Testimonial[];
  faqs: FAQ[];
  benefitsCarousel?: Benefit[];
  visitorCount: number;
  recentSales: string[];
}

export interface OrderSettings {
  id: number;
  mode: "whatsapp";
  whatsapp_number: string;
  whatsapp_template: string;
}

export interface OrderFormData {
  quantity: number;
  province: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  schedule: string;
  confirmed: boolean;
}

export const PROVINCES = [
  "Maputo Cidade",
  "Maputo Província",
  "Gaza",
  "Inhambane",
  "Sofala",
  "Manica",
  "Tete",
  "Zambézia",
  "Nampula",
  "Cabo Delgado",
  "Niassa",
];