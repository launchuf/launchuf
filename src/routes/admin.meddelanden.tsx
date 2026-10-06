import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { fmtDate, type Message } from "@/lib/admin";

export const Route = createFileRoute("/admin/meddelanden")({ component: MessagesPage });

function MessagesPage() {
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin", "messages"] });
  const messages = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Message[];
    },
  });
  const toggle = useMutation({
    mutationFn: async (m: Message) => { const { error } = await supabase.from("contact_messages").update({ handled: !m.handled }).eq("id", m.id); if (error) throw error; },
    onSuccess: refresh, onError: () => toast.error("Kunde inte uppdatera"),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("contact_messages").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Meddelandet är borttaget"); refresh(); }, onError: () => toast.error("Kunde inte ta bort"),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Meddelanden</h1>
      {messages.isLoading && <p className="text-muted-foreground">Laddar…</p>}
      {messages.error && <p role="alert" className="text-destructive">Kunde inte hämta meddelanden.</p>}
      <ul className="space-y-3">
        {(messages.data ?? []).map((m) => (
          <li key={m.id} className={`border bg-card p-5 ${m.handled ? "border-border opacity-70" : "border-primary/60"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{m.name} <a className="text-primary underline" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + (m.subject ?? "Ditt meddelande till LaunchUF"))}`}>{m.email}</a></p>
                <p className="text-xs text-muted-foreground">{fmtDate(m.created_at)}{m.subject ? ` · ${m.subject}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggle.mutate(m)}><Check /> {m.handled ? "Markera obesvarad" : "Markera besvarad"}</Button>
                <Button size="sm" variant="destructive" onClick={() => { if (window.confirm("Ta bort meddelandet permanent?")) remove.mutate(m.id); }} aria-label="Ta bort meddelande"><Trash2 /></Button>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words leading-6">{m.message}</p>
          </li>
        ))}
        {!messages.isLoading && (messages.data ?? []).length === 0 && <li className="text-muted-foreground">Inga meddelanden.</li>}
      </ul>
    </div>
  );
}
