// SERVER-ONLY. Importeras dynamiskt inuti server functions.
import { createSupabasePublicClient, supabaseAdmin } from "@/integrations/supabase/client.server";
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from "@/lib/settings";

/**
 * Läser inställningar. Först med service role; om det misslyckas (t.ex. fel/saknad nyckel)
 * används den publika nyckeln (kräver policyn "Public read settings" i schema.sql).
 */
export async function loadSettings(): Promise<SiteSettings> {
  try {
    const { data, error } = await supabaseAdmin.from("site_settings").select("key,value");
    if (error) throw error;
    return mergeSettings(data);
  } catch (adminError) {
    console.error("[settings] service role-läsning misslyckades — försöker med publik nyckel", adminError);
    try {
      const { data, error } = await createSupabasePublicClient().from("site_settings").select("key,value");
      if (error) throw error;
      return mergeSettings(data);
    } catch (publicError) {
      console.error("[settings] kunde inte läsa site_settings, använder standardvärden", publicError);
      return DEFAULT_SETTINGS;
    }
  }
}
