import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_SETTINGS, SETTING_KEYS, mergeSettings, type SettingKey, type SiteSettings } from "@/lib/settings";

export const Route = createFileRoute("/admin/installningar")({ component: SettingsPage });

const GROUPS: Array<{ title: string; hint?: string; fields: Array<{ key: SettingKey; label: string; placeholder?: string; type?: "number" }> }> = [
  { title: "Kontakt", fields: [
    { key: "contact_email", label: "E-post", placeholder: "hej@dindomän.se" },
    { key: "contact_phone", label: "Telefon", placeholder: "070-123 45 67" },
  ] },
  { title: "Sociala medier", hint: "Skriv @användarnamn eller hela länken. Tomma fält visas inte på sajten.", fields: [
    { key: "instagram", label: "Instagram", placeholder: "@launchuf" },
    { key: "tiktok", label: "TikTok", placeholder: "@launchuf" },
    { key: "facebook", label: "Facebook", placeholder: "sidnamn" },
    { key: "linkedin", label: "LinkedIn", placeholder: "företagsnamn" },
    { key: "youtube", label: "YouTube", placeholder: "@kanal" },
  ] },
  { title: "Leverans", fields: [{ key: "delivery_text", label: "Leveranstid (visas överallt)", placeholder: "2–5 dagar" }] },
  { title: "Priser (kr)", hint: "Ändrar både det som visas och det som debiteras i Stripe.", fields: [
    { key: "price_start", label: "Start", type: "number" },
    { key: "price_growth", label: "Tillväxt", type: "number" },
    { key: "price_premium", label: "Premium", type: "number" },
    { key: "price_uf", label: "UF-paketet", type: "number" },
    { key: "price_domain", label: "Domänhjälp (tillägg)", type: "number" },
  ] },
  { title: "Statistik och Google", hint: "Cloudflare Web Analytics är cookiefri. Google Analytics laddas bara om besökaren godkänner.", fields: [
    { key: "cf_analytics_token", label: "Cloudflare Web Analytics-token" },
    { key: "ga4_id", label: "Google Analytics 4-ID", placeholder: "G-XXXXXXXXXX" },
    { key: "google_site_verification", label: "Google Search Console — verifieringskod (meta-taggens content-värde)" },
  ] },
];

function validate(v: SiteSettings): string | null {
  for (const key of ["price_start", "price_growth", "price_premium", "price_uf", "price_domain"] as const) {
    if (!/^\d{1,6}$/.test(v[key].trim())) return "Priser måste vara hela tal (kr).";
  }
  if (v.delivery_text.trim().length === 0) return "Leveranstid får inte vara tom.";
  if (v.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.contact_email)) return "Ogiltig e-postadress.";
  if (v.ga4_id && !/^G-[A-Z0-9]{4,20}$/.test(v.ga4_id)) return "Google Analytics-ID ska se ut som G-XXXXXXXXXX.";
  if (v.cf_analytics_token && !/^[a-f0-9]{16,64}$/i.test(v.cf_analytics_token)) return "Cloudflare-token ska vara en hex-sträng.";
  return null;
}

function SettingsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [values, setValues] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const query = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key,value");
      if (error) throw error;
      return mergeSettings(data);
    },
  });
  useEffect(() => { if (query.data) setValues(query.data); }, [query.data]);

  const save = useMutation({
    mutationFn: async () => {
      const problem = validate(values);
      if (problem) throw new Error(problem);
      const rows = SETTING_KEYS.map((key) => ({ key, value: values[key].trim().slice(0, 500) }));
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Inställningarna är sparade"); void qc.invalidateQueries({ queryKey: ["admin", "settings"] }); void router.invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte spara"),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="max-w-3xl space-y-10">
      <h1 className="font-display text-4xl">Inställningar</h1>
      {query.error && <p role="alert" className="text-destructive">Kunde inte läsa inställningar.</p>}
      {GROUPS.map((g) => (
        <fieldset key={g.title} className="space-y-4 border border-border bg-card p-6">
          <legend className="px-2 font-display text-2xl">{g.title}</legend>
          {g.hint && <p className="text-xs text-muted-foreground">{g.hint}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {g.fields.map((f) => (
              <label key={f.key} className="space-y-1.5 text-xs">
                {f.label}
                <Input
                  type={f.type === "number" ? "text" : "text"}
                  inputMode={f.type === "number" ? "numeric" : undefined}
                  maxLength={500}
                  placeholder={f.placeholder}
                  value={values[f.key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <Button type="submit" size="lg" disabled={save.isPending}>{save.isPending ? "Sparar…" : "Spara inställningar"}</Button>
    </form>
  );
}
