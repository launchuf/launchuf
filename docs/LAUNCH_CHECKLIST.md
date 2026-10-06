# Lanseringschecklista

## Före lansering
- [ ] `supabase/schema.sql` körd, admin-roll tillagd
- [ ] Alla Cloudflare-variabler satta (README §2), ny deploy gjord
- [ ] Admin → Inställningar: e-post, telefon, Instagram/TikTok m.fl. ifyllda
- [ ] Stripe: testbetalning med `4242 4242 4242 4242`, sedan live-nycklar. Kontrollera att order blir "Betald" i admin (sida + webhook)
- [ ] Testa: kontaktformulär, beställning (betala nu / senare / med offert-val), logotyp-uppladdning, ta bort order
- [ ] Juridik: låt någon granska `/integritetspolicy` och `/villkor` (mallar!) och fyll i organisationsuppgifter
- [ ] Code review: installera **CodeRabbit** (GitHub-appen) på repot — `.coderabbit.yaml` finns. Öppna en pull request så körs granskningen.
- [ ] Cloudflare: Always Use HTTPS + HSTS, Bot Fight Mode på

## SEO / Search Console
- [ ] Lägg domänen i Google Search Console (URL-prefix) → välj *HTML-tagg* → klistra in `content`-värdet i Admin → Inställningar → "Google Search Console". Klicka Verify.
- [ ] Skicka in `https://din-domän/sitemap.xml`
- [ ] Begär indexering av `/`, `/paket`, `/uf`
- [ ] Lägg Bing Webmaster Tools (importera från GSC)
- [ ] Testa delning: https://developers.facebook.com/tools/debug/ och https://cards-dev.twitter.com/validator
- [ ] Rich results-test: https://search.google.com/test/rich-results (Organization, FAQ, Service)
- [ ] PageSpeed Insights (mobil) på `/`, `/paket`, `/bestall` — mål: LCP < 2,5 s, CLS < 0,1, INP < 200 ms

## Inbyggt i koden
Unik title/description/canonical per sida · en `<h1>` per sida · OG/Twitter-kort + 1200×630 OG-bild · JSON-LD (Organization, WebSite, Service/Offer, FAQPage, BreadcrumbList) · robots.txt + sitemap.xml (genereras av `scripts/generate-seo.mjs` från `VITE_SITE_URL`) · `noindex` endast på admin/tack/betalning (ska inte indexeras) · anpassad 404 · favicon-set + manifest · skip-länk, fokusmarkeringar, label/fel-koppling, `prefers-reduced-motion` · cookie-banner med val (statistik laddas först efter samtycke) · HTTPS-omdirigering + säkerhetsheaders i `src/server.ts`.
