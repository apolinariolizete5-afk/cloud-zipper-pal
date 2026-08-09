import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Public check: does any admin already exist? Used by the login screen to
// hide the "Create account" option after initial provisioning.
export const adminExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw new Error(error.message);
  return { exists: (count ?? 0) > 0 };
});

// Bootstrap: if there is no admin yet, promote the current signed-in user.
// Safe because it's a one-shot; once any admin exists, further calls no-op.
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) {
      return { ok: false, reason: "already_bootstrapped" as const };
    }
    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insErr) throw new Error(insErr.message);
    return { ok: true, reason: "granted" as const };
  });

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso negado.");
}

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const ids = (roles ?? []).map((r: any) => r.user_id);
    if (ids.length === 0) return [] as { user_id: string; email: string; created_at: string }[];
    const { data: list, error: lErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (lErr) throw new Error(lErr.message);
    const byId = new Map(list.users.map((u) => [u.id, u.email ?? ""] as const));
    return (roles ?? []).map((r: any) => ({
      user_id: r.user_id,
      email: byId.get(r.user_id) ?? "(utilizador removido)",
      created_at: r.created_at,
    }));
  });

export const grantAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ email: z.string().trim().email("Email inválido").max(255) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const target = data.email.toLowerCase();
    const { data: list, error: lErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (lErr) throw new Error(lErr.message);
    const user = list.users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (!user) throw new Error("Utilizador não encontrado. Peça-lhe para criar conta primeiro.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true, user_id: user.id, email: user.email };
  });

export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.user_id === context.userId) {
      throw new Error("Não pode remover o seu próprio acesso.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Danger: remove ALL admins (including the caller) and optionally delete their
// auth accounts. After this, the app is back to the "primeiro admin" state and
// the next signed-in user can claim admin via claimFirstAdmin.
export const resetAdmins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        confirm: z.literal("RESET"),
        deleteAccounts: z.boolean().optional().default(false),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error: selErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (selErr) throw new Error(selErr.message);
    const ids = Array.from(new Set((rows ?? []).map((r: any) => r.user_id as string)));

    const { error: delErr } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("role", "admin");
    if (delErr) throw new Error(delErr.message);

    let deletedAccounts = 0;
    if (data.deleteAccounts) {
      for (const id of ids) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (!error) deletedAccounts++;
      }
    }

    return { ok: true, removed: ids.length, deletedAccounts };
  });