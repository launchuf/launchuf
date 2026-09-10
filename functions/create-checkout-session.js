// Cloudflare Pages Function
// Runs at: https://<your-site>.pages.dev/create-checkout-session
// Creates a Stripe Checkout Session (Card + Apple Pay + Google Pay + Swish where available)
// The Stripe SECRET key lives only here, as a Cloudflare secret — never in the website code.

const PRICES_KR = { GROW: 299, SCALE: 499 };

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ogiltig förfrågan.' }, 400);
  }

  const { order_number, package: pkg, email, company_name, origin } = body;

  if (!order_number || !PRICES_KR[pkg] || !email) {
    return json({ error: 'Saknar order_number, package eller email.' }, 400);
  }

  const amount = PRICES_KR[pkg]; // kr
  const siteOrigin = origin || env.SITE_URL || 'https://example.pages.dev';

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${siteOrigin}/betalning-klar.html?order=${encodeURIComponent(order_number)}`);
  params.set('cancel_url', `${siteOrigin}/betalning-avbruten.html?order=${encodeURIComponent(order_number)}`);
  params.set('customer_email', email);
  params.set('client_reference_id', order_number);
  // Card + Apple Pay + Google Pay show automatically for "card".
  // Swish shows automatically too, once it is enabled in your Stripe Dashboard for SEK/Sweden.
  params.append('payment_method_types[]', 'card');
  params.append('payment_method_types[]', 'swish');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'sek');
  params.set('line_items[0][price_data][unit_amount]', String(amount * 100)); // öre
  params.set('line_items[0][price_data][product_data][name]', `LAUNCH UF — ${pkg}-paketet`);
  params.set('line_items[0][price_data][product_data][description]', `Beställning ${order_number} för ${company_name || 'ert UF-företag'}`);
  params.set('metadata[order_number]', order_number);
  params.set('metadata[package]', pkg);

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await stripeRes.json();

  if (!stripeRes.ok) {
    return json({ error: session.error?.message || 'Stripe kunde inte skapa betalningen.' }, 500);
  }

  // Save the session id + mark order as "pending" payment, using the service role key
  // (server-side only — this key must NEVER be shipped to the browser).
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/orders?order_number=eq.${encodeURIComponent(order_number)}`, {
      method: 'PATCH',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ stripe_session_id: session.id, payment_status: 'pending', amount_kr: amount }),
    });
  } catch (e) {
    // Non-fatal: webhook will still confirm payment later.
    console.error('Could not pre-mark order as pending', e);
  }

  return json({ url: session.url });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
