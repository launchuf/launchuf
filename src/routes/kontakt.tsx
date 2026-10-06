import { useCallback, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Mail, Phone } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageIntro } from "@/components/site/PageIntro";
import { FormField } from "@/components/site/FormField";
import { Turnstile } from "@/components/site/Turnstile";
import { InstagramIcon, TikTokIcon, FacebookIcon, LinkedInIcon, YouTubeIcon } from "@/components/site/Icons";
import { useSettings } from "@/components/site/useSettings";
import { socialUrl } from "@/lib/settings";
import { submitContact } from "@/lib/contact.functions";
import { useFormTimer } from "@/lib/useFormTimer";
import { breadcrumbs, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/kontakt")({
  head: () =>
    pageHead({
      title: "Kontakt — skriv till LaunchUF",
      description: "Har du en fråga om paket, pris eller ett eget projekt? Skriv till oss så återkommer vi så snart vi kan.",
      path: "/kontakt",
      jsonLd: [
        breadcrumbs([{ name: "Hem", path: "/" }, { name: "Kontakt", path: "/kontakt" }]),
        { "@context": "https://schema.org", "@type": "ContactPage", name: "Kontakt LaunchUF" },
      ],
    }),
  component: KontaktPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Skriv ditt namn"),
  email: z.string().trim().email("Skriv en giltig e-postadress"),
  message: z.string().trim().min(10, "Skriv minst 10 tecken"),
});

function KontaktPage() {
  const s = useSettings();
  const send = useServerFn(submitContact);
  const elapsed = useFormTimer();
  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState("");
  const onToken = useCallback((t: string) => setToken(t), []);
  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string | undefined> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await send({ data: { ...values, elapsedMs: elapsed(), ...(token ? { turnstileToken: token } : {}) } });
      setDone(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Något gick fel. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  const socials = [
    { name: "Instagram", url: socialUrl("instagram", s.instagram), Icon: InstagramIcon },
    { name: "TikTok", url: socialUrl("tiktok", s.tiktok), Icon: TikTokIcon },
    { name: "Facebook", url: socialUrl("facebook", s.facebook), Icon: FacebookIcon },
    { name: "LinkedIn", url: socialUrl("linkedin", s.linkedin), Icon: LinkedInIcon },
    { name: "YouTube", url: socialUrl("youtube", s.youtube), Icon: YouTubeIcon },
  ].filter((x) => x.url);

  return (
    <>
      <PageIntro eyebrow="Kontakt" title="Hör av er. Vi svarar." text="Frågor om paket, pris eller ett projekt som inte riktigt passar in? Skriv några rader så återkommer vi." />
      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-20 md:grid-cols-[1.3fr_0.7fr] lg:px-10">
        {done ? (
          <div role="status" className="border border-primary p-10">
            <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
            <h2 className="mt-6 font-display text-4xl">Tack — meddelandet är skickat.</h2>
            <p className="mt-3 text-muted-foreground">Vi läser det och svarar till {values.email} så snart vi kan.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-6" aria-label="Kontaktformulär">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Namn" required error={errors["name"]}>
                {(p) => <Input {...p} autoComplete="name" maxLength={120} value={values.name} onChange={set("name")} />}
              </FormField>
              <FormField label="E-post" required error={errors["email"]}>
                {(p) => <Input {...p} type="email" autoComplete="email" maxLength={255} value={values.email} onChange={set("email")} />}
              </FormField>
            </div>
            <FormField label="Ämne">
              {(p) => <Input {...p} maxLength={200} value={values.subject} onChange={set("subject")} />}
            </FormField>
            <FormField label="Meddelande" required error={errors["message"]}>
              {(p) => <Textarea {...p} rows={7} maxLength={5000} value={values.message} onChange={set("message")} />}
            </FormField>
            {/* Honeypot — dolt för människor och skärmläsare, bots fyller i det */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>Lämna detta fält tomt<input tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} /></label>
            </div>
            <Turnstile onToken={onToken} />
            {formError && <p role="alert" className="border border-destructive p-4 text-sm text-destructive">{formError}</p>}
            <Button type="submit" size="lg" disabled={busy}>{busy ? "Skickar…" : "Skicka meddelande"}</Button>
            <p className="text-xs text-muted-foreground">
              Genom att skicka godkänner du att vi sparar uppgifterna för att svara dig. Läs vår <Link to="/integritetspolicy" className="underline">integritetspolicy</Link>.
            </p>
          </form>
        )}

        <aside className="space-y-8" aria-label="Kontaktuppgifter">
          {s.contact_email && (
            <div>
              <h2 className="eyebrow">E-post</h2>
              <a href={`mailto:${s.contact_email}`} className="mt-3 flex items-center gap-3 text-lg hover:text-primary"><Mail className="size-5 text-primary" aria-hidden="true" />{s.contact_email}</a>
            </div>
          )}
          {s.contact_phone && (
            <div>
              <h2 className="eyebrow">Telefon</h2>
              <a href={`tel:${s.contact_phone.replace(/[^+\d]/g, "")}`} className="mt-3 flex items-center gap-3 text-lg hover:text-primary"><Phone className="size-5 text-primary" aria-hidden="true" />{s.contact_phone}</a>
            </div>
          )}
          {socials.length > 0 && (
            <div>
              <h2 className="eyebrow">Följ oss</h2>
              <ul className="mt-3 flex gap-3">
                {socials.map(({ name, url, Icon }) => (
                  <li key={name}>
                    <a href={url ?? "#"} target="_blank" rel="noopener noreferrer me" aria-label={`LaunchUF på ${name}`} className="flex size-11 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary">
                      <Icon className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="border border-border bg-secondary p-6">
            <h2 className="font-display text-2xl">Redo att starta?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Beställ direkt — ju mer ni berättar, desto bättre blir första utkastet.</p>
            <Button asChild className="mt-4"><Link to="/bestall">Starta projekt</Link></Button>
          </div>
        </aside>
      </section>
    </>
  );
}
