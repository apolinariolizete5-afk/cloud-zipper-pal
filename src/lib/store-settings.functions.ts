// Public storefront configuration. The order_settings table is no longer
// readable by anonymous visitors; the storefront reads only the fields it
// needs through this server function.
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
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("order_settings")
      .select("id, mode, whatsapp_number, whatsapp_template, external_url")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("getPublicOrderSettings error", error);
      return null;
    }
    return (data as PublicOrderSettings | null) ?? null;
  },
);
