import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type State = "loading" | "signedOut" | "notAdmin" | "admin";

export function useSignOut() {
  const qc = useQueryClient();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
  };
}

export function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let active = true;
    async function evaluate() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) return setState("signedOut");
      // Rollkontrollen sker i databasen (has_role använder auth.uid()) — inte i klienten.
      const { data: isAdmin } = await supabase.rpc("has_role", { _role: "admin" });
      if (active) setState(isAdmin ? "admin" : "notAdmin");
    }
    void evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void evaluate();
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  if (state === "admin") return <>{children}</>;
  if (state === "loading") return <Shell><Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" aria-label="Laddar" /></Shell>;
  if (state === "notAdmin") {
    return (
      <Shell>
        <h1 className="font-display text-3xl">Ingen behörighet</h1>
        <p className="mt-2 text-sm text-muted-foreground">Kontot är inloggat men saknar adminrollen. Be den som sköter Supabase att lägga till rollen.</p>
        <Button variant="ghost" className="mt-5 w-full" onClick={() => void supabase.auth.signOut()}>Logga ut</Button>
      </Shell>
    );
  }
  return <LoginForm />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr("Fel e-post eller lösenord.");
    setBusy(false);
  }

  return (
    <Shell>
      <div className="mx-auto mb-4 flex size-10 items-center justify-center border border-border"><Lock className="size-4 text-primary" aria-hidden="true" /></div>
      <h1 className="font-display text-3xl">Logga in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Endast för LaunchUF-teamet.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 text-left">
        <div className="space-y-1.5"><Label htmlFor="email">E-post</Label><Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">Lösenord</Label><Input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <Button disabled={busy} className="w-full">{busy ? "Vänta…" : "Logga in"}</Button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm border border-border bg-card p-8 text-center">
        <p className="mb-6 font-display text-3xl">Launch<span className="text-primary">UF</span></p>
        {children}
      </div>
    </div>
  );
}
