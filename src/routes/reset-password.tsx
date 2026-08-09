import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Definir nova senha — Polyset Store" },
      { name: "description", content: "Defina uma nova senha para a sua conta de administração da Polyset Store." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Definir nova senha — Polyset Store" },
      { property: "og:description", content: "Recuperação de acesso ao painel Polyset Store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Não foi possível definir a senha. Peça um novo link de recuperação.");
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/admin" }), 1200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-lift)]">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-foreground">Definir nova senha</h1>
          <p className="text-xs text-muted-foreground">Abra esta página a partir do link enviado por email.</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Nova senha (mín. 8)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        {done && <p className="text-xs font-medium text-success">Senha atualizada. A redirecionar…</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar nova senha
        </button>
      </form>
    </div>
  );
}
