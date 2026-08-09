import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { OrderFormData, OrderSettings } from "@/lib/store-types";
import { PROVINCES } from "@/lib/store-types";
import { trackEvent } from "@/lib/use-store-data";
import { orderSchema, formatMzPhone, normalizePhone } from "@/lib/order-validation";
import { useCart } from "@/lib/cart";

export function CheckoutModal({
  open,
  onClose,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  settings: OrderSettings | null;
}) {
  const { items, total, clear } = useCart();
  const [form, setForm] = useState<OrderFormData>({
    quantity: 1,
    province: PROVINCES[0],
    name: "",
    phone: "",
    whatsapp: "",
    address: "",
    schedule: "",
    confirmed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const currency = items[0]?.currency ?? "MT";
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);

  const setField = <K extends keyof OrderFormData>(k: K, v: OrderFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const clearErr = (k: string) =>
    setErrors((e) => {
      if (!e[k]) return e;
      const { [k]: _, ...rest } = e;
      return rest;
    });

  const onPhoneChange = (k: "phone" | "whatsapp", raw: string) => {
    setField(k, formatMzPhone(raw));
    clearErr(k);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (items.length === 0) {
      setErrors({ form: "O carrinho está vazio." });
      return;
    }
    const result = orderSchema.safeParse({ ...form, quantity: Math.max(1, totalUnits) });
    if (!result.success) {
      const map: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!map[key]) map[key] = issue.message;
      }
      setErrors(map);
      return;
    }
    if (!settings) {
      setErrors({ form: "Serviço indisponível de momento." });
      return;
    }
    const parsed = result.data;
    setSubmitting(true);
    await trackEvent("order_submit");

    const enc = (s: string) => encodeURIComponent(s);
    const list = items
      .map((i) => `• ${i.name} x${i.quantity} — ${(i.price * i.quantity).toLocaleString()} ${i.currency}`)
      .join("\n");

    const msg = settings.whatsapp_template
      .replaceAll("{items}", enc(list))
      .replaceAll("{product}", enc(items.length === 1 ? items[0].name : `${items.length} produtos`) + "%0A" + enc(list))
      .replaceAll("{quantity}", String(totalUnits))
      .replaceAll("{total}", enc(`${total.toLocaleString()} ${currency}`))
      .replaceAll("{name}", enc(parsed.name))
      .replaceAll("{phone}", enc(formatMzPhone(parsed.phone)))
      .replaceAll("{whatsapp}", enc(formatMzPhone(parsed.whatsapp || parsed.phone)))
      .replaceAll("{province}", enc(parsed.province))
      .replaceAll("{address}", enc(parsed.address))
      .replaceAll("{schedule}", enc(parsed.schedule || "Não especificado"));

    const specific = items.length === 1 ? items[0].whatsapp_number?.trim() : "";
    const num = normalizePhone(specific || settings.whatsapp_number);
    clear();
    window.location.href = `https://wa.me/${num}?text=${msg}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-3xl bg-card shadow-[var(--shadow-lift)] sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Finalizar encomenda</h3>
            <p className="text-xs text-muted-foreground">Enviamos o resumo para o WhatsApp da loja</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="rounded-2xl bg-muted/60 p-4">
            <ul className="space-y-1.5">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 text-xs text-foreground/80">
                  <span className="truncate">
                    {i.name} <span className="text-muted-foreground">x{i.quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {(i.price * i.quantity).toLocaleString()} {i.currency}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Total ({totalUnits} artigos)</span>
              <span className="text-lg font-semibold text-foreground">
                {total.toLocaleString()} {currency}
              </span>
            </div>
          </div>

          <Field label="Província / Localidade *">
            <select
              value={form.province}
              onChange={(e) => setField("province", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome e apelido *" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => { setField("name", e.target.value); clearErr("name"); }}
                required
                maxLength={100}
                autoComplete="name"
                className="ck-input"
              />
            </Field>
            <Field label="Telefone / Chamadas *" error={errors.phone} hint="Ex: 84 123 4567">
              <input
                value={form.phone}
                onChange={(e) => onPhoneChange("phone", e.target.value)}
                required
                maxLength={17}
                inputMode="tel"
                autoComplete="tel"
                placeholder="84 123 4567"
                className="ck-input"
              />
            </Field>
          </div>

          <Field label="WhatsApp principal" error={errors.whatsapp} hint="Deixe vazio para usar o telefone">
            <input
              value={form.whatsapp}
              onChange={(e) => onPhoneChange("whatsapp", e.target.value)}
              maxLength={17}
              inputMode="tel"
              placeholder="84 123 4567"
              className="ck-input"
            />
          </Field>

          <Field label="Endereço / Local de entrega *" error={errors.address} hint="Bairro, rua, referência">
            <input
              value={form.address}
              onChange={(e) => { setField("address", e.target.value); clearErr("address"); }}
              required
              minLength={8}
              maxLength={200}
              autoComplete="street-address"
              placeholder="Ex: Bairro Central, Rua da Paz, casa 12"
              className="ck-input"
            />
          </Field>

          <Field label="Horário preferido para entrega" error={errors.schedule}>
            <input
              value={form.schedule}
              onChange={(e) => setField("schedule", e.target.value)}
              placeholder="Ex: 14h–18h"
              maxLength={80}
              className="ck-input"
            />
          </Field>

          <div>
            <label className={`flex items-start gap-3 rounded-xl border p-3 ${errors.confirmed ? "border-destructive bg-destructive/5" : "border-border bg-muted/40"}`}>
              <input
                type="checkbox"
                checked={form.confirmed}
                onChange={(e) => { setField("confirmed", e.target.checked); clearErr("confirmed"); }}
                className="mt-0.5 h-4 w-4"
              />
              <span className="text-xs text-foreground/80">
                Confirmo a minha disponibilidade para receber a encomenda no endereço e horário indicados.
              </span>
            </label>
            {errors.confirmed && <p className="mt-1 text-xs font-medium text-destructive">{errors.confirmed}</p>}
          </div>

          {errors.form && <p className="text-xs font-medium text-destructive">{errors.form}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-success py-3.5 text-sm font-semibold uppercase tracking-wide text-success-foreground shadow-[var(--shadow-lift)] transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enviar encomenda no WhatsApp
          </button>
        </form>

        <style>{`.ck-input{width:100%;border-radius:0.75rem;border:1px solid var(--color-border);background:var(--color-background);padding:0.625rem 0.75rem;font-size:0.875rem;outline:none}.ck-input:focus{border-color:var(--color-primary)}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children, error, hint }: { label: string; children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground/80">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
