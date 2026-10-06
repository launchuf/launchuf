import type { Database, OrderStatus, PaymentStatus } from "@/integrations/supabase/types";

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Message = Database["public"]["Tables"]["contact_messages"]["Row"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Ny", contacted: "Kontaktad", in_progress: "Pågår", review: "Granskning", completed: "Klar", cancelled: "Avbruten",
};
export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Obetald", pending: "Väntar", paid: "Betald", failed: "Misslyckad", refunded: "Återbetald",
};
export const STATUS_ORDER = Object.keys(STATUS_LABEL) as OrderStatus[];
export const PAYMENT_ORDER = Object.keys(PAYMENT_LABEL) as PaymentStatus[];

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });
}

export function briefOf(order: Order): Record<string, unknown> {
  return order.brief && typeof order.brief === "object" && !Array.isArray(order.brief) ? (order.brief as Record<string, unknown>) : {};
}

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  // Skydd mot CSV-injektion i Excel/Sheets
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function ordersToCsv(orders: Order[]) {
  const head = ["Beställning", "Datum", "Paket", "Företag", "Kontakt", "E-post", "Telefon", "Belopp (kr)", "Offert", "Status", "Betalning"];
  const rows = orders.map((o) => [
    o.order_number, o.created_at, o.package_code, o.company_name, o.contact_name, o.email, o.phone ?? "",
    o.amount_kr, o.needs_quote ? "ja" : "nej", STATUS_LABEL[o.status], PAYMENT_LABEL[o.payment_status],
  ]);
  return "\uFEFF" + [head, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
}

export function downloadText(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
