import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Eye, Loader2, Package, Plus, Sparkles, X, ZoomIn } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { OrderModal } from "@/components/store/OrderModal";
import { useProductBySlug, incrementProductView } from "@/lib/products";
import { useOrderSettings, trackEvent } from "@/lib/use-store-data";
import { Reviews } from "@/components/store/Reviews";

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${decodeURIComponent(params.slug)} — POLYSET STORE` },
      { name: "description", content: "Detalhes do produto disponíveis na POLYSET STORE." },
    ],
  }),
  component: ProductDetail,
  errorComponent: ({ reset }) => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div>
        <p className="text-sm text-destructive">Erro ao carregar produto.</p>
        <button onClick={reset} className="mt-3 rounded-full border border-border px-4 py-2 text-xs">Tentar de novo</button>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div>
        <Package className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Produto não encontrado.</p>
        <Link to="/" className="mt-3 inline-block text-xs text-primary underline">Voltar para o catálogo</Link>
      </div>
    </div>
  ),
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useProductBySlug(slug);
  const { data: settings } = useOrderSettings();
  const [orderOpen, setOrderOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { add, setOpen: setCartOpen } = useCart();

  useEffect(() => {
    if (product) {
      incrementProductView(product.slug);
    }
  }, [product?.slug]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) throw notFound();

  const openOrder = () => {
    trackEvent("order_click");
    setOrderOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <Link
          to="/"
          id="link-voltar-inicio"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm transition hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para a Página Inicial
        </Link>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-3xl bg-muted shadow-[var(--shadow-soft)]">
              {product.image ? (
                <button
                  type="button"
                  onClick={() => setPreview(product.image)}
                  aria-label="Ampliar imagem"
                  className="group block w-full"
                >
                  <img src={product.image} alt={product.name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/85 px-3 py-1.5 text-[11px] font-medium text-foreground backdrop-blur">
                    <ZoomIn className="h-3.5 w-3.5" /> Pré-visualizar
                  </span>
                </button>
              ) : (
                <div className="grid aspect-square w-full place-items-center text-muted-foreground">
                  <Package className="h-16 w-16" />
                </div>
              )}
            </div>
            {product.gallery.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {product.gallery.slice(0, 8).map((g, i) => (
                  <button key={i} type="button" onClick={() => setPreview(g)} aria-label={`Ampliar imagem ${i + 1}`}>
                    <img
                      src={g}
                      alt={`${product.name} ${i + 1}`}
                      className="aspect-square w-full rounded-xl object-cover transition hover:opacity-80"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <span>{product.category}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                <Eye className="h-3 w-3" /> {product.view_count} visualizações
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{product.name}</h1>
            {product.short_description && (
              <p className="text-base text-muted-foreground">{product.short_description}</p>
            )}

            <div className="flex items-end gap-3">
              <span className="text-4xl font-semibold text-foreground">
                {product.price.toLocaleString()} <span className="text-lg text-muted-foreground">{product.currency}</span>
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="pb-2 text-sm text-muted-foreground line-through">
                  {product.original_price.toLocaleString()} {product.currency}
                </span>
              )}
            </div>

            {product.stock > 0 ? (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                <Sparkles className="h-3.5 w-3.5" /> Em stock — {product.stock} unidades
              </p>
            ) : (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Sem stock de momento
              </p>
            )}

            {product.benefits.length > 0 && (
              <ul className="space-y-2.5 pt-2">
                {product.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/90">
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-success/15 text-success">
                      <Check className="h-3 w-3" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {product.description && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="mb-2 text-sm font-semibold text-foreground">Descrição</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}

            <button
              type="button"
              id={`adicionar-ao-carrinho-${product.slug}`}
              disabled={product.stock === 0}
              onClick={() => {
                add(product);
                setCartOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-primary py-3.5 text-sm font-semibold uppercase tracking-wide text-primary transition hover:bg-primary/10 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Adicionar ao carrinho
            </button>

            <button
              onClick={openOrder}
              disabled={product.stock === 0}
              className="w-full rounded-full bg-gradient-primary py-4 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-[var(--shadow-lift)] transition hover:brightness-110 disabled:opacity-50"
            >
              Encomendar agora
            </button>
          </div>
        </div>
      </main>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Reviews productId={product.id} title={`Avaliações de ${product.name}`} subtitle="Comentários de quem já comprou este produto." compact />
      </div>

      <Footer brand="POLYSET STORE" />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)] backdrop-blur md:hidden">
        <button
          onClick={openOrder}
          disabled={product.stock === 0}
          className="w-full rounded-full bg-success py-3.5 text-sm font-semibold uppercase tracking-wide text-success-foreground shadow-lg disabled:opacity-50"
        >
          Encomendar agora
        </button>
      </div>

      <OrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        product={{
          name: product.name,
          price: product.price,
          currency: product.currency,
          whatsapp_number: product.whatsapp_number,
        }}
        settings={settings ?? null}
      />

      {preview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreview(null)}
        >
          <img src={preview} alt={product.name} className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
          <button
            type="button"
            onClick={() => setPreview(null)}
            aria-label="Fechar pré-visualização"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background text-foreground shadow"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}