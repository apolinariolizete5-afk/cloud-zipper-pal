import { useEffect, useState } from "react";
import { Minus, Plus, X, Loader2 } from "lucide-react";
import type { OrderFormData, OrderSettings } from "@/lib/store-types";
import { PROVINCES } from "@/lib/store-types";
import { trackEvent } from "@/lib/use-store-data";
import { orderSchema, formatMzPhone, normalizePhone } from "@/lib/order-validation";

export interface OrderProduct {
  name: string;
  price: number;
  currency: string;
  whatsapp_number?: string | null;
}

export function OrderModal({
  open,
  onClose,
  product,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  product: OrderProduct;
  settings: OrderSettings | null;
}) {
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

  const total = form.quantity * product.price;

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
    const result = orderSchema.safeParse(form);
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

    const enc = (s: string) => encodeURIComponent(s).replace(/%0A/g, "%0A");
    const msg = settings.whatsapp_template
      .replaceAll("{product}", enc(product.name))
      .replaceAll("{quantity}", String(parsed.quantity))
      .replaceAll("{total}", enc(`${total.toLocaleString()} ${product.currency}`))
      .replaceAll("{name}", enc(parsed.name))
      .replaceAll("{phone}", enc(formatMzPhone(parsed.phone)))
      .replaceAll("{whatsapp}", enc(formatMzPhone(parsed.whatsapp || parsed.phone)))
      .replaceAll("{province}", enc(parsed.province))
      .replaceAll("{address}", enc(parsed.address))
      .replaceAll("{schedule}", enc(parsed.schedule || "Não especificado"));

    const num = normalizePhone(product.whatsapp_number?.trim() || settings.whatsapp_number);
    window.location.href = `https://wa.me/${num}?text=${msg}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-3xl bg-card shadow-[var(--shadow-lift)] sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Concluir pedido</h3>
            <p className="text-xs text-muted-foreground">Preencha os seus dados para finalizar</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="rounded-2xl bg-muted/60 p-4">
            <p className="text-sm font-medium text-foreground">{product.name}</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setField("quantity", Math.max(1, form.quantity - 1))}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{form.quantity}</span>
                <button
                  type="button"
                  onClick={() => setField("quantity", form.quantity + 1)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold text-foreground">
                  {total.toLocaleString()} {product.currency}
                </p>
              </div>
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
                className="input"
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
                className="input"
              />
            </Field>
          </div>

          <Field label="WhatsApp principal" error={errors.whatsapp} hint="Deixe vazio para usar o telefone">
            <input
              value={form.whatsapp}
              onChange={(e) => onPhoneChange("whatsapp", e.target.value)}
              maxLength={17}
              inputMode="tel"
              autoComplete="tel"
              placeholder="84 123 4567"
              className="input"
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
              className="input"
            />
          </Field>

          <Field label="Horário preferido para entrega" error={errors.schedule}>
            <input
              value={form.schedule}
              onChange={(e) => setField("schedule", e.target.value)}
              placeholder="Ex: 14h–18h"
              maxLength={80}
              className="input"
            />
          </Field>

          <div>
            <label className={`flex items-start gap-3 rounded-xl border p-3 ${errors.confirmed ? "border-destructive bg-destructive/5" : "border-border bg-muted/40"}`}>
              <input
                type="checkbox"
                checked={form.confirmed}
                onChange={(e) => { setField("confirmed", e.target.checked); clearErr("confirmed"); }}
                className="mt-0.5 h-4 w-4 accent-[oklch(0.55_0.12_25)]"
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
            Concluir pedido
          </button>
        </form>
      </div>

      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--color-border);background:var(--color-background);padding:0.625rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
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