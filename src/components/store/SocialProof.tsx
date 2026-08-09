import { useEffect, useState } from "react";
import { Eye, ShoppingBag } from "lucide-react";

export function SocialProof({ visitorCount, sales }: { visitorCount: number; sales: string[] }) {
  const [count, setCount] = useState(visitorCount);
  const [notif, setNotif] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setCount((c) => Math.max(20, c + (Math.random() > 0.5 ? 1 : -1)));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (sales.length === 0) return;
    let i = 0;
    const show = () => {
      setNotif(sales[i % sales.length]);
      i++;
      setTimeout(() => setNotif(null), 4000);
    };
    show();
    const t = setInterval(show, 9000);
    return () => clearInterval(t);
  }, [sales]);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <Eye className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{count}</span> pessoas a ver agora
        </div>
      </div>

      {notif && (
        <div className="fixed bottom-24 left-4 z-30 flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-[var(--shadow-lift)] backdrop-blur animate-in slide-in-from-left-4 fade-in md:bottom-6">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-success/15 text-success">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <p className="font-medium text-foreground">{notif}</p>
            <p className="text-muted-foreground">há poucos minutos</p>
          </div>
        </div>
      )}
    </>
  );
}