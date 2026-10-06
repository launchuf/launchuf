import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrderStatusBadge, PaymentBadge } from "@/components/admin/StatusBadge";
import { fmtDate, type Message, type Order } from "@/lib/admin";
import { PACKAGE_NAMES, formatPrice } from "@/lib/packages";

export const Route = createFileRoute("/admin/")({ component: Overview });

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-4xl text-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Overview() {
  const orders = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });
  const messages = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Message[];
    },
  });

  if (orders.isLoading) return <p className="text-muted-foreground">Laddar…</p>;
  if (orders.error) return <p role="alert" className="text-destructive">Kunde inte hämta beställningar. Kontrollera att schemat är körts och att du är admin.</p>;
  const list = orders.data ?? [];
  const open = list.filter((o) => o.status !== "cancelled" && o.status !== "completed");
  const revenue = list.filter((o) => o.payment_status === "paid").reduce((sum, o) => sum + o.amount_kr, 0);
  const unpaid = list.filter((o) => o.status !== "cancelled" && (o.payment_status === "unpaid" || o.payment_status === "pending"));
  const unhandled = (messages.data ?? []).filter((m) => !m.handled).length;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">Översikt</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Nya beställningar" value={list.filter((o) => o.status === "new").length} />
        <Stat label="Pågående projekt" value={open.length} hint="Ej klara eller avbrutna" />
        <Stat label="Väntar på betalning" value={unpaid.length} hint={formatPrice(unpaid.reduce((s, o) => s + o.amount_kr, 0))} />
        <Stat label="Intäkter (betalda)" value={formatPrice(revenue)} />
        <Stat label="Behöver offert" value={list.filter((o) => o.needs_quote && o.status !== "cancelled").length} />
        <Stat label="Obesvarade meddelanden" value={unhandled} />
      </div>

      <section aria-labelledby="latest">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="latest" className="font-display text-2xl">Senaste beställningar</h2>
          <Link to="/admin/bestallningar" className="text-primary hover:underline">Visa alla</Link>
        </div>
        <div className="divide-y divide-border border border-border bg-card">
          {list.slice(0, 6).map((o) => (
            <Link key={o.id} to="/admin/bestallningar" search={{ id: o.id }} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted">
              <div>
                <p className="font-medium">{o.company_name}</p>
                <p className="text-xs text-muted-foreground">{o.order_number} · {PACKAGE_NAMES[o.package_code]} · {fmtDate(o.created_at)}</p>
              </div>
              <div className="flex items-center gap-2"><OrderStatusBadge status={o.status} /><PaymentBadge status={o.payment_status} /></div>
            </Link>
          ))}
          {list.length === 0 && <p className="p-6 text-muted-foreground">Inga beställningar ännu.</p>}
        </div>
      </section>
    </div>
  );
}
