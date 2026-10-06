import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/PageIntro";
import { useSettings } from "@/components/site/useSettings";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/integritetspolicy")({
  head: () =>
    pageHead({
      title: "Integritetspolicy | LaunchUF",
      description: "Så hanterar LaunchUF dina personuppgifter: vilka uppgifter vi samlar in, varför, hur länge vi sparar dem och vilka rättigheter du har.",
      path: "/integritetspolicy",
    }),
  component: Page,
});

function Page() {
  const s = useSettings();
  return (
    <>
      <PageIntro eyebrow="Juridik" title="Integritetspolicy" text="Senast uppdaterad 2026-10-05." />
      <article className="mx-auto max-w-3xl space-y-10 px-5 py-16 leading-7 text-muted-foreground lg:py-24">
        <section>
          <h2 className="font-display text-3xl text-foreground">1. Vem ansvarar för dina uppgifter?</h2>
          <p className="mt-3">LaunchUF är personuppgiftsansvarig för uppgifterna som samlas in via den här webbplatsen. Du når oss via{" "}
            {s.contact_email ? <a className="text-primary underline" href={`mailto:${s.contact_email}`}>{s.contact_email}</a> : <Link className="text-primary underline" to="/kontakt">kontaktformuläret</Link>}.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">2. Vilka uppgifter samlar vi in och varför?</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li><strong className="text-foreground">Beställningar:</strong> namn, e-post, telefon, företagsuppgifter, beskrivning av verksamheten, önskemål om design och innehåll, samt en eventuell logotyp. Används för att leverera den hemsida du beställt (avtal).</li>
            <li><strong className="text-foreground">Kontaktformulär:</strong> namn, e-post och ditt meddelande. Används för att besvara din fråga (berättigat intresse).</li>
            <li><strong className="text-foreground">Betalning:</strong> betalningen hanteras av Stripe. Vi ser aldrig dina kortuppgifter, bara om betalningen gått igenom.</li>
            <li><strong className="text-foreground">Statistik:</strong> anonymiserad besöksstatistik. Cloudflare Web Analytics är cookiefri. Google Analytics används endast om du godkänner det i cookie-rutan (samtycke).</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">3. Cookies och lokal lagring</h2>
          <p className="mt-3">Vi sparar ditt cookieval i webbläsarens lokala lagring. Inloggning i adminpanelen (endast för vårt team) använder en sessionsnyckel. Statistik som kräver samtycke laddas först när du tackat ja. Du kan ändra ditt val när som helst via ”Cookie-inställningar” längst ned på sidan.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">4. Vilka tar emot uppgifterna?</h2>
          <p className="mt-3">Vi anlitar underleverantörer (personuppgiftsbiträden) för drift: Cloudflare (hosting och säkerhet), Supabase (databas och fillagring), Stripe (betalningar) samt, om du samtyckt, Google (statistik). Vi säljer aldrig dina uppgifter. Vissa leverantörer kan behandla uppgifter utanför EU/EES med stöd av EU-kommissionens standardavtalsklausuler eller motsvarande skyddsmekanism.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">5. Hur länge sparar vi uppgifterna?</h2>
          <p className="mt-3">Beställningsuppgifter sparas så länge projektet pågår och därefter så länge vi är skyldiga enligt lag (till exempel bokföringsunderlag) eller har ett berättigat behov, därefter raderas de. Kontaktmeddelanden raderas när ärendet är avslutat. Du kan be oss radera dina uppgifter tidigare.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">6. Dina rättigheter</h2>
          <p className="mt-3">Du har rätt att begära tillgång till, rättelse eller radering av dina uppgifter, att begränsa eller invända mot behandling, och att få dina uppgifter överförda. Återkalla samtycke gör du när som helst. Kontakta oss så hjälper vi dig. Du har även rätt att klaga till Integritetsskyddsmyndigheten (IMY), imy.se.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">7. Ändringar</h2>
          <p className="mt-3">Vi kan uppdatera policyn. Senaste versionen finns alltid här.</p>
        </section>
      </article>
    </>
  );
}
