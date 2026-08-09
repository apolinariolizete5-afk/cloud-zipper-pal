import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdmins, grantAdminByEmail, revokeAdmin, resetAdmins } from "@/lib/admin.functions";
import type { SiteContent, OrderSettings } from "@/lib/store-types";
import { LogOut, Save, Plus, Trash2, Loader2, BarChart3, Settings, FileText, Users, Package, AlertTriangle, Star, Eye, EyeOff, MessageSquare, Sparkles, Tags } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { formatMzPhone, toWhatsAppNumber } from "@/lib/order-validation";
import { ProductsPanel } from "./ProductsPanel";
import { CategoriesPanel } from "./CategoriesPanel";
import { BenefitsPanel } from "./BenefitsPanel";
import { TestimonialsPanel } from "./TestimonialsPanel";
import { adminListAllReviews, adminDeleteReview, adminSetReviewApproved, type Review } from "@/lib/reviews";

type Tab = "products" | "categories" | "content" | "benefits" | "testimonials" | "orders" | "stats" | "reviews" | "users";

export function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-base font-semibold text-foreground">Polyset Admin</h1>
            <p className="text-xs text-muted-foreground">Gestor de conteúdo e encomendas</p>
          </div>
          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs text-muted-foreground hover:text-foreground">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          <TabBtn active={tab === "products"} onClick={() => setTab("products")} icon={<Package className="h-3.5 w-3.5" />}>Produtos</TabBtn>
          <TabBtn active={tab === "categories"} onClick={() => setTab("categories")} icon={<Tags className="h-3.5 w-3.5" />}>Categorias</TabBtn>
          <TabBtn active={tab === "content"} onClick={() => setTab("content")} icon={<FileText className="h-3.5 w-3.5" />}>Conteúdo</TabBtn>
          <TabBtn active={tab === "benefits"} onClick={() => setTab("benefits")} icon={<Sparkles className="h-3.5 w-3.5" />}>Benefícios</TabBtn>
          <TabBtn active={tab === "testimonials"} onClick={() => setTab("testimonials")} icon={<Star className="h-3.5 w-3.5" />}>Depoimentos</TabBtn>
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")} icon={<Settings className="h-3.5 w-3.5" />}>Encomendas</TabBtn>
          <TabBtn active={tab === "stats"} onClick={() => setTab("stats")} icon={<BarChart3 className="h-3.5 w-3.5" />}>Estatísticas</TabBtn>
          <TabBtn active={tab === "reviews"} onClick={() => setTab("reviews")} icon={<MessageSquare className="h-3.5 w-3.5" />}>Avaliações</TabBtn>
          <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="h-3.5 w-3.5" />}>Utilizadores</TabBtn>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {tab === "products" && <ProductsPanel />}
        {tab === "categories" && <CategoriesPanel />}
        {tab === "content" && <ContentEditor />}
        {tab === "benefits" && <BenefitsPanel />}
        {tab === "testimonials" && <TestimonialsPanel />}
        {tab === "orders" && <OrderEditor />}
        {tab === "stats" && <StatsPanel />}
        {tab === "reviews" && <ReviewsPanel />}
        {tab === "users" && <UsersPanel />}
      </main>
    </div>
  );
}

function TabBtn({ children, active, onClick, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-medium transition ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function useContent() {
  return useQuery({
    queryKey: ["admin_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content" as never).select("data").eq("id", 1).single();
      if (error) throw error;
      return (data as { data: SiteContent }).data;
    },
  });
}

function useSettings() {
  return useQuery({
    queryKey: ["admin_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_settings" as never).select("*").eq("id", 1).single();
      if (error) throw error;
      return data as OrderSettings;
    },
  });
}

function ContentEditor() {
  const { data, isLoading } = useContent();
  const qc = useQueryClient();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (data) setContent(structuredClone(data));
  }, [data]);

  if (isLoading || !content) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;

  const save = async () => {
    setSaving(true);
    setOk(false);
    const { error } = await (supabase.from("site_content" as never) as any)
      .update({ data: content, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (!error) {
      setOk(true);
      qc.invalidateQueries({ queryKey: ["site_content"] });
      qc.invalidateQueries({ queryKey: ["admin_content"] });
      setTimeout(() => setOk(false), 2500);
    }
  };

  const set = (updater: (c: SiteContent) => void) => {
    setContent((c) => {
      if (!c) return c;
      const nc = structuredClone(c);
      updater(nc);
      return nc;
    });
  };

  return (
    <div className="space-y-6">
      <Card title="Marca">
        <Input label="Nome da loja" value={content.brand} onChange={(v) => set((c) => { c.brand = v; })} />
      </Card>

      <Card title="Banner Principal">
        <Input label="Título" value={content.hero.title} onChange={(v) => set((c) => { c.hero.title = v; })} />
        <Textarea label="Subtítulo" value={content.hero.subtitle} onChange={(v) => set((c) => { c.hero.subtitle = v; })} />
        <Input label="Botão CTA" value={content.hero.cta} onChange={(v) => set((c) => { c.hero.cta = v; })} />
        <Input label="Alerta de stock (use {stock})" value={content.hero.stockAlert} onChange={(v) => set((c) => { c.hero.stockAlert = v; })} />
        <Input type="number" label="Quantidade em stock" value={String(content.hero.stockCount)} onChange={(v) => set((c) => { c.hero.stockCount = parseInt(v) || 0; })} />
        <ImageUploader
          label="Imagem do banner (produto)"
          value={content.hero.image}
          onChange={(v) => set((c) => { c.hero.image = v; })}
          aspect="aspect-square"
        />
      </Card>

      <Card title="Produto">
        <Input label="Nome do produto" value={content.product.name} onChange={(v) => set((c) => { c.product.name = v; })} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input type="number" label="Preço" value={String(content.product.price)} onChange={(v) => set((c) => { c.product.price = parseInt(v) || 0; })} />
          <Input type="number" label="Preço original" value={String(content.product.originalPrice ?? "")} onChange={(v) => set((c) => { c.product.originalPrice = parseInt(v) || undefined; })} />
          <Input label="Moeda" value={content.product.currency} onChange={(v) => set((c) => { c.product.currency = v; })} />
        </div>
        <Textarea label="Descrição" value={content.product.description} onChange={(v) => set((c) => { c.product.description = v; })} />

        <ImageUploader
          label="Imagem Antes & Depois"
          value={content.product.beforeAfterImage}
          onChange={(v) => set((c) => { c.product.beforeAfterImage = v; })}
          aspect="aspect-[16/10]"
        />

        <ListEditor
          label="Benefícios"
          items={content.product.benefits}
          renderItem={(it, i) => (
            <input value={it} onChange={(e) => set((c) => { c.product.benefits[i] = e.target.value; })} className="input flex-1" />
          )}
          onAdd={() => set((c) => { c.product.benefits.push("Novo benefício"); })}
          onRemove={(i) => set((c) => { c.product.benefits.splice(i, 1); })}
        />

        <ListEditor
          label="Ingredientes"
          items={content.product.ingredients}
          renderItem={(it, i) => (
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <input value={it.name} placeholder="Nome" onChange={(e) => set((c) => { c.product.ingredients[i].name = e.target.value; })} className="input sm:w-40" />
              <input value={it.description} placeholder="Descrição" onChange={(e) => set((c) => { c.product.ingredients[i].description = e.target.value; })} className="input flex-1" />
            </div>
          )}
          onAdd={() => set((c) => { c.product.ingredients.push({ name: "Novo", description: "" }); })}
          onRemove={(i) => set((c) => { c.product.ingredients.splice(i, 1); })}
        />
      </Card>

      <Card title="Depoimentos">
        <ListEditor
          items={content.testimonials}
          renderItem={(t, i) => (
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex gap-2">
                <input value={t.name} placeholder="Nome" onChange={(e) => set((c) => { c.testimonials[i].name = e.target.value; })} className="input flex-1" />
                <input type="number" min={1} max={5} value={t.rating} onChange={(e) => set((c) => { c.testimonials[i].rating = parseInt(e.target.value) || 5; })} className="input w-20" />
              </div>
              <textarea value={t.text} placeholder="Depoimento" onChange={(e) => set((c) => { c.testimonials[i].text = e.target.value; })} className="input min-h-20" />
              <ImageUploader
                label="Foto da cliente (opcional)"
                value={t.image}
                onChange={(v) => set((c) => { c.testimonials[i].image = v; })}
                aspect="aspect-square"
                maxDim={600}
              />
            </div>
          )}
          onAdd={() => set((c) => { c.testimonials.push({ name: "Cliente", rating: 5, text: "" }); })}
          onRemove={(i) => set((c) => { c.testimonials.splice(i, 1); })}
        />
      </Card>

      <Card title="Perguntas Frequentes">
        <ListEditor
          items={content.faqs}
          renderItem={(f, i) => (
            <div className="flex flex-1 flex-col gap-2">
              <input value={f.q} placeholder="Pergunta" onChange={(e) => set((c) => { c.faqs[i].q = e.target.value; })} className="input" />
              <textarea value={f.a} placeholder="Resposta" onChange={(e) => set((c) => { c.faqs[i].a = e.target.value; })} className="input min-h-20" />
              <ImageUploader
                label="Imagem ilustrativa (opcional)"
                value={f.image}
                onChange={(v) => set((c) => { c.faqs[i].image = v; })}
                aspect="aspect-[16/9]"
                maxDim={1000}
              />
            </div>
          )}
          onAdd={() => set((c) => { c.faqs.push({ q: "Nova pergunta", a: "" }); })}
          onRemove={(i) => set((c) => { c.faqs.splice(i, 1); })}
        />
      </Card>

      <Card title="Prova social">
        <Input type="number" label="Visitantes em tempo real (base)" value={String(content.visitorCount)} onChange={(v) => set((c) => { c.visitorCount = parseInt(v) || 0; })} />
        <ListEditor
          label="Notificações de vendas recentes"
          items={content.recentSales}
          renderItem={(it, i) => (
            <input value={it} onChange={(e) => set((c) => { c.recentSales[i] = e.target.value; })} className="input flex-1" />
          )}
          onAdd={() => set((c) => { c.recentSales.push("Cliente acabou de comprar"); })}
          onRemove={(i) => set((c) => { c.recentSales.splice(i, 1); })}
        />
      </Card>

      <div className="sticky bottom-4 z-10 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar alterações
        </button>
        {ok && <span className="text-xs font-medium text-success">✓ Guardado</span>}
      </div>

      <style>{`.input{width:100%;border-radius:0.625rem;border:1px solid var(--color-border);background:var(--color-background);padding:0.5rem 0.75rem;font-size:0.8125rem;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
    </div>
  );
}

function OrderEditor() {
  const { data, isLoading } = useSettings();
  const qc = useQueryClient();
  const [s, setS] = useState<OrderSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [phoneErr, setPhoneErr] = useState<string | null>(null);

  useEffect(() => {
    if (data) setS({ ...data });
  }, [data]);

  if (isLoading || !s) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;

  const save = async () => {
    const num = toWhatsAppNumber(s.whatsapp_number);
    if (!num) {
      setPhoneErr("Número inválido — ex: 83 410 2205");
      return;
    }
    setPhoneErr(null);
    setSaving(true);
    const { error } = await (supabase.from("order_settings" as never) as any)
      .update({
        mode: "whatsapp",
        whatsapp_number: num,
        whatsapp_template: s.whatsapp_template,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setSaving(false);
    if (!error) {
      setOk(true);
      qc.invalidateQueries({ queryKey: ["order_settings"] });
      qc.invalidateQueries({ queryKey: ["admin_settings"] });
      setTimeout(() => setOk(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Configuração WhatsApp">
        <p className="text-xs text-muted-foreground">
          Todas as encomendas são enviadas por WhatsApp. Não existe destino alternativo.
        </p>
        <Input
          label="Número geral (ex: 83 410 2205)"
          value={s.whatsapp_number}
          onChange={(v) => {
            setPhoneErr(null);
            setS({ ...s, whatsapp_number: formatMzPhone(v) });
          }}
        />
        {phoneErr ? (
          <p className="text-xs font-medium text-destructive">{phoneErr}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Guardado no formato internacional (258…).</p>
        )}
        <Textarea
          label="Modelo da mensagem"
          value={s.whatsapp_template}
          onChange={(v) => setS({ ...s, whatsapp_template: v })}
        />
        <p className="text-xs text-muted-foreground">
          Variáveis: {"{product}"}, {"{quantity}"}, {"{total}"}, {"{name}"}, {"{phone}"}, {"{whatsapp}"}, {"{province}"}, {"{address}"}, {"{schedule}"}. Use %0A para quebras de linha.
        </p>
      </Card>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </button>
        {ok && <span className="text-xs font-medium text-success">✓ Guardado</span>}
      </div>
    </div>
  );
}

function StatsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("analytics_events" as never)
        .select("event_type, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { event_type: string; created_at: string }[];
    },
    refetchInterval: 10_000,
  });

  const stats = useMemo(() => {
    const s = { page_view: 0, order_click: 0, order_submit: 0 };
    (data ?? []).forEach((e) => {
      if (e.event_type in s) s[e.event_type as keyof typeof s]++;
    });
    const conversion = s.page_view > 0 ? ((s.order_submit / s.page_view) * 100).toFixed(1) : "0";
    return { ...s, conversion };
  }, [data]);

  if (isLoading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">Últimos 7 dias — atualiza a cada 10s</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Visualizações" value={stats.page_view} />
        <Metric label="Cliques em Encomendar" value={stats.order_click} />
        <Metric label="Pedidos concluídos" value={stats.order_submit} />
        <Metric label="Taxa de conversão" value={`${stats.conversion}%`} />
      </div>

      <Card title="Atividade recente">
        <div className="space-y-2 text-xs">
          {(data ?? []).slice(0, 30).map((e, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="font-medium text-foreground">{eventLabel(e.event_type)}</span>
              <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-PT")}</span>
            </div>
          ))}
          {(!data || data.length === 0) && <p className="text-muted-foreground">Sem eventos ainda.</p>}
        </div>
      </Card>
    </div>
  );
}

function eventLabel(t: string) {
  if (t === "page_view") return "Visualização de página";
  if (t === "order_click") return "Clique em Encomendar";
  if (t === "order_submit") return "Pedido concluído";
  return t;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function UsersPanel() {
  const list = useServerFn(listAdmins);
  const grant = useServerFn(grantAdminByEmail);
  const revoke = useServerFn(revokeAdmin);
  const reset = useServerFn(resetAdmins);
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin_users"],
    queryFn: () => list(),
  });

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null); setErr(null);
    try {
      await grant({ data: { email } });
      setEmail("");
      setMsg("Administrador adicionado.");
      qc.invalidateQueries({ queryKey: ["admin_users"] });
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao adicionar.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (user_id: string, emailLabel: string) => {
    if (!confirm(`Remover acesso de administrador de ${emailLabel}?`)) return;
    setErr(null); setMsg(null);
    try {
      await revoke({ data: { user_id } });
      qc.invalidateQueries({ queryKey: ["admin_users"] });
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao remover.");
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Adicionar administrador">
        <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Conceder acesso
          </button>
        </form>
        <p className="text-[11px] text-muted-foreground">
          O utilizador precisa de já ter criado uma conta em /admin. Peça-lhe para se registar primeiro.
        </p>
        {msg && <p className="text-xs font-medium text-success">{msg}</p>}
        {err && <p className="text-xs font-medium text-destructive">{err}</p>}
      </Card>

      <Card title="Administradores atuais">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : error ? (
          <div className="space-y-2">
            <p className="text-xs text-destructive">{(error as Error).message}</p>
            <button onClick={() => refetch()} className="text-xs underline">Tentar novamente</button>
          </div>
        ) : (
          <div className="space-y-2">
            {(data ?? []).map((u) => (
              <div key={u.user_id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {u.email}
                    {u.user_id === meId && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Você</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Desde {new Date(u.created_at).toLocaleDateString("pt-PT")}</p>
                </div>
                <button
                  onClick={() => remove(u.user_id, u.email)}
                  disabled={u.user_id === meId}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3 w-3" /> Remover
                </button>
              </div>
            ))}
            {(data ?? []).length === 0 && <p className="text-xs text-muted-foreground">Nenhum administrador.</p>}
          </div>
        )}
      </Card>

      <ResetAdminsCard onReset={reset} />
    </div>
  );
}

function ResetAdminsCard({ onReset }: { onReset: (args: { data: { confirm: "RESET"; deleteAccounts: boolean } }) => Promise<any> }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [deleteAccounts, setDeleteAccounts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async () => {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const r = await onReset({ data: { confirm: "RESET", deleteAccounts } });
      setMsg(`Removidos ${r.removed} admin(s)${deleteAccounts ? `, contas eliminadas: ${r.deletedAccounts}` : ""}. A terminar sessão…`);
      setTimeout(() => supabase.auth.signOut(), 1200);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao repor.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-semibold text-destructive">Zona de perigo — Repor administradores</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Remove <strong>todos</strong> os administradores (incluindo a sua conta) e devolve o painel ao estado de “primeiro admin”.
        A seguir, crie uma nova conta em <code>/admin</code> e use “Reivindicar acesso (primeiro admin)”.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-destructive/50 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" /> Repor administradores
        </button>
      ) : (
        <div className="mt-4 space-y-3 rounded-xl border border-destructive/30 bg-background p-4">
          <label className="flex items-start gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={deleteAccounts}
              onChange={(e) => setDeleteAccounts(e.target.checked)}
              className="mt-0.5"
            />
            <span>Também eliminar as contas de utilizador associadas (não só a permissão de admin).</span>
          </label>
          <label className="block text-xs">
            Escreva <strong>RESET</strong> para confirmar:
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-destructive"
              placeholder="RESET"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={run}
              disabled={busy || text !== "RESET"}
              className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Confirmar reposição
            </button>
            <button
              onClick={() => { setOpen(false); setText(""); setErr(null); setMsg(null); }}
              disabled={busy}
              className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
          {msg && <p className="text-xs font-medium text-success">{msg}</p>}
          {err && <p className="text-xs font-medium text-destructive">{err}</p>}
        </div>
      )}
    </section>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground/80">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground/80">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="input min-h-24" />
    </label>
  );
}

function ListEditor<T>({ items, renderItem, onAdd, onRemove, label }: { items: T[]; renderItem: (it: T, i: number) => React.ReactNode; onAdd: () => void; onRemove: (i: number) => void; label?: string }) {
  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-foreground/80">{label}</p>}
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3">
          {renderItem(it, i)}
          <button type="button" onClick={() => onRemove(i)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary">
        <Plus className="h-3.5 w-3.5" /> Adicionar
      </button>
    </div>
  );
}
function ReviewsPanel() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      setItems(await adminListAllReviews());
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar avaliações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-reviews")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleApproved = async (r: Review) => {
    await adminSetReviewApproved(r.id, !r.approved);
    load();
  };

  const remove = async (r: Review) => {
    if (!confirm("Eliminar esta avaliação? Esta ação é irreversível.")) return;
    await adminDeleteReview(r.id);
    load();
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Moderação de avaliações</h2>
          <p className="text-xs text-muted-foreground">Aprove, oculte ou elimine avaliações submetidas por clientes.</p>
        </div>
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      {loading ? (
        <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda não há avaliações.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{r.author_name}</span>
                  <span className="flex text-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-30"}`} />
                    ))}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${r.approved ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {r.approved ? "Publicada" : "Oculta"}
                  </span>
                  {!r.product_id && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Loja</span>}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">"{r.comment}"</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-PT")}</p>
              </div>
              <div className="flex gap-2 sm:flex-col">
                <button onClick={() => toggleApproved(r)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary">
                  {r.approved ? <><EyeOff className="h-3.5 w-3.5" /> Ocultar</> : <><Eye className="h-3.5 w-3.5" /> Aprovar</>}
                </button>
                <button onClick={() => remove(r)} className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
