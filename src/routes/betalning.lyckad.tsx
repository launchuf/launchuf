import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { confirmPayment } from "@/lib/orders.functions";
import { formatPrice } from "@/lib/packages";
import { pageHead } from "@/lib/seo";

const search = z.object({ order: z.string().max(40).optional().catch(undefined), session_id: z.string().max(200).optional().catch(undefined) });

export const Route = createFileRoute("/betalning/lyckad")({
  validateSearch: (s: Record<string, unknown>) => search.parse(s),
  head: () => pageHead({ title: "Betalningen är genomförd — LaunchUF", description: "Din betalning hos LaunchUF är genomförd.", path: "/betalning/lyckad", noindex: true }),
  component: Success,
});

type Result = Awaited<ReturnType<typeof confirmPayment>>;

function Success() {
  const { order, session_id } = Route.useSearch();
  const confirm = useServerFn(confirmPayment);
  const [res, setRes] = useState<Result | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!order || !session_id) return;
    confirm({ data: { orderNo: order, sessionId: session_id } }).then(setRes).catch(() => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, session_id]);

  let icon = <Loader2 className="size-14 animate-spin text-primary" aria-hidden="true" />;
  let title = "Bekräftar betalningen…";
  let body = <p>Ett ögonblick.</p>;

  if (!order || !session_id) {
    icon = <Clock className="size-14 text-primary" aria-hidden="true" />;
    title = "Ogiltig betalningslänk";
    body = <p>Betalningen kunde inte verifieras. Kontakta oss om du redan betalat.</p>;
  } else if (failed || (res && res.status !== "betald")) {
    icon = <Clock className="size-14 text-primary" aria-hidden="true" />;
    title = "Betalningen behandlas";
    body = <p>Vi har inte fått bekräftelsen ännu. Din beställning är sparad och vi hör av oss när betalningen är klar.</p>;
  } else if (res && res.status === "betald" && res.order) {
    icon = <CheckCircle2 className="size-14 text-primary" aria-hidden="true" />;
    title = "Tack — betalningen gick igenom!";
    body = (
      <>
        <p>Vi har tagit emot betalningen för {res.order.company} och börjar arbeta med er hemsida.</p>
        <dl className="mx-auto mt-6 max-w-sm space-y-2 border border-border bg-card p-5 text-left text-sm">
          <div className="flex justify-between"><dt>Beställningsnummer</dt><dd className="font-semibold text-foreground">{res.order.orderNumber}</dd></div>
          <div className="flex justify-between"><dt>Betalt</dt><dd className="font-semibold text-foreground">{formatPrice(res.order.amount)}</dd></div>
          <div className="flex justify-between"><dt>Kontakt</dt><dd className="text-foreground">{res.order.email}</dd></div>
        </dl>
      </>
    );
  }

  return (
    <section className="mx-auto flex min-h-[650px] max-w-2xl flex-col items-center justify-center px-5 py-16 text-center" aria-live="polite">
      {icon}
      <h1 className="mt-6 font-display text-5xl">{title}</h1>
      <div className="mt-4 leading-7 text-muted-foreground">{body}</div>
      <Button asChild variant="outline" className="mt-8"><Link to="/">Till startsidan</Link></Button>
    </section>
  );
}
