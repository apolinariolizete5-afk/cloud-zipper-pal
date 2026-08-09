import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  product_id: string | null;
  author_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

export function useReviews(productId?: string | null) {
  const qc = useQueryClient();
  const key = ["reviews", productId ?? "all"];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      let query = supabase
        .from("reviews")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (productId) query = query.eq("product_id", productId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`reviews-${productId ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        qc.invalidateQueries({ queryKey: ["reviews"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, productId]);

  return q;
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { product_id?: string | null; author_name: string; rating: number; comment: string }) => {
      const payload = {
        product_id: input.product_id ?? null,
        author_name: input.author_name.trim(),
        rating: Math.max(1, Math.min(5, Math.round(input.rating))),
        comment: input.comment.trim(),
        // Public submissions stay hidden until an admin approves them.
        approved: false,
      };
      const { error } = await supabase.from("reviews").insert(payload);
      if (error) throw error;
      return payload as unknown as Review;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export async function adminListAllReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function adminDeleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

export async function adminSetReviewApproved(id: string, approved: boolean) {
  const { error } = await supabase.from("reviews").update({ approved }).eq("id", id);
  if (error) throw error;
}