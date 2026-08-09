import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Package, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useOrderSettings, trackEvent } from "@/lib/use-store-data";
import { CheckoutModal } from "./CheckoutModal";

export function CartSheet() {
  const { items, count, total, setQuantity, remove, open, setOpen } = useCart();
  const { data: settings } = useOrderSettings();
  const [checkout, setCheckout] = useState(false);
  const currency = items[0]?.currency ?? "MT";

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrinho">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-96 max-w-[90vw] flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
                <ShoppingCart className="h-4 w-4" /> Carrinho ({count})
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar carrinho"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                <Package className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">O carrinho está vazio.</p>
                <p className="text-xs text-muted-foreground">Adicione produtos do catálogo para encomendar tudo de uma vez.</p>
              </div>
            ) : (
              <ul className="flex-1 space-y-3 overflow-y-auto p-4">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                    <Link to="/products/$slug" params={{ slug: i.slug }} onClick={() => setOpen(false)} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {i.image ? (
                        <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-muted-foreground"><Package className="h-5 w-5" /></span>
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium text-foreground">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.price.toLocaleString()} {i.currency}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1.5">
                          <button type="button" aria-label="Diminuir" onClick={() => setQuantity(i.id, i.quantity - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-border">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                          <button type="button" aria-label="Aumentar" onClick={() => setQuantity(i.id, i.quantity + 1)} className="grid h-7 w-7 place-items-center rounded-full border border-border">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button type="button" aria-label="Remover" onClick={() => remove(i.id)} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Total</span>
                <span className="text-lg font-semibold text-foreground">
                  {total.toLocaleString()} {currency}
                </span>
              </div>
              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => {
                  trackEvent("order_click");
                  setOpen(false);
                  setCheckout(true);
                }}
                className="w-full rounded-full bg-success py-3 text-sm font-semibold uppercase tracking-wide text-success-foreground transition hover:brightness-110 disabled:opacity-50"
              >
                Encomendar pelo WhatsApp
              </button>
            </div>
          </aside>
        </div>
      )}

      <CheckoutModal open={checkout} onClose={() => setCheckout(false)} settings={settings ?? null} />
    </>
  );
}
