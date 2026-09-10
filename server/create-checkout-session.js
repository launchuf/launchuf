// Anropas från _worker.js när någon POST:ar till /create-checkout-session


const BASE_PRICE_KR =
  299;


const DOMAIN_ADDON_KR =
  99;


/*
 * Keep the old internal package value so existing
 * Supabase orders and Stripe webhook behaviour
 * continue to work.
 *
 * Customers never see this value.
 */

const INTERNAL_PACKAGE =
  'GROW';


export async function createCheckoutSession(
  request,
  env
) {

  let body;


  try {

    body =
      await request.json();

  } catch {

    return json(
      {
        error:
          'Ogiltig förfrågan.'
      },
      400
    );

  }


  const {

    order_number,

    package: pkg,

    email,

    company_name,

    domain_addon,

    origin

  } = body;


  /*
   * One public package now exists.
   * Internally we continue using GROW
   * for backwards compatibility.
   */

  if (
    !order_number ||
    pkg !== INTERNAL_PACKAGE ||
    !email
  ) {

    return json(
      {
        error:
          'Saknar eller ogiltiga orderuppgifter.'
      },
      400
    );

  }


  const hasDomainAddon =
    domain_addon === true;


  const amount =
    BASE_PRICE_KR +
    (
      hasDomainAddon
        ? DOMAIN_ADDON_KR
        : 0
    );


  const siteOrigin =
    origin ||
    env.SITE_URL ||
    'https://example.pages.dev';


  const params =
    new URLSearchParams();


  params.set(
    'mode',
    'payment'
  );


  params.set(
    'success_url',
    `${siteOrigin}/betalning-klar.html?order=${encodeURIComponent(order_number)}`
  );


  params.set(
    'cancel_url',
    `${siteOrigin}/betalning-avbruten.html?order=${encodeURIComponent(order_number)}`
  );


  params.set(
    'customer_email',
    email
  );


  params.set(
    'client_reference_id',
    order_number
  );


  /*
   * Same Stripe payment methods as before.
   */

  params.append(
    'payment_method_types[]',
    'card'
  );


  params.append(
    'payment_method_types[]',
    'swish'
  );


  params.set(
    'line_items[0][quantity]',
    '1'
  );


  params.set(
    'line_items[0][price_data][currency]',
    'sek'
  );


  params.set(
    'line_items[0][price_data][unit_amount]',
    String(
      amount * 100
    )
  );


  params.set(
    'line_items[0][price_data][product_data][name]',
    'LAUNCH UF — Hemsida'
  );


  params.set(
    'line_items[0][price_data][product_data][description]',
    hasDomainAddon

      ? `Hemsida 299 kr + egen domänkonfiguration 99 kr. Beställning ${order_number}.`

      : `Hemsida 299 kr. Beställning ${order_number}.`
  );


  /*
   * Stripe metadata
   */

  params.set(
    'metadata[order_number]',
    order_number
  );


  params.set(
    'metadata[package]',
    INTERNAL_PACKAGE
  );


  params.set(
    'metadata[domain_addon]',
    hasDomainAddon
      ? 'true'
      : 'false'
  );


  params.set(
    'metadata[amount_kr]',
    String(amount)
  );


  /*
   * Create Stripe Checkout Session
   */

  const stripeRes =
    await fetch(
      'https://api.stripe.com/v1/checkout/sessions',
      {

        method: 'POST',

        headers: {

          Authorization:
            `Bearer ${env.STRIPE_SECRET_KEY}`,

          'Content-Type':
            'application/x-www-form-urlencoded'

        },

        body:
          params.toString()

      }
    );


  const session =
    await stripeRes.json();


  if (
    !stripeRes.ok
  ) {

    return json(

      {

        error:
          session.error?.message ||
          'Stripe kunde inte skapa betalningen.'

      },

      500

    );

  }


  /*
   * Mark order as pending and save
   * the final amount.
   *
   * The webhook will later mark
   * the order as paid.
   */

  try {

    await fetch(

      `${env.SUPABASE_URL}/rest/v1/orders?order_number=eq.${encodeURIComponent(order_number)}`,

      {

        method: 'PATCH',

        headers: {

          apikey:
            env.SUPABASE_SERVICE_ROLE_KEY,

          Authorization:
            `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,

          'Content-Type':
            'application/json',

          Prefer:
            'return=minimal'

        },

        body:
          JSON.stringify(

            {

              stripe_session_id:
                session.id,

              payment_status:
                'pending',

              amount_kr:
                amount

            }

          )

      }

    );

  } catch (e) {

    console.error(
      'Could not pre-mark order as pending',
      e
    );

  }


  return json(
    {
      url:
        session.url
    }
  );

}


function json(
  data,
  status = 200
) {

  return new Response(

    JSON.stringify(
      data
    ),

    {

      status,

      headers: {

        'Content-Type':
          'application/json'

      }

    }

  );

}
