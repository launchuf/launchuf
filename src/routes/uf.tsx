import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/site/PageIntro";
import { CtaBand } from "@/components/site/CtaBand";
import { FaqList } from "@/components/site/Faq";
import { JsonLd } from "@/components/site/JsonLd";
import { useSettings } from "@/components/site/useSettings";
import { PACKAGES, formatPrice } from "@/lib/packages";
import { domainPrice, priceOf, SITE_URL } from "@/lib/settings";
import { buildFaqs } from "@/lib/faq";
import { breadcrumbs, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/uf")({
  head: () =>
    pageHead({
      title: "Hemsida för UF-företag — 299 kr | LaunchUF",
      description: "En professionell och mobilanpassad hemsida för ditt UF-företag för 299 kr. Domänhjälp +99 kr. Snabb leverans.",
      path: "/uf",
      jsonLd: [breadcrumbs([{ name: "Hem", path: "/" }, { name: "UF", path: "/uf" }])],
    }),
  component: UfPage,
});

function UfPage() {
  const s = useSettings();
  const item = PACKAGES.uf;
  const price = priceOf(s, "uf");
  const faqs = buildFaqs(s).filter((f) => /tid|domän|mer än|betalning/i.test(f.q));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "LaunchUF UF-paketet",
          description: item.summary,
          provider: { "@type": "Organization", name: "LaunchUF", url: SITE_URL },
          offers: { "@type": "Offer", price, priceCurrency: "SEK", url: `${SITE_URL}/bestall?paket=uf` },
        }}
      />
      <PageIntro
        eyebrow="Endast för UF-företag"
        title={`Er första riktiga hemsida. ${formatPrice(price)}.`}
        text={`Ett komplett paket skapat för ett UF-år där tiden är kort, budgeten tight och första intrycket viktigt. Leverans på ${s.delivery_text}.`}
      />
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[1fr_0.8fr] lg:px-10">
        <div>
          <h2 className="eyebrow">Det här ingår</h2>
          <ul className="mt-8 space-y-5">
            {item.features.map((f) => (
              <li key={f} className="flex items-center gap-4 border-b border-border pb-5 text-lg">
                <Check className="size-5 shrink-0 text-primary" aria-hidden="true" />{f}
              </li>
            ))}
          </ul>

          <div className="mt-10 border-l-2 border-primary pl-6">
            <h3 className="font-display text-3xl">Domänhjälp +{formatPrice(domainPrice(s))}</h3>
            <p className="mt-2 text-muted-foreground">
              Vill ni ha en egen domän? Vi hjälper er hitta, koppla och få igång den utan tekniskt krångel. Själva domännamnet betalar ni separat till registratorn.
            </p>
          </div>

          <div className="mt-8 flex gap-4 border border-border bg-secondary p-6">
            <MessageCircle className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h3 className="font-display text-2xl">Behöver ni mer än paketet?</h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                Kräver er produkt eller idé mer arbete — fler sidor, webbshop, bokning eller något annat särskilt — så hör av er innan ni beställer.
                Vi går igenom behovet och lämnar en offert. <strong className="text-foreground">Priset kan då skilja sig från {formatPrice(price)}.</strong>{" "}
                I beställningen kan ni också markera att ni behöver mer, så återkommer vi med ett pris innan något börjar.
              </p>
              <Button asChild variant="outline" className="mt-4"><Link to="/kontakt">Fråga oss först <ArrowRight /></Link></Button>
            </div>
          </div>
        </div>

        <aside className="h-fit border border-primary bg-secondary p-8 md:sticky md:top-28" aria-label="UF-paketet pris och beställning">
          <p className="eyebrow">UF-paketet</p>
          <p className="mt-7 font-display text-6xl text-primary">{formatPrice(price)}</p>
          <p className="mt-2 text-sm text-muted-foreground">+ {formatPrice(domainPrice(s))} om ni vill ha domänhjälp</p>
          <p className="mt-4 leading-7 text-muted-foreground">Allt ni behöver för att börja dela företaget professionellt.</p>
          <Button asChild size="lg" className="mt-8 w-full">
            <Link to="/bestall" search={{ paket: "uf" }}>Beställ UF-paketet <ArrowRight /></Link>
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">Betala direkt eller senare. Ni ser totalsumman innan något dras.</p>
        </aside>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20 lg:pb-28" aria-labelledby="faq-title">
        <h2 id="faq-title" className="mb-10 font-display text-5xl">Frågor från UF-företag</h2>
        <FaqList items={faqs} />
      </section>
      <CtaBand title="Redo att sluta se ut som ett skolprojekt?" text={`UF-paketet från ${formatPrice(price)}. Fyll i formuläret, välj betalning och skicka in.`} />
    </>
  );
}
