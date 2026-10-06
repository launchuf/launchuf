import { PAYMENT_LABEL, STATUS_LABEL } from "@/lib/admin";
import type { OrderStatus, PaymentStatus } from "@/integrations/supabase/types";

const statusTone: Record<OrderStatus, string> = {
  new: "border-primary text-primary", contacted: "border-sky-400/60 text-sky-300", in_progress: "border-amber-400/60 text-amber-300",
  review: "border-violet-400/60 text-violet-300", completed: "border-emerald-400/60 text-emerald-300", cancelled: "border-border text-muted-foreground",
};
const payTone: Record<PaymentStatus, string> = {
  unpaid: "border-border text-muted-foreground", pending: "border-amber-400/60 text-amber-300", paid: "border-emerald-400/60 text-emerald-300",
  failed: "border-destructive text-destructive", refunded: "border-sky-400/60 text-sky-300",
};

const base = "inline-block border px-2 py-0.5 text-xs font-medium";
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`${base} ${statusTone[status]}`}>{STATUS_LABEL[status]}</span>;
}
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={`${base} ${payTone[status]}`}>{PAYMENT_LABEL[status]}</span>;
}
