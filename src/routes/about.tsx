import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Sobre Nós — POLYSET STORE" },
      {
        name: "description",
        content:
          "Conheça a POLYSET STORE: quem somos, a nossa missão e o compromisso com os clientes em Moçambique.",
      },
      { property: "og:title", content: "Sobre Nós — POLYSET STORE" },
      {
        property: "og:description",
        content: "A história e missão da POLYSET STORE.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          Sobre Nós
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Quem somos
        </h1>
        <div className="prose prose-neutral mt-8 max-w-none text-sm leading-relaxed text-foreground/85">
          <p>
            A <strong>POLYSET STORE</strong> é uma loja online moçambicana
            dedicada a oferecer produtos de qualidade em várias categorias —
            eletrónica, casa, moda, beleza e muito mais — com um serviço
            próximo e entregas em todo o país.
          </p>
          <p>
            A nossa missão é simplificar as suas compras: um catálogo curado,
            preços justos e um atendimento humano via WhatsApp para tirar
            qualquer dúvida antes ou depois da encomenda.
          </p>
          <h2 className="mt-8 text-lg font-semibold text-foreground">
            O que nos move
          </h2>
          <ul>
            <li>Confiança — trabalhamos apenas com produtos que usaríamos.</li>
            <li>Rapidez — respondemos em minutos e entregamos em dias.</li>
            <li>Proximidade — falamos a sua língua, no seu ritmo.</li>
          </ul>
        </div>
      </main>
      <Footer brand="POLYSET STORE" />
    </div>
  );
}