// Auth session storage — plain localStorage for self-hosted deploys.
export function brokeredPreviewStorage() {
  if (typeof window === "undefined") return undefined;
  return localStorage;
}
