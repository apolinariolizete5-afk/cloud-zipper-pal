import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SiteContent, OrderSettings } from "./store-types";

export function useSiteContent() {
  return useQuery({
    queryKey: ["site_content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content" as never)
        .select("data")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data as { data: SiteContent } | null)?.data ?? null;
    },
  });
}

export function useOrderSettings() {
  return useQuery({
    queryKey: ["order_settings"],
    queryFn: async () => {
      const { getPublicOrderSettings } = await import(
        "./store-settings.functions"
      );
      const data = await getPublicOrderSettings();
      return (data as OrderSettings | null) ?? null;
    },
  });
}

export async function trackEvent(event_type: "page_view" | "order_click" | "order_submit") {
  try {
    const { logEvent } = await import("./telemetry.functions");
    await logEvent({ data: { event_type } });
  } catch {
    // silent
  }
}