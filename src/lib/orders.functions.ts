import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orderSchema } from "@/lib/order-schema";
import { EXTRA_FEATURE_VALUES } from "@/lib/brief";
import { PACKAGES } from "@/lib/packages";
import { domainPrice, priceOf } from "@/lib/settings";

function newOrderNumber() {
  return `LUF-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

function detectImageType(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length > 12 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const { assertHumanSubmission } = await import("@/lib/spam.server");
    await assertHumanSubmission({ honeypot: data.website, elapsedMs: data.elapsedMs, turnstileToken: data.turnstileToken });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadSettings } = await import("@/lib/settings.server");
    const { createCheckoutSession } = await import("@/lib/stripe.server");

    // --- Rate limit (databasbaserad) ---
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const [{ count: byEmail }, { count: global }] = await Promise.all([
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).ilike("email", data.email).gte("created_at", hourAgo),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", tenMinAgo),
    ]);
    if ((byEmail ?? 0) >= 5 || (global ?? 0) >= 40) {
      throw new Error("Vi har fått många beställningar på kort tid. Vänta en stund och försök igen, eller kontakta oss.");
    }

    // --- Pris räknas ALLTID om på servern ---
    const settings = await loadSettings();
    const pkg = PACKAGES[data.packageCode];
    const base = priceOf(settings, data.packageCode);
    const withDomainHelp = data.domainOption === "setup";
    const domainFee = withDomainHelp ? domainPrice(settings) : 0;
    const amount = base + domainFee;

    const needsQuote =
      data.moreWork ||
      data.features.some((f) => EXTRA_FEATURE_VALUES.includes(f)) ||
      data.pages.length > pkg.pageLimit;

    const orderNumber = newOrderNumber();

    // --- Logotyp (valfri). Innehållet verifieras via magic bytes, inte bara angiven typ. ---
    let logoPath: string | null = null;
    let logoFailed = false;
    if (data.logo) {
      try {
        const encoded = data.logo.dataUrl.split(",")[1];
        if (!encoded) throw new Error("tom logotyp");
        const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
        if (bytes.byteLength > 5_000_000) throw new Error("för stor");
        const type = detectImageType(bytes);
        if (!type) throw new Error("ogiltig bildtyp");
        const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
        const path = `${orderNumber}/logo.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage.from("order-logos").upload(path, bytes, { contentType: type, upsert: false });
        if (upErr) throw upErr;
        logoPath = path;
      } catch (err) {
        console.error("[order] logotyp kunde inte sparas", err);
        logoFailed = true; // Beställningen sparas ändå — vi tappar inte kunden.
      }
    }

    const brief = {
      companyType: data.companyType, city: data.city, heardFrom: data.heardFrom ?? null,
      description: data.description, audience: data.audience, usp: data.usp, goal: data.goal,
      pages: data.pages, pagesNote: data.pagesNote, features: data.features, featuresNote: data.featuresNote,
      moreWork: data.moreWork, contentSource: data.contentSource, languages: data.languages,
      contactDetailsToShow: data.contactDetailsToShow, style: data.style, colors: data.colors, mood: data.mood,
      imagery: data.imagery, references: data.references, dislikes: data.dislikes, hasBrandGuide: data.hasBrandGuide,
      instagram: data.instagram, tiktok: data.tiktok, otherLinks: data.otherLinks, existingWebsite: data.existingWebsite,
      extra: data.extra, logoUploadFailed: logoFailed,
    };

    const wantsToPayNow = data.payNow && !needsQuote;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        package_code: data.packageCode,
        company_name: data.companyName,
        contact_name: data.contactName,
        email: data.email,
        phone: data.phone || null,
        brief,
        needs_quote: needsQuote,
        domain_option: data.domainOption,
        domain_name: data.domainName || null,
        launch_date: data.launchDate || null,
        logo_path: logoPath,
        pay_preference: wantsToPayNow ? "now" : "later",
        amount_kr: amount,
      })
      .select("id")
      .single();

    if (error || !order) {
      console.error("[order] insert failed", error);
      if (logoPath) await supabaseAdmin.storage.from("order-logos").remove([logoPath]);
      throw new Error("Beställningen kunde inte sparas. Försök igen eller kontakta oss.");
    }

    // --- Direktbetalning via Stripe (endast när ingen offert behövs) ---
    let checkoutUrl: string | null = null;
    let paymentError = false;
    if (wantsToPayNow && amount > 0) {
      const lines = [{ name: `LaunchUF ${pkg.name} (${orderNumber})`, description: `Hemsida — ${pkg.name}`, amountKr: base }];
      if (domainFee > 0) lines.push({ name: "Domänhjälp", description: "Hjälp med att hitta och koppla en egen domän", amountKr: domainFee });
      try {
        const session = await createCheckoutSession({ orderNumber, email: data.email, lines });
        if (session.ok && session.id && session.url) {
          const { error: updErr } = await supabaseAdmin
            .from("orders")
            .update({ stripe_session_id: session.id, payment_status: "pending" })
            .eq("id", order.id);
          if (updErr) throw updErr;
          checkoutUrl = session.url;
        } else {
          paymentError = true;
          console.error("[order] Stripe-session kunde inte skapas", session.error?.message);
        }
      } catch (err) {
        paymentError = true;
        console.error("[order] Stripe-fel", err);
      }
    }

    return { orderNumber, amount, needsQuote, checkoutUrl, paymentError };
  });

const confirmSchema = z.object({
  orderNo: z.string().min(3).max(40),
  sessionId: z.string().min(10).max(200),
});

/** Bekräftar betalning efter retur från Stripe. Sessions-ID fungerar som ett engångsbevis. */
export const confirmPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => confirmSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { retrieveSession } = await import("@/lib/stripe.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,order_number,amount_kr,payment_status,company_name,email,stripe_session_id")
      .eq("order_number", data.orderNo)
      .maybeSingle();

    if (!order || !order.stripe_session_id || order.stripe_session_id !== data.sessionId) {
      return { status: "saknas" as const, order: null };
    }

    let paid = order.payment_status === "paid";
    if (!paid) {
      const session = await retrieveSession(data.sessionId);
      paid =
        session.ok &&
        session.id === data.sessionId &&
        session.status === "complete" &&
        session.payment_status === "paid" &&
        session.client_reference_id === order.order_number &&
        session.amount_total === order.amount_kr * 100 &&
        session.currency?.toLowerCase() === "sek";
      if (paid) {
        await supabaseAdmin
          .from("orders")
          .update({ payment_status: "paid", stripe_payment_intent: session.payment_intent ?? null })
          .eq("id", order.id);
      }
    }

    if (!paid) return { status: "väntande" as const, order: null };
    return {
      status: "betald" as const,
      order: { orderNumber: order.order_number, amount: order.amount_kr, company: order.company_name, email: order.email },
    };
  });
