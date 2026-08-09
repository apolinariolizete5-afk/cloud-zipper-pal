import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BENEFITS, type Benefit, type SiteContent } from "@/lib/store-types";
import { ImageUploader } from "./ImageUploader";

export function BenefitsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content" as never).select("data").eq("id", 1).single();
      if (error) throw error;
      return (data as { data: SiteContent }).data;
    },
  });

  const [items, setItems] = useState<Benefit[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (data) setItems(structuredClone(data.benefitsCarousel ?? DEFAULT_BENEFITS));
  }, [data]);

  if (isLoading || !items || !data) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;

  const update = (i: number, patch: Partial<Benefit>) =>
    setItems((list) => (list ?? []).map((b, idx) => (idx === i ? { ...b, ...patch } : b)));

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
    const payload: SiteContent = { ...structuredClone(data), benefitsCarousel: items };
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Carrossel de benefícios</h3>
          <p className="text-xs text-muted-foreground">Cartões de confiança mostrados na página inicial.</p>
        </div>
        <button
          onClick={() => setItems([...(items ?? []), { title: "", text: "" }])}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar cartão
        </button>
      </div>

      {items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
          Sem cartões. O carrossel fica escondido na loja.
        </p>
      )}

      <div className="space-y-4">
        {items.map((b, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Cartão {i + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Subir cartão"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  aria-label="Descer cartão"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                  aria-label="Remover cartão"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium">Título</span>
              <input
                value={b.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder="ENTREGAS RÁPIDAS"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium">Texto</span>
              <textarea
                value={b.text}
                onChange={(e) => update(i, { text: e.target.value })}
                rows={3}
                placeholder="Entregamos em Maputo em 2 a 4 horas…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <ImageUploader
              label="Imagem / ícone"
              value={b.image}
              onChange={(v) => update(i, { image: v })}
              aspect="aspect-square"
              maxDim={800}
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
          Guardar benefícios
        </button>
        {ok && <span className="text-xs font-medium text-success">Guardado.</span>}
        {err && <span className="text-xs font-medium text-destructive">{err}</span>}
      </div>
    </div>
  );
}