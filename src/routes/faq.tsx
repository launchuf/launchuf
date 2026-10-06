import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/PageIntro";
import { CtaBand } from "@/components/site/CtaBand";
import { FaqList } from "@/components/site/Faq";
import { JsonLd } from "@/components/site/JsonLd";
import { useSettings } from "@/components/site/useSettings";
import { buildFaqs } from "@/lib/faq";
import { breadcrumbs, faqJsonLd, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () =>
    pageHead({
      title: "Vanliga frågor — pris, leverans och beställning | LaunchUF",
      description: "Svar på vanliga frågor om LaunchUF: priser, leveranstid, domänhjälp, betalning och vad som händer om du behöver mer än paketet.",
      path: "/faq",
      jsonLd: [breadcrumbs([{ name: "Hem", path: "/" }, { name: "Vanliga frågor", path: "/faq" }])],
    }),
  component: FaqPage,
});

function FaqPage() {
  const faqs = buildFaqs(useSettings());
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <PageIntro eyebrow="Vanliga frågor" title="Svar innan ni ens hunnit fråga." text="Hittar ni inte det ni söker? Skriv till oss så svarar vi." />
      <section className="mx-auto max-w-5xl px-5 py-20 lg:py-28"><FaqList items={faqs} /></section>
      <CtaBand to="/kontakt" label="Kontakta oss" title="Fortfarande undrar ni?" text="Vi svarar gärna på det som inte står här." />
    </>
  );
}
