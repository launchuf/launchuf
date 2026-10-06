import type { SiteSettings } from "@/lib/settings";
import { domainPrice, priceOf } from "@/lib/settings";
import { formatPrice } from "@/lib/packages";

export type Faq = { q: string; a: string };

export function buildFaqs(s: SiteSettings): Faq[] {
  return [
    {
      q: "Hur lång tid tar det att få hemsidan klar?",
      a: `Vi levererar normalt på ${s.delivery_text} efter att vi fått all information och material från er. Hur snabbt sidan kan lanseras beror också på hur snabbt ni svarar på frågor och godkänner utkastet.`,
    },
    {
      q: "Vad skiljer paketen åt?",
      a: `Start (${formatPrice(priceOf(s, "start"))}) är en enkel sida, Tillväxt (${formatPrice(priceOf(s, "growth"))}) ger fler sidor och mer anpassning, och Premium (${formatPrice(priceOf(s, "premium"))}) är det kompletta paketet med avancerade sektioner och prioriterad leverans. UF-paketet (${formatPrice(priceOf(s, "uf"))}) är byggt för UF-företag.`,
    },
    {
      q: "Vad kostar domänhjälp?",
      a: `Domänhjälp kostar ${formatPrice(domainPrice(s))} extra. Vi hjälper er hitta, koppla och få igång en egen domän. Själva domännamnet köper ni hos en domänregistrator och kostar vanligtvis en årsavgift.`,
    },
    {
      q: "Vad händer om jag behöver mer än det som ingår i paketet?",
      a: "Då hör vi av oss. Behöver ni fler sidor, en webbshop, bokning eller andra specialfunktioner lämnar vi en tydlig offert innan arbetet börjar, och priset kan skilja sig från paketpriset. Ni betalar aldrig extra utan att ha godkänt det först.",
    },
    {
      q: "Vad behöver jag skicka in?",
      a: "Företagsnamn, kontaktuppgifter, en kort beskrivning av verksamheten, gärna logotyp, färger och några hemsidor ni gillar. Ju mer ni berättar i beställningen, desto mer rätt blir första utkastet.",
    },
    {
      q: "Hur fungerar betalningen?",
      a: "Ni kan betala direkt med kort via säker Stripe-betalning, eller välja att betala senare. Vid betalning senare hör vi av oss med nästa steg. För projekt som kräver offert betalar ni först när priset är godkänt.",
    },
    {
      q: "Kan jag få ändringar efter första utkastet?",
      a: "Ja. Varje paket innehåller ett antal korrekturomgångar där vi justerar text, färg och innehåll tills det stämmer.",
    },
    {
      q: "Behöver jag kunna något om webb eller teknik?",
      a: "Nej. Det är vårt jobb. Ni svarar på frågor om företaget och er smak, så sköter vi struktur, design, mobilanpassning och lansering.",
    },
  ];
}
