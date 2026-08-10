import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Check whether an administrator already exists.
export const adminExists = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin.rpc("admin_exists");


    if (error) {
      throw new Error(error.message);
    }

    return {
      exists: Boolean(data),
    };
  },
);

// Bootstrap: promote the currently authenticated user if no admin exists.
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase.rpc("claim_first_admin");

    if (error) {
      throw new Error(error.message);
    }

    return data
      ? {
          ok: true,
          reason: "granted" as const,
        }
      : {
          ok: false,
          reason: "already_bootstrapped" as const,
        };
  });

// List administrators.
export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase.rpc("list_admins");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      user_id: row.user_id,
      email: row.email ?? "",
      created_at: row.created_at,
    }));
  });

// Grant administrator role by email.
export const grantAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email("Email inválido").max(255),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: result, error } = await supabase.rpc(
      "grant_admin_by_email",
      {
        target_email: data.email.toLowerCase(),
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    const user = result?.[0];

    if (!user) {
      throw new Error("Utilizador não encontrado.");
    }

    return {
      ok: true,
      user_id: user.user_id,
      email: user.email,
    };
  });

// Revoke administrator role.
export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        user_id: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: result, error } = await supabase.rpc(
      "revoke_admin",
      {
        target_user_id: data.user_id,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    return {
      ok: Boolean(result),
    };
  });

// Reset administrator roles.
//
// Note: Supabase Auth accounts are NOT deleted.
// Deleting auth.users requires the Admin API/service-role key.
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
  .handler(async ({ data }) => {
    if (data.deleteAccounts) {
      throw new Error(
        "A eliminação de contas de autenticação requer a Supabase Admin API.",
      );
    }

    const { data: removed, error } =
      await supabase.rpc("reset_admins");

    if (error) {
      throw new Error(error.message);
    }

    return {
      ok: true,
      removed: Number(removed ?? 0),
      deletedAccounts: 0,
    };
  });
