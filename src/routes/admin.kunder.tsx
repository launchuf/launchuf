import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["client_sites"]["Row"];
export const Route = createFileRoute("/admin/kunder")({ component: ClientsPage });

function normalizeUrl(raw: string): string | null {
  let v = raw.trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  v = v.replace(/^http:\/\//i, "https://");
  try { const u = new URL(v); return u.hostname.includes(".") ? u.toString() : null; } catch { return null; }
}

function ClientsPage() {
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin", "clients"] });
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");

  const clients = useQuery({
    queryKey: ["admin", "clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_sites").select("*").order("sort_order").order("created_at");
      if (error) throw error;
      return data as Client[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const clean = normalizeUrl(url);
      if (!name.trim()) throw new Error("Skriv kundens namn.");
      if (!clean) throw new Error("Skriv en giltig webbadress (t.ex. kund.se).");
      const nextOrder = Math.max(0, ...(clients.data ?? []).map((c) => c.sort_order)) + 1;
      const { error } = await supabase.from("client_sites").insert({ name: name.trim(), url: clean, description: desc.trim(), sort_order: nextOrder });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Kunden är tillagd"); setName(""); setUrl(""); setDesc(""); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte spara"),
  });

  const update = useMutation({
    mutationFn: async (patch: { id: string } & Partial<Client>) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("client_sites").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh, onError: () => toast.error("Kunde inte uppdatera"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("client_sites").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Borttagen"); refresh(); }, onError: () => toast.error("Kunde inte ta bort"),
  });

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-4xl">Kunder</h1>
        <p className="mt-1 text-xs text-muted-foreground">Visas som kort med klickbar länk i sektionen ”Våra kunder” på startsidan. Sektionen döljs om listan är tom.</p>
      </div>

      <form className="grid gap-4 border border-border bg-card p-6 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
        <label className="space-y-1 text-xs">Kundens namn *<Input maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="space-y-1 text-xs">Webbadress *<Input maxLength={300} placeholder="kund.se" value={url} onChange={(e) => setUrl(e.target.value)} /></label>
        <label className="space-y-1 text-xs sm:col-span-2">Kort beskrivning (valfritt)<Input maxLength={300} value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
        <div className="sm:col-span-2"><Button type="submit" disabled={add.isPending}><Plus /> {add.isPending ? "Sparar…" : "Lägg till kund"}</Button></div>
      </form>

      {clients.isLoading && <p className="text-muted-foreground">Laddar…</p>}
      {clients.error && <p role="alert" className="text-destructive">Kunde inte hämta kunder. Har du kört SQL-tillägget för client_sites?</p>}

      <ul className="space-y-3">
        {(clients.data ?? []).map((c) => (
          <li key={c.id} className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p className="font-medium">{c.name}</p>
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 truncate text-xs text-primary hover:underline">{c.url}<ExternalLink className="size-3" aria-hidden="true" /></a>
              {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" className="accent-[var(--color-primary)]" checked={c.visible} onChange={(e) => update.mutate({ id: c.id, visible: e.target.checked })} /> Visa
              </label>
              <label className="flex items-center gap-2 text-xs">Ordning
                <Input className="h-9 w-16" inputMode="numeric" defaultValue={c.sort_order} onBlur={(e) => { const n = Number.parseInt(e.target.value, 10); if (Number.isFinite(n) && n !== c.sort_order) update.mutate({ id: c.id, sort_order: n }); }} />
              </label>
              <Button size="icon" variant="destructive" aria-label={`Ta bort ${c.name}`} onClick={() => { if (window.confirm(`Ta bort ${c.name}?`)) remove.mutate(c.id); }}><Trash2 /></Button>
            </div>
          </li>
        ))}
        {!clients.isLoading && (clients.data ?? []).length === 0 && <li className="text-muted-foreground">Inga kunder tillagda ännu.</li>}
      </ul>
    </div>
  );
}
