import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { OrderForm } from "@/components/order/OrderForm";
import { PageIntro } from "@/components/site/PageIntro";
import { useSettings } from "@/components/site/useSettings";
import { pageHead } from "@/lib/seo";

const search = z.object({ paket: z.enum(["start", "growth", "premium", "uf"]).optional().catch(undefined) });

export const Route = createFileRoute("/bestall")({
  validateSearch: (s: Record<string, unknown>) => search.parse(s),
  head: () =>
    pageHead({
      title: "Beställ din hemsida — LaunchUF",
      description: "Berätta om ditt företag och välj paket. Ju mer du berättar, desto rätt blir första utkastet. Betala direkt eller senare.",
      path: "/bestall",
    }),
  component: BestallPage,
});

function BestallPage() {
  const { paket } = Route.useSearch();
  const s = useSettings();
  return (
    <>
      <PageIntro eyebrow="Beställning" title="Låt oss bygga er hemsida." text={`Fyll i uppgifterna steg för steg. Det tar några minuter och gör att vi bygger rätt från start. Leverans på ${s.delivery_text}.`} />
      <OrderForm key={paket ?? "start"} initialPackage={paket ?? "growth"} />
    </>
  );
}
