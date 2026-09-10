# LAUNCH UF — Website v3 (med Stripe-betalning + adminpanel)

## Vad som är nytt i den här versionen
- Riktig betalning i beställningsflödet: kort, Apple Pay, Google Pay och Swish, via Stripe
- `admin.html` — en egen inloggningsskyddad adminpanel för er beställningar
- Allt annat (3D-hero, GSAP, formulär) är samma som innan

Inget av det här kräver Shopify eller ett traditionellt webbhotell — det körs på samma gratis Cloudflare Pages-hosting ni redan har, plus två små "serverfunktioner" som Cloudflare kör åt er gratis.

---

## Steg 1 — Uppdatera Supabase-databasen

1. Gå till ert Supabase-projekt → **SQL Editor** → **New query**
2. Öppna `supabase-schema.sql` i den här mappen, kopiera allt, klistra in och kör (▶ Run)
   - Det lägger till betalningsfält (`payment_status`, `amount_kr` osv.) och rättigheter så att endast inloggade admins kan se beställningarna.

## Steg 2 — Skapa era admin-inloggningar

1. I Supabase: **Authentication → Users → Add user**
2. Lägg till en användare för dig och en för William (e-post + valfritt lösenord)
3. Det är de här kontona ni loggar in med på `admin.html`

## Steg 3 — Skapa ett Stripe-konto

1. Gå till [stripe.com](https://stripe.com) → skapa konto (personen som är 18+ registrerar detta)
2. Under registreringen: ange **enskild firma / individual**, ert personnummer används istället för organisationsnummer
3. Gå till **Inställningar → Betalningsmetoder** och slå på:
   - Kort (på som standard)
   - **Swish** (måste aktiveras manuellt, kräver svenskt bankkonto för utbetalning)
   - Apple Pay / Google Pay dyker upp automatiskt när Kort är aktiverat — inget extra steg
4. Hämta era nycklar under **Utvecklare → API-nycklar**:
   - `Publishable key` (börjar på `pk_`) → går i `config.js`
   - `Secret key` (börjar på `sk_`) → **denna delas ALDRIG i koden**, den läggs som en hemlighet i Cloudflare (steg 5)

Stripe har ett testläge (`pk_test_...` / `sk_test_...`) — använd det först för att testa hela flödet utan riktiga pengar, innan ni byter till skarpa nycklar (`pk_live_...` / `sk_live_...`).

## Steg 4 — Koppla in nycklarna i config.js

Öppna `config.js` och fyll i:
```js
window.LAUNCH_CONFIG = {
  supabaseUrl: 'https://xxxxx.supabase.co',
  supabaseAnonKey: 'din-anon-key',
  stripePublishableKey: 'pk_test_xxx', // eller pk_live_xxx när ni är redo på riktigt
  prices: { GROW: 299, SCALE: 499 }
};
```

## Steg 5 — Lägg in hemligheterna i Cloudflare (viktigast)

De här värdena får ALDRIG ligga i `config.js` eller någon fil som pushas till GitHub — de läggs bara i Cloudflares eget hemlighetsvalv:

1. Gå till era **Cloudflare Pages → launch-uf → Settings → Environment variables**
2. Lägg till (som "Secret", inte "Plaintext"):

| Namn | Värde |
|---|---|
| `STRIPE_SECRET_KEY` | er `sk_test_...` eller `sk_live_...` från Stripe |
| `STRIPE_WEBHOOK_SECRET` | se steg 6 nedan |
| `SUPABASE_URL` | er Supabase-projekt-URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key (hemlig, aldrig i frontend) |
| `SITE_URL` | er sajts adress, t.ex. `https://launch-uf.pages.dev` |

3. Spara och **deploya om** sajten (Cloudflare → Deployments → Retry deployment) så funktionerna får tillgång till värdena.

## Steg 6 — Koppla Stripe-webhooken

Detta gör att Stripe kan tala om för er sajt när en betalning verkligen gått igenom:

1. I Stripe: **Utvecklare → Webhooks → Add endpoint**
2. Endpoint-URL: `https://er-sajt.pages.dev/stripe-webhook`
3. Events att lyssna på: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
4. Stripe visar en **Signing secret** (`whsec_...`) — klistra in den som `STRIPE_WEBHOOK_SECRET` i Cloudflare (steg 5)

## Steg 7 — Testa hela flödet

1. Gå till er sajt → beställ → fyll i formuläret
2. Ni skickas till Stripes betalsida
3. I testläge: använd testkortet `4242 4242 4242 4242`, valfritt framtida datum, valfri CVC
4. Ni landar på `betalning-klar.html`
5. Logga in på `admin.html` — beställningen ska synas med **Betalstatus: Betald**

När allt fungerar i testläge: byt till era `pk_live_` / `sk_live_` nycklar i Stripe-dashboarden och Cloudflare, och kör en riktig testbetalning med ett riktigt kort.

---

## Filer
| Fil | Vad den gör |
|---|---|
| `index.html`, `styles.css`, `app.js` | Själva sajten |
| `admin.html`, `admin.css`, `admin.js` | Adminpanelen |
| `functions/create-checkout-session.js` | Skapar Stripe-betalningen (körs på Cloudflare, inte i webbläsaren) |
| `functions/stripe-webhook.js` | Tar emot bekräftelse från Stripe och markerar ordern betald |
| `betalning-klar.html` / `betalning-avbruten.html` | Sidor kunden ser efter Stripe |
| `config.js` | Publika nycklar (Supabase anon key, Stripe publishable key) — OK att dessa syns i koden |
| `supabase-schema.sql` | Databasstruktur — kör i Supabase SQL Editor |

## Viktigt att komma ihåg
- `config.js` innehåller bara **publika** nycklar — det är designat för att vara synligt i webbläsaren, helt normalt.
- De **hemliga** nycklarna (Stripe secret key, Supabase service role key) ligger bara i Cloudflares miljövariabler, aldrig i någon fil ni pushar till GitHub.
- Adminpanelen (`admin.html`) är låst bakom Supabase-inloggning — ingen utomstående kan se beställningarna.
