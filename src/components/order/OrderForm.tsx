import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/site/FormField";
import { Turnstile } from "@/components/site/Turnstile";
import { useSettings } from "@/components/site/useSettings";
import {
  COMPANY_TYPES, CONTENT_SOURCES, DOMAIN_OPTIONS, EXTRA_FEATURE_VALUES, FEATURES, GOALS, HEARD_FROM, IMAGERY, PAGE_OPTIONS, STYLES,
} from "@/lib/brief";
import { ALL_PACKAGES, PACKAGES, formatPrice, type PackageCode } from "@/lib/packages";
import { domainPrice, priceOf } from "@/lib/settings";
import { createOrder } from "@/lib/orders.functions";
import { useFormTimer } from "@/lib/useFormTimer";

type Logo = { dataUrl: string; fileName: string; mimeType: "image/png" | "image/jpeg" | "image/webp" };

type Draft = {
  packageCode: PackageCode;
  companyName: string; contactName: string; email: string; phone: string; companyType: string; city: string; heardFrom: string;
  description: string; audience: string; usp: string; goal: string;
  pages: string[]; pagesNote: string; features: string[]; featuresNote: string; moreWork: boolean;
  contentSource: string; languages: string; contactDetailsToShow: string;
  style: string; colors: string; mood: string; imagery: string; references: string; dislikes: string; hasBrandGuide: boolean;
  instagram: string; tiktok: string; otherLinks: string; existingWebsite: string;
  domainOption: "none" | "owned" | "setup"; domainName: string; launchDate: string; extra: string;
  payNow: boolean; consent: boolean; website: string;
};

const STEPS = ["Paket", "Om er", "Verksamheten", "Innehåll", "Design", "Lansering"] as const;
const DRAFT_KEY = "luf_order_draft_v1";

const initial = (code: PackageCode): Draft => ({
  packageCode: code,
  companyName: "", contactName: "", email: "", phone: "", companyType: code === "uf" ? "uf" : "enskild", city: "", heardFrom: "",
  description: "", audience: "", usp: "", goal: "contact",
  pages: [], pagesNote: "", features: [], featuresNote: "", moreWork: false,
  contentSource: "mix", languages: "Svenska", contactDetailsToShow: "",
  style: "modern", colors: "", mood: "", imagery: "unsure", references: "", dislikes: "", hasBrandGuide: false,
  instagram: "", tiktok: "", otherLinks: "", existingWebsite: "",
  domainOption: "none", domainName: "", launchDate: "", extra: "",
  payNow: false, consent: false, website: "",
});

type Errors = Record<string, string | undefined>;

function validate(step: number, f: Draft): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (f.companyName.trim().length < 2) e["companyName"] = "Skriv företagets namn";
    if (f.contactName.trim().length < 2) e["contactName"] = "Skriv kontaktpersonens namn";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e["email"] = "Skriv en giltig e-postadress";
  }
  if (step === 2 && f.description.trim().length < 10) e["description"] = "Beskriv verksamheten med minst 10 tecken";
  if (step === 5) {
    if (f.domainOption === "owned" && f.domainName.trim().length < 3) e["domainName"] = "Skriv domännamnet ni redan äger";
    if (!f.consent) e["consent"] = "Du måste godkänna hanteringen av uppgifter";
  }
  return e;
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function OrderForm({ initialPackage }: { initialPackage: PackageCode }) {
  const s = useSettings();
  const submitOrder = useServerFn(createOrder);
  const navigate = useNavigate();
  const elapsed = useFormTimer();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Draft>(() => initial(initialPackage));
  const [logo, setLogo] = useState<Logo | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const onToken = useCallback((t: string) => setToken(t), []);

  // Återställ påbörjat utkast (utan logotyp) om sidan laddas om.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Draft>;
        setForm((prev) => ({ ...prev, ...saved, packageCode: initialPackage, consent: false, website: "" }));
      }
    } catch { /* ignorera trasigt utkast */ }
  }, [initialPackage]);
  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, consent: false })); } catch { /* privat läge */ }
  }, [form]);
  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const text = (key: keyof Draft) => (e: { target: { value: string } }) => set(key, e.target.value as never);

  const pkg = PACKAGES[form.packageCode];
  const needsQuote = useMemo(
    () => form.moreWork || form.features.some((f) => EXTRA_FEATURE_VALUES.includes(f)) || form.pages.length > pkg.pageLimit,
    [form.moreWork, form.features, form.pages, pkg.pageLimit],
  );
  const base = priceOf(s, form.packageCode);
  const domainFee = form.domainOption === "setup" ? domainPrice(s) : 0;
  const total = base + domainFee;

  async function selectLogo(file: File | undefined) {
    setFormError("");
    if (!file) { setLogo(null); return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setFormError("Logotypen måste vara PNG, JPG eller WebP."); return; }
    if (file.size > 5_000_000) { setFormError("Logotypen får vara högst 5 MB."); return; }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("läsfel")));
      reader.onerror = () => reject(new Error("läsfel"));
      reader.readAsDataURL(file);
    }).catch(() => null);
    if (!dataUrl) { setFormError("Logotypen kunde inte läsas. Prova en annan fil."); return; }
    setLogo({ dataUrl, fileName: file.name, mimeType: file.type as Logo["mimeType"] });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const found = validate(step, form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (step < STEPS.length - 1) { setStep((v) => v + 1); window.scrollTo({ top: 0, behavior: "smooth" }); return; }

    // Sista steget: kontrollera ALLA steg igen innan vi skickar.
    for (let i = 0; i < STEPS.length; i++) {
      const stepErrors = validate(i, form);
      if (Object.keys(stepErrors).length > 0) { setStep(i); setErrors(stepErrors); return; }
    }
    setBusy(true);
    try {
      const { website, consent, heardFrom, ...rest } = form;
      const result = await submitOrder({
        data: {
          ...rest,
          ...(heardFrom ? { heardFrom: heardFrom as never } : {}),
          companyType: rest.companyType as never, goal: rest.goal as never, contentSource: rest.contentSource as never,
          style: rest.style as never, imagery: rest.imagery as never, features: rest.features as never,
          consent: consent as true, website, logo, elapsedMs: elapsed(),
          ...(token ? { turnstileToken: token } : {}),
        },
      });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* */ }
      if (result.checkoutUrl) { window.location.assign(result.checkoutUrl); return; }
      await navigate({ to: "/tack", search: { order: result.orderNumber, quote: result.needsQuote ? 1 : 0, payerr: result.paymentError ? 1 : 0 } });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Något gick fel. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-5xl px-5 py-12 lg:px-10" aria-label="Beställning">
      <ol className="mb-10 grid grid-cols-3 border border-border md:grid-cols-6" aria-label="Steg i beställningen">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={`border-b border-r border-border px-2 py-3 text-center text-xs md:border-b-0 md:last:border-r-0 ${i <= step ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Section title="Välj paket" headingRef={headingRef}>
          <div role="radiogroup" aria-label="Paket" className="grid gap-4 md:grid-cols-2">
            {ALL_PACKAGES.map((code) => (
              <label key={code} className={`cursor-pointer border p-6 focus-within:outline focus-within:outline-2 focus-within:outline-ring ${form.packageCode === code ? "border-primary bg-secondary" : "border-border"}`}>
                <input className="sr-only" type="radio" name="package" checked={form.packageCode === code} onChange={() => set("packageCode", code)} />
                <span className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block font-display text-3xl">{PACKAGES[code].name}</span>
                    <span className="mt-2 block text-sm text-muted-foreground">{PACKAGES[code].summary}</span>
                    <span className="mt-2 block text-xs text-muted-foreground">Upp till {PACKAGES[code].pageLimit} {PACKAGES[code].pageLimit === 1 ? "sida" : "sidor"}</span>
                  </span>
                  <span className="font-semibold text-primary">{formatPrice(priceOf(s, code))}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Leverans: {s.delivery_text} efter att vi fått allt material. Ni kan byta paket senare i formuläret.</p>
        </Section>
      )}

      {step === 1 && (
        <Section title="Berätta om er" headingRef={headingRef}>
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Företagsnamn" required error={errors["companyName"]}>{(p) => <Input {...p} autoComplete="organization" maxLength={120} value={form.companyName} onChange={text("companyName")} />}</FormField>
            <FormField label="Kontaktperson" required error={errors["contactName"]}>{(p) => <Input {...p} autoComplete="name" maxLength={120} value={form.contactName} onChange={text("contactName")} />}</FormField>
            <FormField label="E-post" required error={errors["email"]}>{(p) => <Input {...p} type="email" autoComplete="email" maxLength={255} value={form.email} onChange={text("email")} />}</FormField>
            <FormField label="Telefon" hint="Valfritt — om ni vill att vi ringer vid frågor.">{(p) => <Input {...p} type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={text("phone")} />}</FormField>
            <FormField label="Typ av företag">{(p) => <Select {...p} value={form.companyType} onChange={text("companyType")} options={COMPANY_TYPES} />}</FormField>
            <FormField label={form.companyType === "uf" ? "Skola och ort" : "Ort"}>{(p) => <Input {...p} maxLength={80} value={form.city} onChange={text("city")} />}</FormField>
            <FormField label="Hur hittade ni oss?">{(p) => <Select {...p} value={form.heardFrom} onChange={text("heardFrom")} options={HEARD_FROM} placeholder="Välj (valfritt)" />}</FormField>
          </div>
        </Section>
      )}

      {step === 2 && (
        <Section title="Om verksamheten" headingRef={headingRef}>
          <div className="space-y-6">
            <FormField label="Vad gör ert företag?" required error={errors["description"]} hint="Vad säljer ni, till vem och varför är det bra?">
              {(p) => <Textarea {...p} rows={5} maxLength={2000} value={form.description} onChange={text("description")} />}
            </FormField>
            <FormField label="Vem vill ni nå?" hint="Er målgrupp — ålder, intressen, vilka som köper.">{(p) => <Textarea {...p} rows={3} maxLength={1000} value={form.audience} onChange={text("audience")} />}</FormField>
            <FormField label="Vad gör er särskilt?" hint="Tre saker som får kunder att välja er.">{(p) => <Textarea {...p} rows={3} maxLength={1000} value={form.usp} onChange={text("usp")} />}</FormField>
            <FormField label="Vad ska besökaren göra på sidan?">{(p) => <Select {...p} value={form.goal} onChange={text("goal")} options={GOALS} />}</FormField>
          </div>
        </Section>
      )}

      {step === 3 && (
        <Section title="Innehåll och funktioner" headingRef={headingRef}>
          <div className="space-y-8">
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Vilka sidor vill ni ha? <span className="text-muted-foreground">(paketet {pkg.name} ingår upp till {pkg.pageLimit})</span></legend>
              <div className="flex flex-wrap gap-2">
                {PAGE_OPTIONS.map((page) => (
                  <Chip key={page} checked={form.pages.includes(page)} onChange={() => set("pages", toggle(form.pages, page))}>{page}</Chip>
                ))}
              </div>
              <div className="mt-4"><FormField label="Andra sidor eller kommentarer">{(p) => <Input {...p} maxLength={1000} value={form.pagesNote} onChange={text("pagesNote")} />}</FormField></div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-sm font-medium">Funktioner</legend>
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((f) => (
                  <Chip key={f.value} checked={form.features.includes(f.value)} onChange={() => set("features", toggle(form.features, f.value))}>
                    {f.label}{f.extra ? " *" : ""}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">* Ingår inte i standardpaketen — vi lämnar en offert och priset kan skilja sig.</p>
              <div className="mt-4"><FormField label="Beskriv funktionerna närmare">{(p) => <Textarea {...p} rows={3} maxLength={1000} value={form.featuresNote} onChange={text("featuresNote")} />}</FormField></div>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" className="mt-1 size-4 accent-[var(--color-primary)]" checked={form.moreWork} onChange={(e) => set("moreWork", e.target.checked)} />
                <span>Vi tror att vårt projekt kräver mer arbete än paketet — kontakta oss med ett pris innan något påbörjas.</span>
              </label>
            </fieldset>

            {needsQuote && (
              <div role="status" className="flex gap-3 border border-primary bg-secondary p-4 text-sm leading-6">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <p>Era val ligger utanför paketet. Vi går igenom behovet och återkommer med en offert — <strong>priset kan skilja sig från {formatPrice(base)}</strong>. Direktbetalning stängs av för den här beställningen.</p>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Vem skriver texterna?">{(p) => <Select {...p} value={form.contentSource} onChange={text("contentSource")} options={CONTENT_SOURCES} />}</FormField>
              <FormField label="Språk på sidan">{(p) => <Input {...p} maxLength={120} value={form.languages} onChange={text("languages")} />}</FormField>
              <div className="md:col-span-2">
                <FormField label="Kontaktuppgifter som ska visas" hint="E-post, telefon, adress, öppettider …">{(p) => <Textarea {...p} rows={3} maxLength={500} value={form.contactDetailsToShow} onChange={text("contactDetailsToShow")} />}</FormField>
              </div>
            </div>
          </div>
        </Section>
      )}

      {step === 4 && (
        <Section title="Design och uttryck" headingRef={headingRef}>
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Önskad stil">{(p) => <Select {...p} value={form.style} onChange={text("style")} options={STYLES} />}</FormField>
            <FormField label="Bilder">{(p) => <Select {...p} value={form.imagery} onChange={text("imagery")} options={IMAGERY} />}</FormField>
            <FormField label="Färger" hint="Exempel: svart, vitt och guld — eller hex-koder.">{(p) => <Input {...p} maxLength={500} value={form.colors} onChange={text("colors")} />}</FormField>
            <FormField label="Logotyp" hint="PNG, JPG eller WebP, max 5 MB.">
              {(p) => <Input {...p} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void selectLogo(e.target.files?.[0])} />}
            </FormField>
            {logo && <p className="text-xs text-primary md:col-span-2">Vald logotyp: {logo.fileName}</p>}
            <div className="md:col-span-2"><FormField label="Hur ska sidan kännas?" hint="Tre ord räcker — t.ex. lyxig, lugn, självsäker.">{(p) => <Textarea {...p} rows={3} maxLength={1000} value={form.mood} onChange={text("mood")} />}</FormField></div>
            <div className="md:col-span-2"><FormField label="Hemsidor ni gillar" hint="Klistra in länkar och skriv vad ni gillar med dem.">{(p) => <Textarea {...p} rows={3} maxLength={1500} value={form.references} onChange={text("references")} />}</FormField></div>
            <div className="md:col-span-2"><FormField label="Sådant ni INTE vill ha">{(p) => <Textarea {...p} rows={2} maxLength={1000} value={form.dislikes} onChange={text("dislikes")} />}</FormField></div>
            <label className="flex cursor-pointer items-center gap-3 text-sm md:col-span-2">
              <input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={form.hasBrandGuide} onChange={(e) => set("hasBrandGuide", e.target.checked)} />
              Vi har en grafisk profil/varumärkesguide (skicka den gärna i mejl efteråt).
            </label>
            <FormField label="Instagram">{(p) => <Input {...p} maxLength={120} placeholder="@ertföretag" value={form.instagram} onChange={text("instagram")} />}</FormField>
            <FormField label="TikTok">{(p) => <Input {...p} maxLength={120} placeholder="@ertföretag" value={form.tiktok} onChange={text("tiktok")} />}</FormField>
            <FormField label="Andra länkar">{(p) => <Input {...p} maxLength={500} value={form.otherLinks} onChange={text("otherLinks")} />}</FormField>
            <FormField label="Nuvarande hemsida (om någon)">{(p) => <Input {...p} maxLength={200} value={form.existingWebsite} onChange={text("existingWebsite")} />}</FormField>
          </div>
        </Section>
      )}

      {step === 5 && (
        <Section title="Lansering och betalning" headingRef={headingRef}>
          <div className="grid gap-10 md:grid-cols-[1fr_320px]">
            <div className="space-y-8">
              <fieldset>
                <legend className="mb-3 text-sm font-medium">Domän</legend>
                <div className="grid gap-3">
                  {DOMAIN_OPTIONS.map((o) => (
                    <label key={o.value} className="flex cursor-pointer items-center gap-3 border border-border p-4 focus-within:outline focus-within:outline-2 focus-within:outline-ring">
                      <input type="radio" name="domain" className="accent-[var(--color-primary)]" checked={form.domainOption === o.value} onChange={() => set("domainOption", o.value)} />
                      {o.label}{o.value === "setup" ? ` (+${formatPrice(domainPrice(s))})` : ""}
                    </label>
                  ))}
                </div>
                {form.domainOption !== "none" && (
                  <div className="mt-4"><FormField label={form.domainOption === "owned" ? "Er domän" : "Önskat domännamn"} required={form.domainOption === "owned"} error={errors["domainName"]}>{(p) => <Input {...p} maxLength={120} placeholder="exempel.se" value={form.domainName} onChange={text("domainName")} />}</FormField></div>
                )}
              </fieldset>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField label="Önskat lanseringsdatum">{(p) => <Input {...p} type="date" value={form.launchDate} onChange={text("launchDate")} />}</FormField>
              </div>
              <FormField label="Något mer vi behöver veta?">{(p) => <Textarea {...p} rows={4} maxLength={2000} value={form.extra} onChange={text("extra")} />}</FormField>

              <fieldset>
                <legend className="mb-3 text-sm font-medium">Hur vill ni betala?</legend>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className={`flex cursor-pointer flex-col border p-4 ${needsQuote ? "cursor-not-allowed opacity-50" : ""} ${form.payNow && !needsQuote ? "border-primary bg-secondary" : "border-border"}`}>
                    <input type="radio" name="pay" className="sr-only" disabled={needsQuote} checked={form.payNow && !needsQuote} onChange={() => set("payNow", true)} />
                    <span className="font-medium">Betala nu</span>
                    <span className="mt-1 text-xs text-muted-foreground">{needsQuote ? "Inte tillgängligt när offert behövs." : "Säker betalning via Stripe."}</span>
                  </label>
                  <label className={`flex cursor-pointer flex-col border p-4 ${!form.payNow || needsQuote ? "border-primary bg-secondary" : "border-border"}`}>
                    <input type="radio" name="pay" className="sr-only" checked={!form.payNow || needsQuote} onChange={() => set("payNow", false)} />
                    <span className="font-medium">Betala senare</span>
                    <span className="mt-1 text-xs text-muted-foreground">Ingen betalning nu. Vi återkommer med nästa steg.</span>
                  </label>
                </div>
              </fieldset>

              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>Lämna detta fält tomt<input tabIndex={-1} autoComplete="off" value={form.website} onChange={text("website")} /></label>
              </div>

              <div>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-1 size-4 accent-[var(--color-primary)]" aria-invalid={Boolean(errors["consent"])} checked={form.consent} onChange={(e) => set("consent", e.target.checked)} />
                  <span>Jag godkänner att uppgifterna används för att behandla beställningen enligt <Link to="/integritetspolicy" target="_blank" className="underline">integritetspolicyn</Link> och <Link to="/villkor" target="_blank" className="underline">villkoren</Link>.</span>
                </label>
                {errors["consent"] && <p role="alert" className="mt-2 text-sm text-destructive">{errors["consent"]}</p>}
              </div>
              <Turnstile onToken={onToken} />
            </div>

            <aside className="h-fit border border-border bg-secondary p-6" aria-label="Sammanfattning">
              <p className="eyebrow">Sammanfattning</p>
              <h3 className="mt-4 font-display text-3xl">{pkg.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{form.companyName || "Ert företag"}</p>
              <dl className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex justify-between"><dt>Paket</dt><dd>{formatPrice(base)}</dd></div>
                {domainFee > 0 && <div className="flex justify-between"><dt>Domänhjälp</dt><dd>{formatPrice(domainFee)}</dd></div>}
                <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>{needsQuote ? "Från" : "Totalt"}</dt><dd className="text-primary">{formatPrice(total)}</dd></div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                {needsQuote ? "Slutpriset bekräftas i en offert innan arbetet startar." : `Leverans ${s.delivery_text}. Ni ser alltid totalsumman innan betalningen startar.`}
              </p>
            </aside>
          </div>
        </Section>
      )}

      {formError && <p role="alert" className="mt-8 border border-destructive p-4 text-sm text-destructive">{formError}</p>}
      {Object.keys(errors).length > 0 && <p role="alert" className="mt-4 text-sm text-destructive">Kontrollera de markerade fälten.</p>}

      <div className="mt-10 flex justify-between">
        <Button type="button" variant="ghost" disabled={step === 0 || busy} onClick={() => { setErrors({}); setStep((v) => v - 1); }}>
          <ChevronLeft /> Tillbaka
        </Button>
        <Button type="submit" size="lg" disabled={busy}>
          {step === STEPS.length - 1 ? (busy ? "Skickar…" : form.payNow && !needsQuote ? "Skicka och betala" : "Skicka beställning") : <>Fortsätt <ChevronRight /></>}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children, headingRef }: { title: string; children: ReactNode; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-4xl outline-none">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Chip({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className={`cursor-pointer border px-4 py-2 text-sm focus-within:outline focus-within:outline-2 focus-within:outline-ring ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}

function Select({
  value, onChange, options, placeholder, ...rest
}: {
  value: string; onChange: (e: { target: { value: string } }) => void; options: ReadonlyArray<{ value: string; label: string }>; placeholder?: string;
  id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string | undefined;
}) {
  return (
    <select className="field" value={value} onChange={onChange} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value} className="bg-background">{o.label}</option>)}
    </select>
  );
}
