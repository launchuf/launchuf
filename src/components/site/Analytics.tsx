import { useEffect } from "react";
import { onConsentChange, readConsent } from "@/components/site/CookieConsent";
import { useSettings } from "@/components/site/useSettings";

function addScript(src: string, attrs: Record<string, string> = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const el = document.createElement("script");
  el.src = src;
  el.async = true;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.head.appendChild(el);
}

/**
 * - Cloudflare Web Analytics: cookiefri och utan personuppgifter — laddas alltid om token finns.
 * - Google Analytics 4: laddas ENDAST efter att besökaren godkänt statistik.
 * Båda ställs in i Admin → Inställningar.
 */
export function Analytics() {
  const { cf_analytics_token: cfToken, ga4_id: ga4 } = useSettings();

  useEffect(() => {
    if (cfToken && /^[a-f0-9]{16,64}$/i.test(cfToken)) {
      addScript("https://static.cloudflareinsights.com/beacon.min.js", { "data-cf-beacon": JSON.stringify({ token: cfToken }), defer: "" });
    }
  }, [cfToken]);

  useEffect(() => {
    if (!ga4 || !/^G-[A-Z0-9]{4,20}$/.test(ga4)) return;
    const load = () => {
      if (readConsent() !== "all") return;
      const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
      if (w.gtag) return;
      w.dataLayer = w.dataLayer ?? [];
      w.gtag = function gtag() { w.dataLayer?.push(arguments); };
      w.gtag("js", new Date());
      w.gtag("config", ga4, { anonymize_ip: true });
      addScript(`https://www.googletagmanager.com/gtag/js?id=${ga4}`);
    };
    load();
    return onConsentChange(load);
  }, [ga4]);

  return null;
}
