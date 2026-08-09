import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  original_price: number | null;
  currency: string;
  category: string;
  image: string | null;
  whatsapp_number: string | null;
  gallery: string[];
  benefits: string[];
  stock: number;
  active: boolean;
  featured: boolean;
  view_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function normalize(row: any): Product {
  return {
    ...row,
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
    price: Number(row.price ?? 0),
    original_price: row.original_price != null ? Number(row.original_price) : null,
  } as Product;
}

export function useProducts(opts: { activeOnly?: boolean } = {}) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["products", opts.activeOnly ?? true],
    queryFn: async () => {
      let query = supabase.from("products").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
      if (opts.activeOnly !== false) query = query.eq("active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(normalize);
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        qc.invalidateQueries({ queryKey: ["products"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return q;
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data ? normalize(data) : null;
    },
    enabled: !!slug,
  });
}

export async function incrementProductView(slug: string) {
  try {
    // Debounce per slug per session
    if (typeof window !== "undefined") {
      const key = `pv:${slug}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    }
    const { registerProductView } = await import("./telemetry.functions");
    await registerProductView({ data: { slug } });
  } catch {
    // silent
  }
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || `produto-${Date.now()}`;
}

export function useUpsertProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Product> & { name: string; price: number }) => {
      const payload: any = { ...input };
      if (!payload.slug) payload.slug = slugify(payload.name);
      const { data, error } = payload.id
        ? await supabase.from("products").update(payload).eq("id", payload.id).select().single()
        : await supabase.from("products").insert(payload).select().single();
      if (error) throw error;
      return normalize(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}