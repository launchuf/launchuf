import { PACKAGES, type PackageCode } from "@/lib/packages";

/** Alla inställningar som kan ändras i Admin → Inställningar. */
export const SETTING_KEYS = [
  "delivery_text",
  "price_start",
  "price_growth",
  "price_premium",
  "price_uf",
  "price_domain",
  "contact_email",
  "contact_phone",
  "instagram",
  "tiktok",
  "facebook",
  "linkedin",
  "youtube",
  "cf_analytics_token",
  "ga4_id",
  "google_site_verification",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];
export type SiteSettings = Record<SettingKey, string>;

export const DEFAULT_SETTINGS: SiteSettings = {
  delivery_text: "2–5 dagar",
  price_start: String(PACKAGES.start.defaultPrice),
  price_growth: String(PACKAGES.growth.defaultPrice),
  price_premium: String(PACKAGES.premium.defaultPrice),
  price_uf: String(PACKAGES.uf.defaultPrice),
  price_domain: "99",
  contact_email: "",
  contact_phone: "",
  instagram: "",
  tiktok: "",
  facebook: "",
  linkedin: "",
  youtube: "",
  cf_analytics_token: "",
  ga4_id: "",
  google_site_verification: "",
};

export function mergeSettings(rows: Array<{ key: string; value: string }> | null | undefined): SiteSettings {
  const merged: SiteSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows ?? []) {
    if ((SETTING_KEYS as readonly string[]).includes(row.key) && typeof row.value === "string") {
      merged[row.key as SettingKey] = row.value;
    }
  }
  return merged;
}

function toPrice(raw: string, fallback: number) {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 && n <= 100000 ? n : fallback;
}

export function priceOf(settings: SiteSettings, code: PackageCode) {
  return toPrice(settings[`price_${code}` as SettingKey], PACKAGES[code].defaultPrice);
}

export function domainPrice(settings: SiteSettings) {
  return toPrice(settings.price_domain, 99);
}

/** Gör @handle / handle / url till en fullständig https-URL (eller null om tom). */
export function socialUrl(network: "instagram" | "tiktok" | "facebook" | "linkedin" | "youtube", raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^https:\/\//i.test(value)) return value;
  if (/^http:\/\//i.test(value)) return value.replace(/^http:/i, "https:");
  const handle = value.replace(/^@/, "").replace(/\s+/g, "");
  if (!handle) return null;
  switch (network) {
    case "instagram": return `https://instagram.com/${handle}`;
    case "tiktok": return `https://tiktok.com/@${handle}`;
    case "facebook": return `https://facebook.com/${handle}`;
    case "linkedin": return `https://linkedin.com/company/${handle}`;
    case "youtube": return `https://youtube.com/@${handle}`;
  }
}

// Sätts via VITE_SITE_URL (Cloudflare build variable). Måste vara en https-origin utan slutsnedstreck.
const rawSiteUrl = (import.meta.env["VITE_SITE_URL"] as string | undefined) ?? "https://launchuf.se";
export const SITE_URL = rawSiteUrl.replace(/\/+$/, "");
export const SITE_NAME = "LaunchUF";
