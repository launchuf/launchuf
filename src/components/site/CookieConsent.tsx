import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export type Consent = "all" | "necessary";
const KEY = "luf_consent_v1";
const EVENT = "luf-consent-change";
const OPEN_EVENT = "luf-consent-open";

export function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "all" || value === "necessary" ? value : null;
  } catch {
    return null;
  }
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onConsentChange(handler: (value: Consent | null) => void) {
  const listener = () => handler(readConsent());
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

function save(value: Consent) {
  try { localStorage.setItem(KEY, value); } catch { /* privat läge */ }
  window.dispatchEvent(new Event(EVENT));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readConsent() === null) setVisible(true);
    const open = () => setVisible(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  if (!visible) return null;
  const choose = (value: Consent) => { save(value); setVisible(false); };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-3 bottom-3 z-50 border border-border bg-card p-5 shadow-2xl sm:left-auto sm:right-5 sm:bottom-5 sm:max-w-md"
    >
      <h2 id="cookie-title" className="font-display text-2xl">Cookies</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Vi använder nödvändig lagring för att sidan ska fungera. Med ditt samtycke använder vi även statistik för att förbättra webbplatsen.{" "}
        <Link to="/integritetspolicy" className="text-primary underline underline-offset-4">Läs mer</Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => choose("all")}>Godkänn alla</Button>
        <Button variant="outline" onClick={() => choose("necessary")}>Endast nödvändiga</Button>
      </div>
    </div>
  );
}
