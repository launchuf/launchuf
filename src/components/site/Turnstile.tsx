import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined;

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; theme: string; callback: (t: string) => void; "expired-callback": () => void }) => string;
  remove: (id: string) => void;
};

/** Cloudflare Turnstile (valfritt). Visas bara om VITE_TURNSTILE_SITE_KEY är satt. */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    const el = ref.current;
    let widgetId: string | undefined;
    const mount = () => {
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (!api || widgetId) return;
      widgetId = api.render(el, { sitekey: SITE_KEY, theme: "dark", callback: onToken, "expired-callback": () => onToken("") });
    };
    if (!document.querySelector("script[data-turnstile]")) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset["turnstile"] = "1";
      script.onload = mount;
      document.head.appendChild(script);
    } else {
      mount();
    }
    return () => {
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (api && widgetId) api.remove(widgetId);
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}
