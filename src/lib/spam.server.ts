// SERVER-ONLY. Skydd mot spam: honeypot, minsta ifyllnadstid och (valfritt) Cloudflare Turnstile.
import { getServerEnv } from "@/lib/env.server";

export const MIN_FILL_MS = 2500;

export async function assertHumanSubmission(input: {
  honeypot?: string | undefined;
  elapsedMs?: number | undefined;
  turnstileToken?: string | undefined;
}) {
  // Honeypot: ett dolt fält som riktiga användare aldrig fyller i.
  if (input.honeypot && input.honeypot.length > 0) throw new Error("Förfrågan avvisades.");
  // Människor hinner inte fylla i ett formulär på under ett par sekunder.
  if (typeof input.elapsedMs !== "number" || input.elapsedMs < MIN_FILL_MS) {
    throw new Error("Det gick för snabbt. Vänta en stund och försök igen.");
  }
  const secret = getServerEnv("TURNSTILE_SECRET_KEY");
  if (!secret) return; // Turnstile är valfritt — aktiveras när nyckeln finns.
  if (!input.turnstileToken) throw new Error("Bekräfta att du inte är en robot och försök igen.");
  const body = new URLSearchParams({ secret, response: input.turnstileToken });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const result = (await res.json().catch(() => ({}))) as { success?: boolean };
  if (!res.ok || !result.success) throw new Error("Robotkontrollen misslyckades. Ladda om sidan och försök igen.");
}
