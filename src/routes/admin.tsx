import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstAdmin, adminExists } from "@/lib/admin.functions";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { Loader2, LogIn, ShieldCheck, UserPlus } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel de Administração — Polyset Store" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const [session, setSession] = useState<null | { userId: string; email: string }>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles" as never)
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (s?.user) {
        setSession({ userId: s.user.id, email: s.user.email ?? "" });
        await refreshRole(s.user.id);
      } else {
        setSession(null);
        setIsAdmin(false);
      }
      setReady(true);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        setSession({ userId: data.session.user.id, email: data.session.user.email ?? "" });
        await refreshRole(data.session.user.id);
      }
      setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <AdminLogin />;
  if (!isAdmin) return <NoAccess email={session.email} userId={session.userId} onGranted={() => refreshRole(session.userId)} />;

  return <AdminPanel onLogout={() => supabase.auth.signOut()} />;
}

function AdminLogin() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signupAllowed, setSignupAllowed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const checkAdmin = useServerFn(adminExists);

  useEffect(() => {
    // Only expose "Create account" if there is no admin yet.
    checkAdmin()
      .then((r) => {
        const allowed = !r.exists;
        setSignupAllowed(allowed);
        // Se ainda não há admin, começa direto no modo "criar conta".
        setMode(allowed ? "signup" : "signin");
      })
      .catch(() => setSignupAllowed(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError("Credenciais inválidas.");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) {
          setError(error.message);
        } else if (!data.session) {
          setInfo("Conta criada. Verifique o seu email para confirmar antes de entrar.");
        }
      }
    } catch (e: any) {
      setError(e?.message ?? "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Escreva o seu email primeiro para receber o link de recuperação.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) setError(error.message);
    else setInfo("Enviámos um link de recuperação para o seu email.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-lift)]">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
            <LogIn className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-foreground">
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="text-xs text-muted-foreground">Painel de Administração — Polyset Store</p>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Senha {mode === "signup" && <span className="text-muted-foreground">(mín. 8)</span>}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        {info && <p className="text-xs font-medium text-success">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Entrar" : "Criar conta"}
        </button>

        {mode === "signin" && (
          <button
            type="button"
            onClick={forgotPassword}
            className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Esqueci a minha senha
          </button>
        )}

        {signupAllowed && (
          <button
            type="button"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        )}
      </form>
    </div>
  );
}

function NoAccess({ email, userId, onGranted }: { email: string; userId: string; onGranted: () => void }) {
  const claim = useServerFn(claimFirstAdmin);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const tryClaim = async () => {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await claim();
      if (res.ok) {
        setMsg("Acesso de administrador concedido.");
        onGranted();
      } else {
        setErr("Já existe um administrador. Peça-lhe para lhe conceder acesso.");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao reivindicar acesso.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-5 rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-lift)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Sem acesso</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {email || `Utilizador ${userId.slice(0, 8)}`} ainda não é administrador.
          </p>
        </div>
        <button
          onClick={tryClaim}
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Reivindicar acesso (primeiro admin)
        </button>
        <p className="text-[11px] text-muted-foreground">
          Só funciona se ainda não existir nenhum administrador. Caso contrário, peça a um admin existente para o adicionar em "Utilizadores".
        </p>
        {msg && <p className="text-xs font-medium text-success">{msg}</p>}
        {err && <p className="text-xs font-medium text-destructive">{err}</p>}
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Sair
        </button>
      </div>
    </div>
  );
}