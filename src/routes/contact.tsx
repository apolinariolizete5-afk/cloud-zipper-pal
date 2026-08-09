import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { Contact } from "@/components/store/Contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contacto — POLYSET STORE" },
      {
        name: "description",
        content:
          "Fale com a POLYSET STORE por WhatsApp ou e-mail. Estamos disponíveis para tirar dúvidas e apoiar as suas encomendas.",
      },
      { property: "og:title", content: "Contacto — POLYSET STORE" },
      {
        property: "og:description",
        content: "WhatsApp e e-mail da POLYSET STORE.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Contact />
      <Footer brand="POLYSET STORE" />
    </div>
  );
}