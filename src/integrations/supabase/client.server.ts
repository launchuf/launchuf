// Server-side Supabase client with service role key - bypasses RLS.
// SECURITY: This file is server-only. Never import it from client components.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getServerEnv } from "@/lib/env.server";

function isNewSupabaseApiKey(value: string): boolean {
  return (
    value.startsWith("sb_publishable_") ||
    value.startsWith("sb_secret_")
  );
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request
        ? input.headers
        : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);

    return fetch(input, { ...init, headers });
  };
}

function createSupabaseAdminClient() {
  // getServerEnv() reads the live Cloudflare Worker binding at runtime.
  // The service-role key stays server-only and is never sent to the browser.
  const SUPABASE_URL = getServerEnv("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = getServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [
      !SUPABASE_URL ? "SUPABASE_URL" : null,
      !SUPABASE_SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter((v): v is string => v !== null);

    const message =
      `Missing Supabase environment variable(s): ${missing.join(", ")}. ` +
      `Check Cloudflare Workers → Settings → Variables and Secrets.`;

    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { fetch: createSupabaseFetch(SUPABASE_SERVICE_ROLE_KEY) },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy(
  {} as ReturnType<typeof createSupabaseAdminClient>,
  {
    get(_, prop, receiver) {
      if (!_supabaseAdmin) {
        _supabaseAdmin = createSupabaseAdminClient();
      }
      return Reflect.get(_supabaseAdmin, prop, receiver);
    },
  },
);

/**
 * Klient med publika nyckeln (följer RLS). Används som reserv för offentlig data
 * (inställningar, kundlistan) om service-role-nyckeln saknas eller är fel.
 */
export function createSupabasePublicClient() {
  const url = getServerEnv("SUPABASE_URL");
  const key = getServerEnv("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY saknas");
  return createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
