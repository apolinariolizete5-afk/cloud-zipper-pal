import { useMemo, useState } from "react";
import { Star, Loader2, MessageSquarePlus } from "lucide-react";
import { useReviews, useSubmitReview, type Review } from "@/lib/reviews";

interface ReviewsProps {
  productId?: string | null;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function Reviews({ productId = null, title = "Avaliações reais", subtitle, compact }: ReviewsProps) {
  const { data: reviews, isLoading } = useReviews(productId);
  const submit = useSubmitReview();

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const stats = useMemo(() => {
    const list = reviews ?? [];
    if (!list.length) return { avg: 0, count: 0 };
    const sum = list.reduce((a, r) => a + r.rating, 0);
    return { avg: sum / list.length, count: list.length };
  }, [reviews]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    const trimmedName = name.trim();
    const trimmedComment = comment.trim();
    if (trimmedName.length < 2) return setError("Indique o seu nome (mín. 2 caracteres).");
    if (trimmedComment.length < 3) return setError("Escreva um comentário (mín. 3 caracteres).");
    if (rating < 1 || rating > 5) return setError("Selecione uma classificação de 1 a 5 estrelas.");
    try {
      await submit.mutateAsync({ product_id: productId ?? null, author_name: trimmedName, rating, comment: trimmedComment });
      setName("");
      setComment("");
      setRating(5);
      setOk(true);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível enviar a avaliação.");
    }
  };

  return (
    <section className={compact ? "" : "bg-muted/40 py-16 md:py-24"}>
      <div className={compact ? "" : "mx-auto max-w-6xl px-4 sm:px-6"}>
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Reviews</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {stats.count > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
              <div className="flex text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(stats.avg) ? "fill-current" : "opacity-30"}`} />
                ))}
              </div>
              <span className="text-sm font-medium">{stats.avg.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({stats.count})</span>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {isLoading ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (reviews ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Ainda sem avaliações. Seja o primeiro a avaliar!
              </div>
            ) : (
              (reviews ?? []).map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </div>

          <form
            onSubmit={onSubmit}
            className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquarePlus className="h-4 w-4 text-primary" /> Deixe a sua avaliação
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">O seu nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Ex.: Ana Costa"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Classificação</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(n)}
                    className="p-1"
                    aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-6 w-6 transition ${
                        n <= (hover || rating) ? "fill-current text-gold" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Comentário</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={1000}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Conte-nos a sua experiência…"
              />
              <p className="mt-1 text-right text-[10px] text-muted-foreground">{comment.length}/1000</p>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {ok && <p className="text-xs text-success">Obrigado! A sua avaliação foi enviada e será publicada após revisão.</p>}
            <button
              type="submit"
              disabled={submit.isPending}
              className="w-full rounded-full bg-gradient-primary py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-[var(--shadow-lift)] transition hover:brightness-110 disabled:opacity-60"
            >
              {submit.isPending ? "A enviar…" : "Publicar avaliação"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <figure className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex text-gold">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-current" : "opacity-30"}`} />
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground">{date}</span>
      </div>
      <blockquote className="whitespace-pre-line text-sm text-foreground/90">"{review.comment}"</blockquote>
      <figcaption className="mt-3 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
          {review.author_name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium">{review.author_name}</span>
      </figcaption>
    </figure>
  );
}