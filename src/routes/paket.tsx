import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackageCards } from "@/components/site/PackageCards";
import { PageIntro } from "@/components/site/PageIntro";
import { CtaBand } from "@/components/site/CtaBand";
import { FaqList } from "@/components/site/Faq";
import { JsonLd } from "@/components/site/JsonLd";
import { useSettings } from "@/components/site/useSettings";
import { MAIN_PACKAGES, PACKAGES, formatPrice } from "@/lib/packages";
import { domainPrice, priceOf, SITE_URL } from "@/lib/settings";
import { buildFaqs } from "@/lib/faq";
import { breadcrumbs, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/paket")({
  head: () =>
    pageHead({
      title: "Paket och priser — hemsida från 999 kr | LaunchUF",
      description: "Välj mellan Start 999 kr, Tillväxt 1 499 kr och Premium 2 499 kr. Tydliga priser, mobilanpassad design och snabb leverans.",
      path: "/paket",
      jsonLd: [breadcrumbs([{ name: "Hem", path: "/" }, { name: "Paket", path: "/paket" }])],
    }),
  component: PaketPage,
});

function PaketPage() {
  const s = useSettings();
  const faqs = buildFaqs(s).slice(0, 5);
  const offers = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: MAIN_PACKAGES.map((code, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: `LaunchUF ${PACKAGES[code].name}`,
        description: PACKAGES[code].summary,
        provider: { "@type": "Organization", name: "LaunchUF", url: SITE_URL },
        offers: { "@type": "Offer", price: priceOf(s, code), priceCurrency: "SEK", url: `${SITE_URL}/bestall?paket=${code}` },
      },
    })),
  };
  return (
    <>
      <JsonLd data={offers} />
      <PageIntro
        eyebrow="Paket och priser"
        title="Tydliga val. Inga överraskningar."
        text={`Välj nivån som passar nu. Alla paket byggs med samma omsorg, mobilanpassning och tydliga process. Leverans på ${s.delivery_text}.`}
      />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10"><PackageCards /></section>

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-10" aria-labelledby="compare-title">
        <h2 id="compare-title" className="font-display text-4xl md:text-5xl">Jämför paketen</h2>
        <div className="mt-8 overflow-x-auto border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Jämförelse av LaunchUF:s tre huvudpaket</caption>
            <thead className="bg-secondary">
              <tr>
                <th scope="col" className="p-4 font-medium text-muted-foreground">&nbsp;</th>
                {MAIN_PACKAGES.map((c) => <th key={c} scope="col" className="p-4 font-display text-2xl">{PACKAGES[c].name}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><th scope="row" className="p-4 font-medium">Pris</th>{MAIN_PACKAGES.map((c) => <td key={c} className="p-4 text-primary">{formatPrice(priceOf(s, c))}</td>)}</tr>
              <tr><th scope="row" className="p-4 font-medium">Sidor som ingår</th>{MAIN_PACKAGES.map((c) => <td key={c} className="p-4">Upp till {PACKAGES[c].pageLimit}</td>)}</tr>
              <tr><th scope="row" className="p-4 font-medium">Korrekturomgångar</th>{MAIN_PACKAGES.map((c) => <td key={c} className="p-4">{PACKAGES[c].revisions}</td>)}</tr>
              <tr><th scope="row" className="p-4 font-medium">Leverans</th>{MAIN_PACKAGES.map((c) => <td key={c} className="p-4">{s.delivery_text}</td>)}</tr>
              <tr><th scope="row" className="p-4 font-medium">Mobilanpassad</th>{MAIN_PACKAGES.map((c) => <td key={c} className="p-4">Ja</td>)}</tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-2 lg:px-10">
          <div>
            <p className="eyebrow">Tillval</p>
            <h2 className="mt-4 font-display text-4xl">Domänhjälp +{formatPrice(domainPrice(s))}</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Vi hjälper er hitta, koppla och få igång en egen domän utan tekniskt krångel.</p>
          </div>
          <div>
            <p className="eyebrow">Behöver ni mer?</p>
            <h2 className="mt-4 font-display text-4xl">Specialönskemål? Hör av er.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Fler sidor, webbshop, bokning eller andra funktioner? Då lämnar vi en offert och priset kan skilja sig från paketpriset.
            </p>
            <Button asChild variant="outline" className="mt-6"><Link to="/kontakt">Kontakta oss <ArrowRight /></Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 lg:py-28" aria-labelledby="faq-title">
        <h2 id="faq-title" className="mb-10 font-display text-5xl">Vanliga frågor</h2>
        <FaqList items={faqs} />
      </section>
      <CtaBand />
    </>
  );
}
