import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/PageIntro";
import { useSettings } from "@/components/site/useSettings";
import { formatPrice } from "@/lib/packages";
import { domainPrice, priceOf } from "@/lib/settings";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/villkor")({
  head: () =>
    pageHead({
      title: "Villkor | LaunchUF",
      description: "Villkor för beställning av hemsida hos LaunchUF: priser, leverans, korrektur, extra arbete, betalning och ansvar.",
      path: "/villkor",
    }),
  component: Page,
});

function Page() {
  const s = useSettings();
  return (
    <>
      <PageIntro eyebrow="Juridik" title="Villkor" text="Senast uppdaterad 2026-10-05." />
      <article className="mx-auto max-w-3xl space-y-10 px-5 py-16 leading-7 text-muted-foreground lg:py-24">
        <section>
          <h2 className="font-display text-3xl text-foreground">1. Tjänsten</h2>
          <p className="mt-3">LaunchUF utformar och bygger hemsidor enligt det paket och de uppgifter som lämnas i beställningen. Avtal uppstår när vi bekräftat beställningen.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">2. Priser</h2>
          <p className="mt-3">Gällande paketpriser: Start {formatPrice(priceOf(s, "start"))}, Tillväxt {formatPrice(priceOf(s, "growth"))}, Premium {formatPrice(priceOf(s, "premium"))} och UF-paketet {formatPrice(priceOf(s, "uf"))}. Domänhjälp kostar {formatPrice(domainPrice(s))} extra. Priserna anges i svenska kronor. Själva domännamnet och eventuell extern drift betalas separat till respektive leverantör.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">3. Extra arbete och offert</h2>
          <p className="mt-3">Behöver projektet mer än vad paketet omfattar (till exempel fler sidor, webbshop, bokning eller specialfunktioner) lämnar vi en offert innan arbetet påbörjas. Priset kan då skilja sig från paketpriset. Inget extra arbete utförs eller debiteras utan ditt godkännande.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">4. Leverans</h2>
          <p className="mt-3">Normal leveranstid är {s.delivery_text} från att vi fått all information och allt material vi behöver. Leveranstiden är en uppskattning och kan påverkas av hur snabbt du svarar och godkänner.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">5. Korrektur och godkännande</h2>
          <p className="mt-3">Antalet korrekturomgångar framgår av paketet. Fler ändringar än så kan kräva tilläggsarbete enligt punkt 3. Sidan lanseras när du godkänt den.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">6. Betalning</h2>
          <p className="mt-3">Du kan betala direkt via Stripe eller välja att betala senare, då vi kontaktar dig med nästa steg. För projekt som kräver offert betalar du efter att priset godkänts.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">7. Material och rättigheter</h2>
          <p className="mt-3">Du ansvarar för att du har rätt att använda texter, bilder och logotyper du skickar in. När slutbetalning skett får du rätt att använda den färdiga hemsidan för din verksamhet.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">8. Ångerrätt och avbokning</h2>
          <p className="mt-3">Är du konsument kan lagen om distansavtal ge dig ångerrätt. Eftersom hemsidan skräddarsys efter dina önskemål kan ångerrätten bortfalla när arbetet påbörjats med ditt samtycke. Kontakta oss om du vill avboka så går vi igenom vad som gäller i ditt fall.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">9. Ansvar</h2>
          <p className="mt-3">Vi ansvarar för att tjänsten utförs fackmannamässigt. Vi ansvarar inte för indirekta skador eller utebliven vinst. Vårt ansvar är begränsat till vad du betalat för den aktuella beställningen, i den utsträckning lagen tillåter.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">10. Personuppgifter och kontakt</h2>
          <p className="mt-3">Hur vi hanterar personuppgifter beskrivs i vår <Link to="/integritetspolicy" className="text-primary underline">integritetspolicy</Link>. Frågor om villkoren? <Link to="/kontakt" className="text-primary underline">Kontakta oss</Link>.</p>
        </section>
      </article>
    </>
  );
}
