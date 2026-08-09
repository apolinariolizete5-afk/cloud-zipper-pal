import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Package, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useDeleteProduct, slugify, type Product } from "@/lib/products";
import { useCategories, useCreateCategory, findDuplicate } from "@/lib/categories";
import { formatMzPhone, isValidMzPhone, toWhatsAppNumber } from "@/lib/order-validation";
import { ImageUploader } from "./ImageUploader";

type Draft = Omit<Product, "id" | "created_at" | "updated_at" | "view_count"> & {
  id?: string;
};

function blankDraft(): Draft {
  return {
    name: "",
    slug: "",
    description: "",
    short_description: "",
    price: 0,
    original_price: null,
    currency: "MT",
    category: "",
    image: null,
    whatsapp_number: "",
    gallery: [],
    benefits: [],
    stock: 0,
    active: true,
    featured: false,
    sort_order: 0,
  };
}

export function ProductsPanel() {
  const { data, isLoading } = useProducts({ activeOnly: false });
  const del = useDeleteProduct();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirmDel, setConfirmDel] = useState<Product | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("recent");

  const totalViews = (data ?? []).reduce((s, p) => s + p.view_count, 0);

  const categories = useMemo(
    () => Array.from(new Set((data ?? []).map((p) => p.category).filter(Boolean))).sort(),
    [data],
  );

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = (data ?? []).filter((p) => {
      const matchesTerm =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.short_description.toLowerCase().includes(term);
      const matchesCat =
        cat === "all" ||
        (cat === "__inactive" ? !p.active : cat === "__active" ? p.active : p.category === cat);
      return matchesTerm && matchesCat;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "views":
          return b.view_count - a.view_count;
        case "stock":
          return a.stock - b.stock;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [data, q, cat, sort]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Produtos" value={(data ?? []).length} />
        <Stat label="Ativos" value={(data ?? []).filter((p) => p.active).length} />
        <Stat label="Visualizações totais" value={totalViews} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Lista de produtos <span className="text-muted-foreground">({visible.length})</span>
        </h3>
        <button
          onClick={() => setEditing(blankDraft())}
         
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
        >
          <Plus className="h-3.5 w-3.5" /> Novo produto
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar por nome, categoria ou slug…"
            className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-full border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
        >
          <option value="all">Todas as categorias</option>
          <option value="__active">Apenas ativos</option>
          <option value="__inactive">Apenas inativos</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-full border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
        >
          <option value="recent">Mais recentes</option>
          <option value="name">Nome (A–Z)</option>
          <option value="price_asc">Preço (menor)</option>
          <option value="price_desc">Preço (maior)</option>
          <option value="views">Mais vistos</option>
          <option value="stock">Stock (menor)</option>
        </select>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm">
            {(data ?? []).length === 0
              ? 'Ainda sem produtos. Clique em "Novo produto" para começar.'
              : "Nenhum produto corresponde à pesquisa."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground">
                    <Package className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  {!p.active && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Inativo</span>}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {p.category} · {p.price.toLocaleString()} {p.currency} · Stock {p.stock}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Eye className="h-3 w-3" /> {p.view_count} visualizações
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditing({ ...p })}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmDel(p)}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <ProductEditor draft={editing} onClose={() => setEditing(null)} />}

      {confirmDel && (
        <ConfirmDelete
          product={confirmDel}
          busy={del.isPending}
          onCancel={() => setConfirmDel(null)}
          onConfirm={async () => {
            await del.mutateAsync(confirmDel.id);
            setConfirmDel(null);
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ProductEditor({ draft: initial, onClose }: { draft: Draft; onClose: () => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [err, setErr] = useState<string | null>(null);
  const qc = useQueryClient();
  const { data: cats } = useCategories();
  const createCat = useCreateCategory();
  const [newCat, setNewCat] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const catList = cats ?? [];

  async function handleAddCategory() {
    const name = newCat.trim();
    if (!name) return;
    const dup = findDuplicate(catList, name);
    if (dup) {
      set("category", dup.name);
      setNewCat("");
      setAddingCat(false);
      setErr(`A categoria "${dup.name}" já existia e foi selecionada.`);
      return;
    }
    try {
      const created = await createCat.mutateAsync({ name, sort_order: catList.length });
      set("category", created.name);
      setNewCat("");
      setAddingCat(false);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao criar categoria.");
    }
  }

  const upsert = useMutation({
    mutationFn: async (payload: Draft) => {
      const body: any = {
        ...payload,
        slug: payload.slug?.trim() || slugify(payload.name),
        category: payload.category?.trim() || "Geral",
        original_price: payload.original_price || null,
        whatsapp_number: payload.whatsapp_number?.trim()
          ? toWhatsAppNumber(payload.whatsapp_number)
          : null,
      };
      const { data, error } = body.id
        ? await supabase.from("products").update(body).eq("id", body.id).select().single()
        : await supabase.from("products").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (e: any) => setErr(e?.message ?? "Erro ao guardar."),
  });

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-3xl bg-card shadow-[var(--shadow-lift)] sm:max-w-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{d.id ? "Editar produto" : "Novo produto"}</h3>
            <p className="text-xs text-muted-foreground">Todos os campos são editáveis</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <ImageUploader
            label="Imagem principal"
            value={d.image ?? undefined}
            onChange={(v) => set("image", v ?? null)}
            aspect="aspect-square"
          />

          <Field label="Nome do produto *">
            <input value={d.name} onChange={(e) => set("name", e.target.value)} required className="input" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoria">
              {addingCat ? (
                <div className="flex gap-2">
                  <input
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    autoFocus
                    placeholder="Nome da nova categoria"
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={createCat.isPending}
                    className="rounded-lg bg-gradient-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    Criar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingCat(false); setNewCat(""); }}
                    className="rounded-lg border border-border px-3 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={catList.some((c) => c.name === d.category) ? d.category : ""}
                    onChange={(e) => set("category", e.target.value)}
                    className="input flex-1"
                  >
                    <option value="" disabled>
                      {d.category && !catList.some((c) => c.name === d.category)
                        ? `${d.category} (categoria antiga)`
                        : "Escolher categoria…"}
                    </option>
                    {catList.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                        {c.active ? "" : " (oculta)"}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAddingCat(true)}
                    className="whitespace-nowrap rounded-lg border border-dashed border-border px-3 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    + Nova
                  </button>
                </div>
              )}
            </Field>
            <Field label="Slug (URL — deixe vazio para gerar)">
              <input value={d.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(d.name || "produto")} className="input" />
            </Field>
          </div>

          <Field label="Descrição curta">
            <input value={d.short_description} onChange={(e) => set("short_description", e.target.value)} maxLength={160} className="input" />
          </Field>

          <Field label="WhatsApp para receber as encomendas deste produto">
            <input
              value={d.whatsapp_number ?? ""}
              onChange={(e) => set("whatsapp_number", formatMzPhone(e.target.value))}
              inputMode="tel"
              maxLength={17}
              placeholder="Ex: 83 410 2205 (vazio = número padrão da loja)"
              className={`input${
                (d.whatsapp_number ?? "").trim() && !isValidMzPhone(d.whatsapp_number ?? "")
                  ? " border-destructive"
                  : ""
              }`}
            />
            {(d.whatsapp_number ?? "").trim() && !isValidMzPhone(d.whatsapp_number ?? "") ? (
              <span className="mt-1 block text-[11px] font-medium text-destructive">
                Número inválido — use um número moçambicano, ex: 83 410 2205
              </span>
            ) : (
              <span className="mt-1 block text-[11px] text-muted-foreground">
                As informações do pedido serão enviadas para este número. Deixe vazio para usar o número geral da loja.
              </span>
            )}
          </Field>

          <Field label="Descrição completa">
            <textarea value={d.description} onChange={(e) => set("description", e.target.value)} className="input min-h-32" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Preço *">
              <input type="number" min={0} value={d.price} onChange={(e) => set("price", Number(e.target.value) || 0)} className="input" />
            </Field>
            <Field label="Preço original">
              <input type="number" min={0} value={d.original_price ?? ""} onChange={(e) => set("original_price", e.target.value ? Number(e.target.value) : null)} className="input" />
            </Field>
            <Field label="Moeda">
              <input value={d.currency} onChange={(e) => set("currency", e.target.value)} className="input" />
            </Field>
            <Field label="Stock">
              <input type="number" min={0} value={d.stock} onChange={(e) => set("stock", Number(e.target.value) || 0)} className="input" />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-foreground/80">Benefícios</p>
            <div className="space-y-2">
              {d.benefits.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={b}
                    onChange={(e) => {
                      const next = [...d.benefits];
                      next[i] = e.target.value;
                      set("benefits", next);
                    }}
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => set("benefits", d.benefits.filter((_, j) => j !== i))}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set("benefits", [...d.benefits, ""])}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar benefício
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={d.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-[oklch(0.55_0.12_25)]" />
            <span>Produto ativo (visível no catálogo)</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!d.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-[oklch(0.55_0.12_25)]" />
            <span>Produto em destaque na Página Inicial</span>
          </label>

          {err && <p className="text-xs font-medium text-destructive">{err}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-xs">Cancelar</button>
          <button
            onClick={() => {
              if (!d.name.trim()) { setErr("Nome é obrigatório"); return; }
              if (d.price < 0) { setErr("Preço inválido"); return; }
              if ((d.whatsapp_number ?? "").trim() && !isValidMzPhone(d.whatsapp_number ?? "")) {
                setErr("Número de WhatsApp inválido — ex: 83 410 2205");
                return;
              }
              setErr(null);
              upsert.mutate(d);
            }}
            disabled={upsert.isPending}
           
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
          >
            {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar produto
          </button>
        </div>

        <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--color-border);background:var(--color-background);padding:0.5rem 0.75rem;font-size:0.8125rem;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground/80">{label}</span>
      {children}
    </label>
  );
}

function ConfirmDelete({
  product,
  busy,
  onCancel,
  onConfirm,
}: {
  product: Product;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-[var(--shadow-lift)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <Trash2 className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-center text-base font-semibold text-foreground">Eliminar produto</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Tem a certeza que deseja eliminar <span className="font-medium text-foreground">"{product.name}"</span>? Esta ação não pode ser revertida.
        </p>
        <div className="mt-6 flex gap-2">
          <button onClick={onCancel} disabled={busy} className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}