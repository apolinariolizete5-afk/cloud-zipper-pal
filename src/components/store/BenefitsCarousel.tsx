import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import type { Benefit } from "@/lib/store-types";

export function BenefitsCarousel({ items }: { items: Benefit[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const total = items.length;

  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 5000);
    return () => clearInterval(t);
  }, [paused, total]);

  useEffect(() => {
    if (index > total - 1) setIndex(0);
  }, [total, index]);

  if (total === 0) return null;

  const go = (dir: number) => setIndex((i) => (i + dir + total) % total);

  return (
    <section id="beneficios" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <div
        className="overflow-hidden rounded-3xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => {
          setPaused(true);
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          touchX.current = null;
          setPaused(false);
          if (start == null) return;
          const dx = e.changedTouches[0].clientX - start;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((b, i) => (
            <article
              key={i}
              className="w-full shrink-0 px-1 sm:px-2"
              aria-hidden={i !== index}
            >
              <div className="flex h-full flex-col items-center gap-5 rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:flex-row sm:text-left">
                <div className="grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-2xl bg-muted">
                  {b.image ? (
                    <img
                      src={b.image}
                      alt={b.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShieldCheck className="h-12 w-12 text-primary" />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold uppercase tracking-wide text-foreground">
                    {b.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{b.text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Benefício anterior"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir para o benefício ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-2 bg-border"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próximo benefício"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}