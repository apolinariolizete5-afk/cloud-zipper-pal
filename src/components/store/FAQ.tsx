import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FAQ as FAQType } from "@/lib/store-types";

export function FAQ({ items }: { items: FAQType[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">FAQ</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Perguntas frequentes</h2>
      </div>
      <div className="space-y-3">
        {items.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <span className="text-sm font-medium text-foreground">{f.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="space-y-3 px-5 pb-5">
                  {f.image && (
                    <img src={f.image} alt="" loading="lazy" className="w-full rounded-xl object-cover" />
                  )}
                  <div className="text-sm text-muted-foreground">{f.a}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}