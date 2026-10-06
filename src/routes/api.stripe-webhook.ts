import { createFileRoute } from "@tanstack/react-router";

// Stripe skickar betalningshändelser hit. Signaturen verifieras innan något uppdateras.
// Endpoint att ange i Stripe: https://DIN-DOMÄN/api/stripe-webhook
// Händelser: checkout.session.completed, checkout.session.async_payment_succeeded,
//            checkout.session.async_payment_failed, checkout.session.expired
export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { getServerEnv } = await import("@/lib/env.server");
        const { verifyStripeSignature } = await import("@/lib/stripe.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const secret = getServerEnv("STRIPE_WEBHOOK_SECRET");
        if (!secret) return new Response("Webhook är inte konfigurerad", { status: 503 });

        const payload = await request.text();
        let event: Awaited<ReturnType<typeof verifyStripeSignature>>;
        try {
          event = await verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret);
        } catch (err) {
          console.error("[stripe-webhook] ogiltig signatur", err);
          return new Response("Ogiltig signatur", { status: 400 });
        }

        const session = event.data.object;
        const orderNumber = session.client_reference_id;
        if (!orderNumber) return Response.json({ received: true });

        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("id,amount_kr,payment_status,stripe_session_id")
          .eq("order_number", orderNumber)
          .maybeSingle();
        if (!order || order.stripe_session_id !== session.id) return Response.json({ received: true });

        if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
          const ok =
            session.payment_status === "paid" &&
            session.amount_total === order.amount_kr * 100 &&
            session.currency?.toLowerCase() === "sek";
          if (ok && order.payment_status !== "paid") {
            await supabaseAdmin.from("orders").update({ payment_status: "paid", stripe_payment_intent: session.payment_intent ?? null }).eq("id", order.id);
          }
        } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
          if (order.payment_status !== "paid") {
            await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
          }
        }
        return Response.json({ received: true });
      },
    },
  },
});
