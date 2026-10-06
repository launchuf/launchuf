import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

const search = z.object({
  order: z.string().max(40).optional().catch(undefined),
  quote: z.coerce.number().optional().catch(undefined),
  payerr: z.coerce.number().optional().catch(undefined),
});

export const Route = createFileRoute("/tack")({
  validateSearch: (s: Record<string, unknown>) => search.parse(s),
  head: () => pageHead({ title: "Tack för din beställning — LaunchUF", description: "Vi har tagit emot din beställning.", path: "/tack", noindex: true }),
  component: Tack,
});

function Tack() {
  const { order, quote, payerr } = Route.useSearch();
  return (
    <section className="mx-auto flex min-h-[650px] max-w-3xl flex-col items-center justify-center px-5 py-16 text-center">
      <div className="flex size-16 items-center justify-center border border-primary text-primary"><Check className="size-7" aria-hidden="true" /></div>
      <p className="eyebrow mt-8">Beställningen är mottagen</p>
      <h1 className="mt-5 font-display text-6xl">Tack. Nu börjar vi.</h1>
      {order && <p className="mt-5 text-sm text-muted-foreground">Beställningsnummer: <span className="text-foreground">{order}</span></p>}
      <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
        Vi går igenom era svar och återkommer till e-postadressen ni angav.
        {quote ? " Ert projekt behöver offert — vi hör av oss med ett pris innan något påbörjas." : " Betalningslänk skickas separat om ni valde att betala senare."}
      </p>
      {payerr ? (
        <p role="status" className="mt-5 max-w-xl border border-primary p-4 text-sm">Betalningen kunde inte startas just nu, men er beställning är sparad. Vi skickar en betalningslänk.</p>
      ) : null}
      <Button asChild className="mt-8" variant="outline"><Link to="/">Till startsidan</Link></Button>
    </section>
  );
}
