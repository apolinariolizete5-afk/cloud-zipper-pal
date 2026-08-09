import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const eventSchema = z.object({
  event_type: z.enum(["page_view", "order_click", "order_submit"]),
});

// Analytics logging is server-side only: the table has no public insert policy.
export const logEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => eventSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("analytics_events").insert({ event_type: data.event_type });
    return { ok: true };
  });

const viewSchema = z.object({
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
});

// View counting runs through the server; the RPC is not exposed to the public API.
export const registerProductView = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => viewSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("increment_product_view", { _slug: data.slug });
    return { ok: true };
  });
