import { ArrowRight, Flame } from "lucide-react";
import heroImg from "@/assets/hero-product.jpg";
import type { SiteContent } from "@/lib/store-types";

export function Hero({ content, onOrder }: { content: SiteContent; onOrder: () => void }) {
  const stockText = content.hero.stockAlert.replace("{stock}", String(content.hero.stockCount));
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
            <Flame className="h-3.5 w-3.5" /> {stockText}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {content.hero.title}
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            {content.hero.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOrder}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-[var(--shadow-lift)] transition hover:brightness-110"
            >
              {content.hero.cta}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <a href="#produto" className="text-sm font-medium text-foreground/70 underline-offset-4 hover:underline">
              Saber mais
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-primary/10 blur-3xl" />
          <img
            src={content.hero.image || heroImg}
            alt="Sérum facial premium"
            width={1600}
            height={1200}
            className="mx-auto w-full max-w-md rounded-[2rem] object-cover shadow-[var(--shadow-lift)]"
          />
        </div>
      </div>
    </section>
  );
}