import { createServerFn } from "@tanstack/react-start";

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { loadSettings } = await import("@/lib/settings.server");
  return loadSettings();
});

export type PublicClient = { id: string; name: string; url: string; description: string };

/** Kundwebbplatser som visas på startsidan (bara de som är markerade som synliga). */
export const getClientSites = createServerFn({ method: "GET" }).handler(async (): Promise<PublicClient[]> => {
  const { createSupabasePublicClient, supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const query = (client: ReturnType<typeof createSupabasePublicClient>) =>
    client
      .from("client_sites")
      .select("id,name,url,description")
      .eq("visible", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
  try {
    const { data, error } = await query(supabaseAdmin);
    if (error) throw error;
    return data ?? [];
  } catch (adminError) {
    console.error("[clients] service role-läsning misslyckades — försöker med publik nyckel", adminError);
    try {
      const { data, error } = await query(createSupabasePublicClient());
      if (error) throw error;
      return data ?? [];
    } catch (publicError) {
      console.error("[clients] kunde inte läsa client_sites", publicError);
      return [];
    }
  }
});
