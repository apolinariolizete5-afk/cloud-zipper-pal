import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "./products";

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  whatsapp_number: string | null;
  quantity: number;
}

const STORAGE_KEY = "polyset:cart:v1";

interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  add: (p: Product, qty?: number) => void;
  setQuantity: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.id && typeof i.price === "number") : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items, hydrated]);

  const add = useCallback((p: Product, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === p.id);
      if (found) {
        return prev.map((i) => (i.id === p.id ? { ...i, quantity: Math.min(99, i.quantity + qty) } : i));
      }
      return [
        ...prev,
        {
          id: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price,
          currency: p.currency,
          image: p.image,
          whatsapp_number: p.whatsapp_number,
          quantity: Math.min(99, Math.max(1, qty)),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(99, qty) } : i)),
    );
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
    return { items, count, total, add, setQuantity, remove, clear, open, setOpen };
  }, [items, add, setQuantity, remove, clear, open]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
