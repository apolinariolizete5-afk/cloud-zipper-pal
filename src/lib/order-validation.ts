import { z } from "zod";

// Mozambique mobile numbers: 9 digits starting with 82-87 (national)
// or +258 8X XXXXXXX (international). Accept both, store digits only.
export function normalizePhone(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.startsWith("258")) return d.slice(0, 12);
  return d.slice(0, 9);
}

export function formatMzPhone(input: string): string {
  const d = normalizePhone(input);
  // With country code: +258 8X XXX XXXX
  if (d.startsWith("258")) {
    const rest = d.slice(3);
    const p1 = rest.slice(0, 2);
    const p2 = rest.slice(2, 5);
    const p3 = rest.slice(5, 9);
    return `+258 ${p1}${p2 ? " " + p2 : ""}${p3 ? " " + p3 : ""}`.trim();
  }
  // National: 8X XXX XXXX
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 5);
  const p3 = d.slice(5, 9);
  return `${p1}${p2 ? " " + p2 : ""}${p3 ? " " + p3 : ""}`.trim();
}

const mzPhoneRegex = /^(258)?8[2-7]\d{7}$/;

/** true when the value is a valid Mozambican mobile number (with or without 258). */
export function isValidMzPhone(input: string): boolean {
  return mzPhoneRegex.test(normalizePhone(input));
}

/** Returns the number in WhatsApp format (258XXXXXXXXX) or null when invalid. */
export function toWhatsAppNumber(input: string): string | null {
  const d = normalizePhone(input);
  if (!mzPhoneRegex.test(d)) return null;
  return d.startsWith("258") ? d : `258${d}`;
}

export const orderSchema = z.object({
  quantity: z.number().int().min(1, "Quantidade inválida").max(99, "Máx. 99 unidades"),
  province: z.string().min(2, "Selecione a província"),
  name: z
    .string()
    .trim()
    .min(3, "Nome demasiado curto")
    .max(100, "Máx. 100 caracteres")
    .regex(/^[\p{L}\s'.-]+$/u, "Use apenas letras"),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((v) => mzPhoneRegex.test(v), {
      message: "Telefone inválido — ex: 84 123 4567",
    }),
  whatsapp: z
    .string()
    .transform(normalizePhone)
    .refine((v) => v === "" || mzPhoneRegex.test(v), {
      message: "WhatsApp inválido — ex: 84 123 4567",
    }),
  address: z
    .string()
    .trim()
    .min(8, "Endereço demasiado curto (mín. 8 caracteres)")
    .max(200, "Máx. 200 caracteres"),
  schedule: z.string().trim().max(80, "Máx. 80 caracteres"),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: "Confirme a disponibilidade para entrega" }),
  }),
});

export type OrderInput = z.input<typeof orderSchema>;
export type OrderParsed = z.output<typeof orderSchema>;