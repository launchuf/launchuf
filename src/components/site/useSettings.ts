import { getRouteApi } from "@tanstack/react-router";
import type { SiteSettings } from "@/lib/settings";

const rootApi = getRouteApi("__root__");

export function useSettings(): SiteSettings {
  return rootApi.useLoaderData().settings;
}
