// Public storefront configuration. The order_settings table is not readable by
// anonymous visitors; the storefront reads only the non-sensitive fields through
// the security-definer RPC get_public_order_settings.
import { createServerFn } from "@tanstack/react-start";

export interface PublicOrderSettings {
  id: number;
  mode: string;
  whatsapp_number: string;
  whatsapp_template: string;
  external_url: string;
}

export const getPublicOrderSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
    const key =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ??
      process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

    if (!url || !key) {
      console.error("getPublicOrderSettings: missing Supabase config");
      return null;
    }

    const client = createClient(url, key, {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await client.rpc("get_public_order_settings");

    if (error) {
      console.error("getPublicOrderSettings error", error);
      return null;
    }
    const row = Array.isArray(data) ? data[0] : data;
    return (row as PublicOrderSettings | null) ?? null;
  },
);
