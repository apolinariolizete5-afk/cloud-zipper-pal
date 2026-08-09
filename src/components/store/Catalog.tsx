import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Package, Plus, Search, Star, X } from "lucide-react";
import { useProducts, type Product } from "@/lib/products";
import { useCategories } from "@/lib/categories";
import { useCart } from "@/lib/cart";

export function Catalog() {
  const { data, isLoading } = useProducts({ activeOnly: true });
  const { data: cats } = useCategories({ activeOnly: true });
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("Todos");

  const categories = useMemo(() => {
    const managed = (cats ?? []).map((c) => c.name);
    if (managed.length > 0) return ["Todos", ...managed];
    const set = new Set((data ?? []).map((p) => p.category).filter(Boolean));
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b, "pt"))];
  }, [data, cats]);

  const featured = useMemo(() => (data ?? []).filter((p) => p.featured), [data]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? [])
      .filter((p) => category === "Todos" || p.category === category)
      .filter(
        (p) =>
          !term ||
          [p.name, p.category, p.short_description, p.description, p.slug]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(term)),
      );
  }, [data, q, category]);

  return (
    <section id="catalogo" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <div className="mb-10 flex flex-col gap-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Catálogo</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Todos os nossos produtos
        </h2>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          Escolha o que procura. Entregas em todo Moçambique.
        </p>
      </div>

      <div className="mx-auto mb-8 max-w-md">
        <label htmlFor="catalogo-pesquisa" className="sr-only">
          Pesquisar produtos
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="catalogo-pesquisa"
            name="catalogo-pesquisa"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar produto ou categoria…"
            className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-10 text-sm shadow-sm outline-none transition focus:border-primary"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Limpar pesquisa"
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {q && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {visible.length} resultado{visible.length === 1 ? "" : "s"} para “{q}”
          </p>
        )}
      </div>

      {categories.length > 2 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              id={`filtro-categoria-${c.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                category === c
                  ? "border-transparent bg-gradient-primary text-primary-foreground"
                  : "border-border bg-card text-foreground/80 hover:border-primary hover:text-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {featured.length > 0 && !q && category === "Todos" && (
        <div className="mb-12">
          <p className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            <Star className="h-3.5 w-3.5 fill-current" /> Em destaque
          </p>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {featured.slice(0, 4).map((p) => (
              <ProductCard key={p.id} p={p} idPrefix="destaque" />
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted/60" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">
            {(data ?? []).length === 0 ? "Ainda sem produtos publicados." : "Nenhum produto encontrado."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {(data ?? []).length === 0
              ? "Volte em breve — estamos a preparar novidades."
              : "Tente outra palavra ou limpe a pesquisa."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {visible.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </section>
  );
}
function ProductCard({ p, idPrefix = "produto" }: { p: Product; idPrefix?: string }) {
  const { add, setOpen } = useCart();
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <Link
        id={`${idPrefix}-${p.slug}`}
        aria-label={p.name}
        to="/products/$slug"
        params={{ slug: p.slug }}
        className="flex flex-1 flex-col"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {p.image ? (
            <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <Package className="h-10 w-10" />
            </div>
          )}
          {p.original_price && p.original_price > p.price && (
            <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive-foreground">
              Promo
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{p.category}</p>
          <h3 className="text-base font-semibold text-foreground line-clamp-2">{p.name}</h3>
          {p.short_description && <p className="text-xs text-muted-foreground line-clamp-2">{p.short_description}</p>}
          <div className="mt-auto pt-3">
            <p className="text-lg font-semibold text-foreground">
              {p.price.toLocaleString()} <span className="text-xs text-muted-foreground">{p.currency}</span>
            </p>
            {p.original_price && p.original_price > p.price && (
              <p className="text-[11px] text-muted-foreground line-through">
                {p.original_price.toLocaleString()} {p.currency}
              </p>
            )}
          </div>
        </div>
      </Link>
      <div className="px-5 pb-5">
        <button
          type="button"
          id={`adicionar-${p.slug}`}
          disabled={p.stock === 0}
          onClick={() => {
            add(p);
            setOpen(true);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> {p.stock === 0 ? "Sem stock" : "Adicionar"}
        </button>
      </div>
    </div>
  );
}
