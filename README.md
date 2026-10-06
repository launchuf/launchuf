# LaunchUF

Hemsidor för företag och UF-företag. **TanStack Start (SSR)** + **Supabase** + **Stripe**, körs på **Cloudflare Workers**.
Samma uppsättning som StudentFix — alla nycklar ligger i Cloudflare, aldrig i GitHub.

## Sidor
`/` Hem · `/paket` (999 / 1 499 / 2 499 kr) · `/uf` (299 kr + 99 kr domänhjälp) · `/om-oss` · `/kontakt` · `/faq` · `/bestall` · `/tack` · `/betalning/lyckad|misslyckad` · `/integritetspolicy` · `/villkor` · egen 404 · `/admin` (inloggning).
Gamla `/uf-foretag` och `/tjanster` omdirigeras (301).

## 1. Supabase (en gång)
1. Skapa/öppna projektet → **SQL Editor** → klistra in hela `supabase/schema.sql` → Run.
2. **Authentication → Users → Add user** (bocka *Auto Confirm*) för varje admin.
3. Ge rollen (byt ut user-id):
   `INSERT INTO public.user_roles (user_id, role) VALUES ('<user-id>', 'admin');`

## 2. Cloudflare-inställningar (här ligger alla nycklar)
Workers & Pages → **launchuf** → **Settings**.

**Build → Variables and secrets** (publika, behövs vid bygget):
| Namn | Värde |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon/publishable key |
| `VITE_SITE_URL` | `https://din-domän.se` (utan slash) |
| `VITE_TURNSTILE_SITE_KEY` | valfritt |

**Variables and Secrets** (runtime):
| Namn | Typ |
|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `PUBLIC_SITE_URL` | Text |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** |
| `STRIPE_SECRET_KEY` | **Secret** |
| `STRIPE_WEBHOOK_SECRET` | **Secret** |
| `TURNSTILE_SECRET_KEY` | **Secret** (valfritt) |

Stripe → Developers → Webhooks → endpoint `https://din-domän.se/api/stripe-webhook`, händelser:
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`. Kopiera *signing secret* till `STRIPE_WEBHOOK_SECRET`. Aktivera Swish under Stripe → Payment methods.

Efter ändrade variabler: trigga en ny deploy (tom commit räcker).
Cloudflare → SSL/TLS → Edge Certificates → slå på **Always Use HTTPS** och **HSTS**.

## 3. Admin (`/admin`)
- **Översikt** – nyckeltal. **Beställningar** – sök/filter, hela kundens brief, status, betalstatus, anteckningar, **ta bort helt**, CSV-export.
- **Meddelanden** – kontaktformuläret. **Inställningar** – sociala medier, kontaktuppgifter, leveranstid, priser, Cloudflare Analytics, GA4 och Search Console-kod. Ändringar syns direkt på sajten.

## 4. Lokalt
```bash
npm install
cp .env.example .env     # fyll i
npm run dev              # http://localhost:8080
npm run build && npm run typecheck && npm run lint
```
`src/routeTree.gen.ts` skapas automatiskt vid första `dev`/`build`.

## 5. Ändra innehåll
- Paketens text/sidgränser: `src/lib/packages.ts` (priser styrs från admin).
- Frågorna i beställningen: `src/lib/brief.ts` + `src/components/order/OrderForm.tsx`.
- FAQ: `src/lib/faq.ts`.

## Säkerhet (kort)
Priset räknas om på servern. Orders/meddelanden skrivs bara av servern (service role); webbläsaren har ingen skrivrätt. Admin kräver inloggning + `has_role()` i databasen (RLS). Stripe-betalning verifieras mot Stripe (och webhook-signatur). Spamskydd: honeypot, minsta ifyllnadstid, databas-baserad rate limit, valfritt Turnstile. Logotyper kontrolleras på innehåll (magic bytes) och ligger i privat bucket.

Se även `docs/LAUNCH_CHECKLIST.md` och `docs/BACKLINK_STRATEGY.md`.
