export function StickyCTA({ onOrder, stock }: { onOrder: () => void; stock: number }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)] backdrop-blur md:hidden">
      <button
        onClick={onOrder}
        className="w-full rounded-full bg-success py-3.5 text-sm font-semibold uppercase tracking-wide text-success-foreground shadow-lg transition active:scale-[0.99]"
      >
        Encomendar agora
      </button>
      <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
        ⚡ Stock limitado — restam {stock} unidades
      </p>
    </div>
  );
}