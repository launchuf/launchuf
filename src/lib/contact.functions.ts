import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Skriv ditt namn").max(120),
  email: z.string().trim().email("Ogiltig e-postadress").max(255),
  subject: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(10, "Skriv minst 10 tecken").max(5000),
  website: z.string().max(200).optional().default(""), // honeypot
  elapsedMs: z.number().optional(),
  turnstileToken: z.string().max(2048).optional(),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const { assertHumanSubmission } = await import("@/lib/spam.server");
    await assertHumanSubmission({ honeypot: data.website, elapsedMs: data.elapsedMs, turnstileToken: data.turnstileToken });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Rate limit i databasen (delas mellan alla Worker-instanser, till skillnad från minnet).
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .ilike("email", data.email)
      .gte("created_at", since);
    if ((count ?? 0) >= 3) throw new Error("Du har skickat flera meddelanden nyligen. Vänta en stund och försök igen.");

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject || null,
      message: data.message,
    });
    if (error) {
      console.error("[contact] insert failed", error);
      throw new Error("Meddelandet kunde inte skickas. Försök igen om en stund.");
    }
    return { ok: true as const };
  });
