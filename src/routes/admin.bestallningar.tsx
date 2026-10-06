import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { OrderStatusBadge, PaymentBadge } from "@/components/admin/StatusBadge";
import {
  PAYMENT_LABEL, PAYMENT_ORDER, STATUS_LABEL, STATUS_ORDER, briefOf, downloadText, fmtDate, ordersToCsv, type Order,
} from "@/lib/admin";
import {
  COMPANY_TYPES, CONTENT_SOURCES, DOMAIN_OPTIONS, FEATURES, GOALS, HEARD_FROM, IMAGERY, STYLES, labelOf,
} from "@/lib/brief";
import { ALL_PACKAGES, PACKAGE_NAMES, formatPrice } from "@/lib/packages";
import type { OrderStatus, PaymentStatus } from "@/integrations/supabase/types";

const search = z.object({ id: z.string().uuid().optional().catch(undefined) });
export const Route = createFileRoute("/admin/bestallningar")({
  validateSearch: (s: Record<string, unknown>) => search.parse(s),
  component: OrdersPage,
});

function OrdersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const [q, setQ] = useState("");
  const [pkg, setPkg] = useState("");
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState("");
  const [adding, setAdding] = useState(false);

  const orders = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (orders.data ?? []).filter((o) =>
      (!pkg || o.package_code === pkg) && (!status || o.status === status) && (!pay || o.payment_status === pay) &&
      (!term || [o.company_name, o.contact_name, o.email, o.order_number].some((v) => v.toLowerCase().includes(term))));
  }, [orders.data, q, pkg, status, pay]);

  const selected = (orders.data ?? []).find((o) => o.id === id) ?? null;
  const close = () => void navigate({ to: "/admin/bestallningar", search: {} });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Beställningar</h1>
        <div className="flex gap-2">
        <Button onClick={() => setAdding(true)}><Plus /> Ny beställning</Button>
        <Button variant="outline" onClick={() => downloadText(`launchuf-bestallningar-${new Date().toISOString().slice(0, 10)}.csv`, ordersToCsv(filtered))} disabled={filtered.length === 0}>
          <Download /> Exportera CSV
        </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_repeat(3,10rem)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Sök beställning" placeholder="Sök företag, namn, e-post, nummer…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select aria-label="Paket" className="field" value={pkg} onChange={(e) => setPkg(e.target.value)}>
          <option value="">Alla paket</option>{[...ALL_PACKAGES, "custom" as const].map((c) => <option key={c} value={c}>{PACKAGE_NAMES[c]}</option>)}
        </select>
        <select aria-label="Status" className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Alla statusar</option>{STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select aria-label="Betalning" className="field" value={pay} onChange={(e) => setPay(e.target.value)}>
          <option value="">Alla betalningar</option>{PAYMENT_ORDER.map((s) => <option key={s} value={s}>{PAYMENT_LABEL[s]}</option>)}
        </select>
      </div>

      {orders.isLoading && <p className="text-muted-foreground">Laddar…</p>}
      {orders.error && <p role="alert" className="text-destructive">Kunde inte hämta beställningar.</p>}

      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Företag</th><th className="p-3">Paket</th><th className="p-3">Belopp</th><th className="p-3">Status</th><th className="p-3">Betalning</th><th className="p-3">Datum</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((o) => (
              <tr key={o.id} className="cursor-pointer hover:bg-muted" onClick={() => void navigate({ to: "/admin/bestallningar", search: { id: o.id } })}>
                <td className="p-3">
                  <button type="button" className="text-left font-medium text-primary hover:underline" onClick={(e) => { e.stopPropagation(); void navigate({ to: "/admin/bestallningar", search: { id: o.id } }); }}>{o.company_name}</button>
                  <div className="text-xs text-muted-foreground">{o.order_number}{o.needs_quote ? " · offert" : ""}</div>
                </td>
                <td className="p-3">{PACKAGE_NAMES[o.package_code]}</td>
                <td className="p-3">{formatPrice(o.amount_kr)}</td>
                <td className="p-3"><OrderStatusBadge status={o.status} /></td>
                <td className="p-3"><PaymentBadge status={o.payment_status} /></td>
                <td className="p-3 text-muted-foreground">{fmtDate(o.created_at)}</td>
              </tr>
            ))}
            {!orders.isLoading && filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-muted-foreground">Inga beställningar matchar.</td></tr>}
          </tbody>
        </table>
      </div>

      <ManualOrderDialog open={adding} onOpenChange={setAdding} />

      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) close(); }}>
        <SheetContent className="w-full overflow-y-auto border-border bg-background sm:max-w-2xl">
          {selected && <OrderDetail key={selected.id} order={selected} onDeleted={() => { close(); void qc.invalidateQueries({ queryKey: ["admin", "orders"] }); }} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === "" || children === false) return null;
  return (
    <div className="grid gap-1 border-b border-border py-3 sm:grid-cols-[170px_1fr]">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap break-words">{children}</dd>
    </div>
  );
}

function OrderDetail({ order, onDeleted }: { order: Order; onDeleted: () => void }) {
  const qc = useQueryClient();
  const b = briefOf(order);
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
  const list = (k: string) => (Array.isArray(b[k]) ? (b[k] as string[]) : []);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [payment, setPayment] = useState<PaymentStatus>(order.payment_status);
  const [notes, setNotes] = useState(order.internal_notes ?? "");
  const [next, setNext] = useState(order.next_action ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!order.logo_path) return;
    let active = true;
    void supabase.storage.from("order-logos").createSignedUrl(order.logo_path, 600).then(({ data }) => { if (active) setLogoUrl(data?.signedUrl ?? null); });
    return () => { active = false; };
  }, [order.logo_path]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orders").update({ status, payment_status: payment, internal_notes: notes.trim() || null, next_action: next.trim() || null }).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Sparat"); void qc.invalidateQueries({ queryKey: ["admin", "orders"] }); },
    onError: () => toast.error("Kunde inte spara"),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (order.logo_path) await supabase.storage.from("order-logos").remove([order.logo_path]);
      const { error } = await supabase.from("orders").delete().eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Beställningen är borttagen"); onDeleted(); },
    onError: () => toast.error("Kunde inte ta bort beställningen"),
  });

  return (
    <>
      <SheetTitle className="font-display text-3xl">{order.company_name}</SheetTitle>
      <SheetDescription className="text-xs">{order.order_number} · {fmtDate(order.created_at)}</SheetDescription>

      <section className="mt-6 space-y-4 border border-border bg-secondary p-4" aria-label="Hantera">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs">Status
            <select className="field" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>{STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
          </label>
          <label className="space-y-1 text-xs">Betalning
            <select className="field" value={payment} onChange={(e) => setPayment(e.target.value as PaymentStatus)}>{PAYMENT_ORDER.map((s) => <option key={s} value={s}>{PAYMENT_LABEL[s]}</option>)}</select>
          </label>
        </div>
        <label className="block space-y-1 text-xs">Nästa åtgärd<Input maxLength={500} value={next} onChange={(e) => setNext(e.target.value)} /></label>
        <label className="block space-y-1 text-xs">Interna anteckningar<Textarea rows={4} maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <div className="flex flex-wrap justify-between gap-3">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Sparar…" : "Spara ändringar"}</Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}><Trash2 /> Ta bort beställning</Button>
        </div>
      </section>

      <dl className="mt-6">
        <Row label="Paket">{PACKAGE_NAMES[order.package_code]} — {formatPrice(order.amount_kr)}{order.needs_quote ? " (offert behövs — priset kan skilja)" : ""}</Row>
        <Row label="Källa">{order.source === "manual" ? "Manuellt tillagd" : "Webbformulär"}</Row>
        <Row label="Betalval">{order.source === "manual" ? "" : order.pay_preference === "now" ? "Ville betala direkt" : "Betala senare"}</Row>
        <Row label="Kontaktperson">{order.contact_name}</Row>
        <Row label="E-post"><a className="text-primary underline" href={`mailto:${order.email}`}>{order.email}</a></Row>
        <Row label="Telefon">{order.phone}</Row>
        <Row label="Typ">{labelOf(COMPANY_TYPES, str("companyType"))}</Row>
        <Row label="Ort / skola">{str("city")}</Row>
        <Row label="Hittade oss via">{str("heardFrom") && labelOf(HEARD_FROM, str("heardFrom"))}</Row>
        <Row label="Verksamhet">{str("description")}</Row>
        <Row label="Målgrupp">{str("audience")}</Row>
        <Row label="Styrkor">{str("usp")}</Row>
        <Row label="Mål med sidan">{labelOf(GOALS, str("goal"))}</Row>
        <Row label="Sidor">{list("pages").join(", ")}</Row>
        <Row label="Kommentar sidor">{str("pagesNote")}</Row>
        <Row label="Funktioner">{list("features").map((f) => labelOf(FEATURES, f)).join(", ")}</Row>
        <Row label="Kommentar funktioner">{str("featuresNote")}</Row>
        <Row label="Vill ha offert">{b["moreWork"] === true ? "Ja — tror projektet kräver mer arbete" : ""}</Row>
        <Row label="Texter">{labelOf(CONTENT_SOURCES, str("contentSource"))}</Row>
        <Row label="Språk">{str("languages")}</Row>
        <Row label="Kontaktuppgifter att visa">{str("contactDetailsToShow")}</Row>
        <Row label="Stil">{labelOf(STYLES, str("style"))}</Row>
        <Row label="Färger">{str("colors")}</Row>
        <Row label="Känsla">{str("mood")}</Row>
        <Row label="Bilder">{labelOf(IMAGERY, str("imagery"))}</Row>
        <Row label="Referenser">{str("references")}</Row>
        <Row label="Vill inte ha">{str("dislikes")}</Row>
        <Row label="Grafisk profil">{b["hasBrandGuide"] === true ? "Finns" : ""}</Row>
        <Row label="Instagram">{str("instagram")}</Row>
        <Row label="TikTok">{str("tiktok")}</Row>
        <Row label="Andra länkar">{str("otherLinks")}</Row>
        <Row label="Nuvarande sida">{str("existingWebsite")}</Row>
        <Row label="Domän">{labelOf(DOMAIN_OPTIONS, order.domain_option)}{order.domain_name ? ` — ${order.domain_name}` : ""}</Row>
        <Row label="Lanseringsdatum">{order.launch_date}</Row>
        <Row label="Övrigt">{str("extra")}</Row>
        <Row label="Logotyp">
          {order.logo_path ? (logoUrl ? <a href={logoUrl} target="_blank" rel="noopener noreferrer"><img src={logoUrl} alt={`Logotyp för ${order.company_name}`} className="max-h-40 border border-border bg-white p-2" /></a> : "Laddar…") : b["logoUploadFailed"] === true ? "Uppladdningen misslyckades — be kunden mejla loggan" : ""}
        </Row>
      </dl>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort beställningen helt?</AlertDialogTitle>
            <AlertDialogDescription>{order.order_number} ({order.company_name}) och tillhörande logotyp raderas permanent. Det går inte att ångra.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>Ta bort</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ManualOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const blank = { company: "", contact: "", email: "", phone: "", pkg: "custom", amount: "", payment: "paid" as PaymentStatus, status: "completed" as OrderStatus, date: new Date().toISOString().slice(0, 10), notes: "" };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof blank, v: string) => setF((p) => ({ ...p, [k]: v }));

  const add = useMutation({
    mutationFn: async () => {
      const amount = Number.parseInt(f.amount, 10);
      if (!f.company.trim()) throw new Error("Skriv kundens/företagets namn.");
      if (!Number.isFinite(amount) || amount < 0 || amount > 200000) throw new Error("Skriv ett belopp i kr (0–200 000).");
      const { error } = await supabase.from("orders").insert({
        order_number: `MAN-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`,
        package_code: f.pkg as Order["package_code"],
        source: "manual",
        company_name: f.company.trim(),
        contact_name: f.contact.trim(),
        email: f.email.trim(),
        phone: f.phone.trim() || null,
        amount_kr: amount,
        payment_status: f.payment,
        status: f.status,
        internal_notes: f.notes.trim() || null,
        created_at: new Date(`${f.date}T12:00:00`).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Beställningen är tillagd"); void qc.invalidateQueries({ queryKey: ["admin", "orders"] }); setF(blank); setErr(""); onOpenChange(false); },
    onError: (e) => setErr(e instanceof Error ? e.message : "Kunde inte spara"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogTitle className="font-display text-3xl">Ny beställning</DialogTitle>
        <DialogDescription className="text-xs">För order som kommit in via mejl, DM eller på annat sätt — så syns de i statistiken.</DialogDescription>
        <form className="mt-2 grid gap-4" onSubmit={(e) => { e.preventDefault(); setErr(""); add.mutate(); }}>
          <label className="space-y-1 text-xs">Kund / företag *<Input maxLength={120} value={f.company} onChange={(e) => set("company", e.target.value)} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs">Belopp (kr) *<Input inputMode="numeric" value={f.amount} onChange={(e) => set("amount", e.target.value)} /></label>
            <label className="space-y-1 text-xs">Paket
              <select className="field" value={f.pkg} onChange={(e) => set("pkg", e.target.value)}>
                {[...ALL_PACKAGES, "custom" as const].map((c) => <option key={c} value={c}>{PACKAGE_NAMES[c]}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-xs">Betalning
              <select className="field" value={f.payment} onChange={(e) => set("payment", e.target.value)}>{PAYMENT_ORDER.map((s) => <option key={s} value={s}>{PAYMENT_LABEL[s]}</option>)}</select>
            </label>
            <label className="space-y-1 text-xs">Status
              <select className="field" value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
            </label>
            <label className="space-y-1 text-xs">Datum<Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
            <label className="space-y-1 text-xs">Kontaktperson<Input maxLength={120} value={f.contact} onChange={(e) => set("contact", e.target.value)} /></label>
            <label className="space-y-1 text-xs">E-post<Input type="email" maxLength={255} value={f.email} onChange={(e) => set("email", e.target.value)} /></label>
            <label className="space-y-1 text-xs">Telefon<Input maxLength={40} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></label>
          </div>
          <label className="space-y-1 text-xs">Anteckning<Textarea rows={3} maxLength={5000} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          <Button type="submit" disabled={add.isPending}>{add.isPending ? "Sparar…" : "Lägg till"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
