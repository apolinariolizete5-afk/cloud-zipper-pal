import { Star } from "lucide-react";
import type { Testimonial } from "@/lib/store-types";

export function Testimonials({ items }: { items: Testimonial[] }) {
  return (
    <section className="bg-muted/40 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Depoimentos</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">O que dizem as nossas clientes</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <figure key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-3 flex gap-0.5 text-gold">
                {Array.from({ length: Math.max(0, Math.min(5, t.rating)) }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-foreground/90">"{t.text}"</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                {t.image ? (
                  <img src={t.image} alt={t.name} className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
                    {t.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">Cliente verificada</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}