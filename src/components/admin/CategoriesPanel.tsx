import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Loader2, Plus, Tags, Trash2, X } from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  findDuplicate,
  type Category,
} from "@/lib/categories";
import { useProducts } from "@/lib/products";

export function CategoriesPanel() {
  const { data: categories, isLoading } = useCategories();
  const { data: products } = useProducts({ activeOnly: false });
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const del = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDel, setConfirmDel] = useState<Category | null>(null);

  const list = categories ?? [];

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products ?? []) map[p.category] = (map[p.category] ?? 0) + 1;
    return map;
  }, [products]);

  async function handleCreate() {
    setErr(null);
    if (!newName.trim()) return;
    const dup = findDuplicate(list, newName);
    if (dup) {
      setErr(`Esta categoria já existe como "${dup.name}".`);
      return;
    }
    try {
      await create.mutateAsync({ name: newName, sort_order: list.length });
      setNewName("");
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao criar categoria.");
    }
  }

  async function handleRename(c: Category) {
    setErr(null);
    const dup = findDuplicate(list, editName, c.id);
    if (dup) {
      setErr(`Já existe a categoria "${dup.name}".`);
      return;
    }
    try {
      await update.mutateAsync({ id: c.id, name: editName, previousName: c.name });
      setEditingId(null);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao renomear.");
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = list[index + dir];
    const current = list[index];
    if (!target || !current) return;
    await update.mutateAsync({ id: current.id, sort_order: index + dir });
    await update.mutateAsync({ id: target.id, sort_order: index });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Tags className="h-4 w-4 text-primary" /> Categorias da loja
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          As categorias criadas aqui aparecem na lista ao publicar um produto e nos filtros da loja. Nomes repetidos
          (mesmo com maiúsculas ou acentos diferentes) são bloqueados.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            id="nova-categoria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Nome da nova categoria (ex: Eletrónica)"
            className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-xs outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={create.isPending || !newName.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
          >
            {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Adicionar categoria
          </button>
        </div>
        {err && <p className="mt-2 text-xs font-medium text-destructive">{err}</p>}
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Tags className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm">Ainda sem categorias. Crie a primeira acima.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((c, i) => {
            const count = counts[c.name] ?? 0;
            return (
              <div key={c.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    title="Subir"
                    className="grid h-5 w-6 place-items-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === list.length - 1}
                    title="Descer"
                    className="grid h-5 w-6 place-items-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  {editingId === c.id ? (
                    <div className="flex gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRename(c)}
                        autoFocus
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => handleRename(c)}
                        className="grid h-8 w-8 place-items-center rounded-full text-primary hover:bg-primary/10"
                        title="Guardar"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                        title="Cancelar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                        {!c.active && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Oculta</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {count} produto{count === 1 ? "" : "s"} · /{c.slug}
                      </p>
                    </>
                  )}
                </div>

                {editingId !== c.id && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => update.mutate({ id: c.id, active: !c.active })}
                      title={c.active ? "Ocultar na loja" : "Mostrar na loja"}
                      className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {c.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErr(null);
                        setEditingId(c.id);
                        setEditName(c.name);
                      }}
                      className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      Renomear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDel(c)}
                      className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-[var(--shadow-lift)]">
            <h4 className="text-sm font-semibold text-foreground">Eliminar “{confirmDel.name}”?</h4>
            {(counts[confirmDel.name] ?? 0) > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Esta categoria tem {counts[confirmDel.name]} produto(s). Mude primeiro esses produtos para outra
                categoria no separador Produtos.
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDel(null)} className="rounded-full border border-border px-4 py-2 text-xs">
                Cancelar
              </button>
              <button
                disabled={(counts[confirmDel.name] ?? 0) > 0 || del.isPending}
                onClick={async () => {
                  await del.mutateAsync(confirmDel.id);
                  setConfirmDel(null);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-50"
              >
                {del.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
