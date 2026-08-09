import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SiteContent, Testimonial } from "@/lib/store-types";
import { ImageUploader } from "./ImageUploader";

export function TestimonialsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content" as never).select("data").eq("id", 1).single();
      if (error) throw error;
      return (data as { data: SiteContent }).data;
    },
  });

  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (data) setItems(structuredClone(data.testimonials ?? []));
  }, [data]);

  if (isLoading || !items || !data) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;

  const update = (i: number, patch: Partial<Testimonial>) =>
    setItems((list) => (list ?? []).map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const move = (i: number, dir: number) =>
    setItems((list) => {
      const next = [...(list ?? [])];
      const j = i + dir;
      if (j < 0 || j >= next.length) return next;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = async () => {
    setSaving(true);
    setOk(false);
    setErr(null);
    const payload: SiteContent = { ...structuredClone(data), testimonials: items };
    const { error } = await (supabase.from("site_content" as never) as any)
      .update({ data: payload, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setOk(true);
    qc.invalidateQueries({ queryKey: ["site_content"] });
    qc.invalidateQueries({ queryKey: ["admin_content"] });
    setTimeout(() => setOk(false), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Depoimentos</h3>
          <p className="text-xs text-muted-foreground">Mostrados na página inicial, abaixo dos benefícios.</p>
        </div>
        <button
          id="admin-add-depoimento"
          onClick={() => setItems([...(items ?? []), { name: "", rating: 5, text: "" }])}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar depoimento
        </button>
      </div>

      {items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
          Sem depoimentos. A secção fica escondida na loja.
        </p>
      )}

      <div className="space-y-4">
        {items.map((t, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Depoimento {i + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir depoimento" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Descer depoimento" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} aria-label="Remover depoimento" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium">Nome do cliente</span>
              <input
                value={t.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Ex.: Ana Costa"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <div>
              <span className="mb-1 block text-xs font-medium">Classificação</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update(i, { rating: n })}
                    aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                    className="p-1"
                  >
                    <Star className={`h-5 w-5 ${n <= t.rating ? "fill-current text-gold" : "text-muted-foreground/40"}`} />
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium">Depoimento</span>
              <textarea
                value={t.text}
                onChange={(e) => update(i, { text: e.target.value })}
                rows={3}
                placeholder="Conte a experiência do cliente…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <ImageUploader
              label="Foto do cliente (opcional)"
              value={t.image}
              onChange={(v) => update(i, { image: v })}
              aspect="aspect-square"
              maxDim={600}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Guardar depoimentos
        </button>
        {ok && <span className="text-xs font-medium text-success">Guardado.</span>}
        {err && <span className="text-xs font-medium text-destructive">{err}</span>}
      </div>
    </div>
  );
}
