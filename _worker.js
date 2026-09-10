// _worker.js
// Detta ÄR er server nu — Cloudflare kör den här filen automatiskt för ALLA
// requests till launchuf.kontakt-launchuf.workers.dev (eftersom ni kör
// "Workers" med statiska filer, inte klassiska "Pages").
//
// Den gör två saker:
//   1. Om URL:en matchar /create-checkout-session eller /stripe-webhook → kör vår egen kod
//   2. Annars → skickar vidare till era vanliga statiska filer (index.html, styles.css, osv.)

import { createCheckoutSession } from './server/create-checkout-session.js';
import { handleStripeWebhook } from './server/stripe-webhook.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/create-checkout-session') {
      return createCheckoutSession(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/stripe-webhook') {
      return handleStripeWebhook(request, env);
    }

    // Allt annat: servera de statiska filerna som vanligt (index.html, admin.html, styles.css, app.js, ...)
    return env.ASSETS.fetch(request);
  },
};
