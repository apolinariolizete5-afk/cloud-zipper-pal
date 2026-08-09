import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "./products";

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Normalização usada para detetar duplicados (sem acentos, sem espaços extra). */
export function normalizeCategoryName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function findDuplicate(list: Category[], name: string, ignoreId?: string) {
  const n = normalizeCategoryName(name);
  return list.find((c) => c.id !== ignoreId && normalizeCategoryName(c.name) === n) ?? null;
}

export function useCategories(opts: { activeOnly?: boolean } = {}) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["categories", opts.activeOnly ?? false],
    queryFn: async () => {
      let query = supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (opts.activeOnly) query = query.eq("active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("categories-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        qc.invalidateQueries({ queryKey: ["categories"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return q;
}

function cleanName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; sort_order?: number }) => {
      const name = cleanName(input.name);
      if (!name) throw new Error("O nome da categoria é obrigatório.");
      const { data, error } = await supabase
        .from("categories")
        .insert({ name, slug: slugify(name), sort_order: input.sort_order ?? 0 })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("Esta categoria já existe.");
        throw error;
      }
      return data as Category;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; active?: boolean; sort_order?: number; previousName?: string }) => {
      const patch: { name?: string; slug?: string; active?: boolean; sort_order?: number } = {};
      if (input.name !== undefined) {
        const name = cleanName(input.name);
        if (!name) throw new Error("O nome da categoria é obrigatório.");
        patch.name = name;
        patch.slug = slugify(name);
      }
      if (input.active !== undefined) patch.active = input.active;
      if (input.sort_order !== undefined) patch.sort_order = input.sort_order;

      const { error } = await supabase.from("categories").update(patch).eq("id", input.id);
      if (error) {
        if (error.code === "23505") throw new Error("Já existe uma categoria com esse nome.");
        throw error;
      }

      // Mantém os produtos sincronizados quando a categoria é renomeada.
      if (patch.name && input.previousName && input.previousName !== patch.name) {
        const { error: pErr } = await supabase
          .from("products")
          .update({ category: patch.name as string })
          .eq("category", input.previousName);
        if (pErr) throw pErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
