import { useState } from "react";
import { Home, Info, Mail, Menu, Package, ShoppingCart, Sparkles, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Link } from "@tanstack/react-router";

const NAV_ITEMS = [
  { id: "nav-pagina-inicial", to: "/", label: "Página Inicial", icon: Home, exact: true },
  { id: "nav-produtos", to: "/", label: "Produtos", icon: Package, hash: "catalogo" },
  { id: "nav-sobre-nos", to: "/about", label: "Sobre Nós", icon: Info },
  { id: "nav-contacto", to: "/contact", label: "Contacto", icon: Mail },
] as const;

export function Header(_props: { onOrder?: () => void } = {}) {
  const [open, setOpen] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground transition hover:border-primary hover:text-primary"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link id="nav-logo-polyset-store" to="/" className="flex items-center gap-2 group">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              POLYSET STORE
            </span>
          </Link>
          <button
            type="button"
            id="botao-carrinho"
            onClick={() => setCartOpen(true)}
            aria-label={`Abrir carrinho (${count} artigos)`}
            className="relative ml-auto grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground transition hover:border-primary hover:text-primary"
          >
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-success px-1 text-[10px] font-bold text-success-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-background shadow-2xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    id={item.id}
                    to={item.to}
                    hash={"hash" in item ? item.hash : undefined}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: !!("exact" in item && item.exact) }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground data-[status=active]:bg-gradient-primary data-[status=active]:text-primary-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border px-5 py-4 text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} POLYSET STORE
            </div>
          </aside>
        </div>
      )}
    </>
  );
}