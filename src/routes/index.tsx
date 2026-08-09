import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/store/Header";
import { Catalog } from "@/components/store/Catalog";
import { BenefitsCarousel } from "@/components/store/BenefitsCarousel";
import { Testimonials } from "@/components/store/Testimonials";
import { FAQ } from "@/components/store/FAQ";
import { Contact } from "@/components/store/Contact";
import { Footer } from "@/components/store/Footer";
import { useSiteContent, trackEvent } from "@/lib/use-store-data";
import { DEFAULT_BENEFITS } from "@/lib/store-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "POLYSET STORE — Loja online em Moçambique" },
      {
        name: "description",
        content:
          "Catálogo de produtos POLYSET STORE. Entrega em todo Moçambique via WhatsApp.",
      },
      { property: "og:title", content: "POLYSET STORE" },
      { property: "og:description", content: "Catálogo de produtos POLYSET STORE." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: content } = useSiteContent();

  useEffect(() => {
    trackEvent("page_view");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Catalog />
      <BenefitsCarousel items={content?.benefitsCarousel ?? DEFAULT_BENEFITS} />
      {content && content.testimonials?.length > 0 && <Testimonials items={content.testimonials} />}
      {content && content.faqs?.length > 0 && <FAQ items={content.faqs} />}
      <Contact />
      <Footer brand="POLYSET STORE" />
    </div>
  );
}
