// Cloudflare Pages Function
// Stripe calls this URL automatically when a payment succeeds:
// https://<your-site>.pages.dev/stripe-webhook
// It verifies the request really came from Stripe, then marks the order as paid in Supabase.

export async function onRequestPost(context) {
  const { request, env } = context;
  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text();

  let event;
  try {
    event = await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook signature error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object;
    const orderNumber = session.client_reference_id || session.metadata?.order_number;

    if (orderNumber) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/orders?order_number=eq.${encodeURIComponent(orderNumber)}`, {
        method: 'PATCH',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          payment_status: 'paid',
          stripe_payment_intent: session.payment_intent || null,
        }),
      });
    }
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object;
    const orderNumber = session.client_reference_id || session.metadata?.order_number;
    if (orderNumber) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/orders?order_number=eq.${encodeURIComponent(orderNumber)}`, {
        method: 'PATCH',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ payment_status: 'failed' }),
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

// Minimal Stripe signature verification using Web Crypto (works in Cloudflare Workers runtime)
async function verifyStripeSignature(payload, sigHeader, secret) {
  if (!sigHeader) throw new Error('Missing stripe-signature header');
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
  const timestamp = parts.t;
  const expectedSig = parts.v1;
  if (!timestamp || !expectedSig) throw new Error('Malformed signature header');

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const computedSig = [...new Uint8Array(sigBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');

  if (computedSig !== expectedSig) throw new Error('Signature mismatch');
  return JSON.parse(payload);
}
