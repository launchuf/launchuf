// Gemensam paketdefinition. Priserna här är STANDARDVÄRDEN — de skrivs över av
// värdena som admin sätter under Admin → Inställningar (site_settings).
export type PackageCode = "start" | "growth" | "premium" | "uf";

export type PackageDef = {
  code: PackageCode;
  name: string;
  defaultPrice: number;
  summary: string;
  features: readonly string[];
  /** Max antal sidor som ingår. Fler sidor => offert (pris kan skilja sig). */
  pageLimit: number;
  /** Hur många korrekturomgångar som ingår. */
  revisions: number;
};

export const PACKAGES: Record<PackageCode, PackageDef> = {
  start: {
    code: "start",
    name: "Start",
    defaultPrice: 999,
    summary: "En skarp, enkel hemsida som gör jobbet.",
    features: [
      "En genomarbetad sida",
      "Mobilanpassad design",
      "Kontaktsektion och sociala länkar",
      "Grundläggande sökoptimering",
      "En korrekturomgång",
    ],
    pageLimit: 1,
    revisions: 1,
  },
  growth: {
    code: "growth",
    name: "Tillväxt",
    defaultPrice: 1499,
    summary: "För företag som vill berätta mer och växa.",
    features: [
      "Upp till fem sidor",
      "Skräddarsydd design",
      "Kontaktformulär",
      "Sökoptimering",
      "Två korrekturomgångar",
    ],
    pageLimit: 5,
    revisions: 2,
  },
  premium: {
    code: "premium",
    name: "Premium",
    defaultPrice: 2499,
    summary: "Vårt bästa paket för ett komplett digitalt uttryck.",
    features: [
      "Upp till tio sidor",
      "Avancerade sektioner och animationer",
      "Strategi och innehållsstöd",
      "Utökad sökoptimering",
      "Prioriterad leverans",
      "Tre korrekturomgångar",
    ],
    pageLimit: 10,
    revisions: 3,
  },
  uf: {
    code: "uf",
    name: "UF-paketet",
    defaultPrice: 299,
    summary: "En riktig hemsida till ett UF-vänligt pris.",
    features: [
      "En komplett landningssida",
      "Mobilanpassning",
      "Kontakt och sociala länkar",
      "Grundläggande sökoptimering",
      "Hjälp hela vägen till lansering",
    ],
    pageLimit: 1,
    revisions: 1,
  },
};

export const MAIN_PACKAGES: PackageCode[] = ["start", "growth", "premium"];
export const ALL_PACKAGES: PackageCode[] = ["start", "growth", "premium", "uf"];

export function isPackageCode(value: unknown): value is PackageCode {
  return typeof value === "string" && value in PACKAGES;
}

export const PACKAGE_NAMES: Record<PackageCode | "custom", string> = {
  custom: "Eget / manuell",
  start: "Start",
  growth: "Tillväxt",
  premium: "Premium",
  uf: "UF-paketet",
};

export function formatPrice(price: number) {
  return new Intl.NumberFormat("sv-SE").format(price).replace(/\u00a0/g, " ") + " kr";
}
