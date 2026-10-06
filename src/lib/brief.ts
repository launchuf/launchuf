// Alla frågor/alternativ i beställningsflödet på ett ställe (används av formulär, server och admin).
export const COMPANY_TYPES = [
  { value: "uf", label: "UF-företag" },
  { value: "enskild", label: "Enskild firma" },
  { value: "ab", label: "Aktiebolag" },
  { value: "forening", label: "Förening / organisation" },
  { value: "annat", label: "Annat / ännu inte startat" },
] as const;

export const GOALS = [
  { value: "contact", label: "Att besökare kontaktar oss" },
  { value: "sell", label: "Att besökare köper / beställer" },
  { value: "book", label: "Att besökare bokar tid" },
  { value: "info", label: "Att visa vilka vi är (visitkort online)" },
  { value: "follow", label: "Att besökare följer oss i sociala medier" },
] as const;

export const PAGE_OPTIONS = [
  "Startsida", "Om oss", "Tjänster / Produkter", "Kontakt", "Priser", "Galleri / Portfolio",
  "Vanliga frågor", "Team", "Blogg / Nyheter", "Recensioner",
] as const;

// Funktioner märkta extra: true ligger utanför standardpaketen => vi lämnar offert / eget pris.
export const FEATURES = [
  { value: "contact-form", label: "Kontaktformulär", extra: false },
  { value: "social-links", label: "Länkar till sociala medier", extra: false },
  { value: "map", label: "Karta / hitta hit", extra: false },
  { value: "newsletter", label: "Nyhetsbrevsanmälan", extra: false },
  { value: "webshop", label: "Webbshop / betalning på sidan", extra: true },
  { value: "booking", label: "Bokningssystem", extra: true },
  { value: "login", label: "Inloggning / medlemsdel", extra: true },
  { value: "multilang", label: "Flera språk", extra: true },
  { value: "custom", label: "Annan specialfunktion", extra: true },
] as const;

export const CONTENT_SOURCES = [
  { value: "we-write", label: "Ni skriver texterna åt oss" },
  { value: "i-provide", label: "Vi levererar texterna själva" },
  { value: "mix", label: "Blandat — vi skickar utkast, ni putsar" },
] as const;

export const STYLES = [
  { value: "modern", label: "Modern och ren" },
  { value: "minimal", label: "Minimalistisk" },
  { value: "premium", label: "Premium / lyxig" },
  { value: "bold", label: "Modig och uttrycksfull" },
  { value: "playful", label: "Lekfull och ung" },
  { value: "classic", label: "Klassisk och trygg" },
  { value: "tech", label: "Tech / futuristisk" },
  { value: "natural", label: "Naturlig / varm" },
] as const;

export const IMAGERY = [
  { value: "own", label: "Vi har egna bilder" },
  { value: "stock", label: "Använd fria / stockbilder" },
  { value: "none", label: "Inga bilder — fokus på text och form" },
  { value: "unsure", label: "Vet inte än" },
] as const;

export const DOMAIN_OPTIONS = [
  { value: "none", label: "Jag behöver ingen domänhjälp" },
  { value: "owned", label: "Jag har redan en domän" },
  { value: "setup", label: "Hjälp mig med en egen domän" },
] as const;

export const HEARD_FROM = [
  { value: "social", label: "Instagram / TikTok" },
  { value: "friend", label: "Tips från någon" },
  { value: "google", label: "Google" },
  { value: "school", label: "Skolan / UF-mässa" },
  { value: "other", label: "Annat" },
] as const;

export type Option = { value: string; label: string };

export function labelOf(options: readonly Option[], value: string | undefined | null): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

export const EXTRA_FEATURE_VALUES: readonly string[] = FEATURES.filter((f) => f.extra).map((f) => f.value);
export const FEATURE_VALUES = FEATURES.map((f) => f.value) as [string, ...string[]];
export const STYLE_VALUES = STYLES.map((o) => o.value) as [string, ...string[]];
export const GOAL_VALUES = GOALS.map((o) => o.value) as [string, ...string[]];
export const COMPANY_TYPE_VALUES = COMPANY_TYPES.map((o) => o.value) as [string, ...string[]];
export const CONTENT_VALUES = CONTENT_SOURCES.map((o) => o.value) as [string, ...string[]];
export const IMAGERY_VALUES = IMAGERY.map((o) => o.value) as [string, ...string[]];
export const HEARD_VALUES = HEARD_FROM.map((o) => o.value) as [string, ...string[]];
