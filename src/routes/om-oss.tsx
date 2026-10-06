import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/PageIntro";
import { CtaBand } from "@/components/site/CtaBand";
import { Reveal } from "@/components/site/Reveal";
import { breadcrumbs, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/om-oss")({
  head: () =>
    pageHead({
      title: "Om oss — webbdesign som känns större än budgeten | LaunchUF",
      description: "LaunchUF gör genomtänkt webbdesign tillgänglig för unga och växande företag. Läs om hur vi jobbar och vad vi tror på.",
      path: "/om-oss",
      jsonLd: [breadcrumbs([{ name: "Hem", path: "/" }, { name: "Om oss", path: "/om-oss" }])],
    }),
  component: OmOss,
});

const VALUES = [
  ["Tydlighet", "Tydliga priser, tydlig process och tydliga besked om vad som händer härnäst."],
  ["Omsorg", "Varje sida byggs för just det företaget — aldrig en färdig mall med ny logga."],
  ["Hastighet", "Vi arbetar snabbt utan att slarva, så att ni kan lansera när ni vill."],
] as const;

function OmOss() {
  return (
    <>
      <PageIntro
        eyebrow="Om LaunchUF"
        title="Bra design ska inte kräva en stor byråbudget."
        text="LaunchUF startades för att göra professionell webbdesign tillgänglig för företag som är i början av något stort."
      />
      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-20 md:grid-cols-2 lg:px-10">
        <h2 className="font-display text-5xl">Vi tror på färre omvägar och bättre beslut.</h2>
        <div className="space-y-6 leading-8 text-muted-foreground">
          <p>Ni ska inte behöva kunna webb, design eller teknik för att få en riktigt bra hemsida. Det är vårt jobb.</p>
          <p>Vår process börjar med företaget: vad ni säljer, vem ni vill nå och vilket intryck ni vill lämna. Därifrån bygger vi en tydlig helhet som känns som er.</p>
          <p>Resultatet ska inte bara vara snyggt. Det ska vara enkelt att förstå, lätt att använda och redo att delas.</p>
        </div>
      </section>
      <section className="border-y border-border bg-secondary" aria-labelledby="values-title">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
          <h2 id="values-title" className="eyebrow">Så jobbar vi</h2>
          <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-3">
            {VALUES.map(([t, d], i) => (
              <Reveal key={t} delay={i * 80} className="bg-secondary p-8">
                <h3 className="font-display text-3xl">{t}</h3>
                <p className="mt-4 leading-7 text-muted-foreground">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <CtaBand title="Berätta vad ni bygger." text="Starta med ett formulär — vi återkommer med nästa steg." />
    </>
  );
}
