import { Check, Sparkles } from "lucide-react";
import beforeAfter from "@/assets/before-after.jpg";
import type { SiteContent } from "@/lib/store-types";

export function Product({ content, onOrder }: { content: SiteContent; onOrder: () => void }) {
  const { product } = content;
  return (
    <section id="produto" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <div className="grid gap-12 md:grid-cols-2 md:items-start">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Antes & Depois</p>
          <div className="overflow-hidden rounded-3xl shadow-[var(--shadow-soft)]">
            <img src={product.beforeAfterImage || beforeAfter} alt="Antes e depois" loading="lazy" width={1408} height={912} className="w-full" />
          </div>
          <div className="flex justify-between px-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span>Antes</span>
            <span>Depois de 14 dias</span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{product.name}</h2>
          <p className="text-muted-foreground">{product.description}</p>

          <div className="flex items-end gap-3">
            <span className="text-4xl font-semibold text-foreground">
              {product.price.toLocaleString()} <span className="text-lg text-muted-foreground">{product.currency}</span>
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="pb-2 text-sm text-muted-foreground line-through">
                {product.originalPrice.toLocaleString()} {product.currency}
              </span>
            )}
          </div>

          <ul className="space-y-2.5">
            {product.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/90">
                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-success/15 text-success">
                  <Check className="h-3 w-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Ingredientes ativos
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {product.ingredients.map((ing, i) => (
                <div key={i} className="rounded-xl bg-muted/60 p-3">
                  <p className="text-sm font-medium text-foreground">{ing.name}</p>
                  <p className="text-xs text-muted-foreground">{ing.description}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOrder}
            className="w-full rounded-full bg-gradient-primary py-4 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-[var(--shadow-lift)] transition hover:brightness-110"
          >
            Encomendar agora
          </button>
        </div>
      </div>
    </section>
  );
}