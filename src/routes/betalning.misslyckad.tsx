import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/betalning/misslyckad")({
  head: () => pageHead({ title: "Betalningen avbröts — LaunchUF", description: "Betalningen genomfördes inte.", path: "/betalning/misslyckad", noindex: true }),
  component: Failed,
});

function Failed() {
  return (
    <section className="mx-auto flex min-h-[650px] max-w-2xl flex-col items-center justify-center px-5 py-16 text-center">
      <XCircle className="size-14 text-destructive" aria-hidden="true" />
      <h1 className="mt-6 font-display text-5xl">Betalningen avbröts</h1>
      <p className="mt-4 leading-7 text-muted-foreground">Inga pengar har dragits. Er beställning är sparad och vi skickar en ny betalningslänk, eller så kan ni kontakta oss direkt.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild><Link to="/kontakt">Kontakta oss</Link></Button>
        <Button asChild variant="outline"><Link to="/">Till startsidan</Link></Button>
      </div>
    </section>
  );
}
