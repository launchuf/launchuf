import { env as cloudflareEnv } from "cloudflare:workers";

export function getServerEnv(name: string): string | undefined {
  const workerValue = (cloudflareEnv as unknown as Record<string, unknown>)[name];

  if (typeof workerValue === "string" && workerValue.length > 0) {
    return workerValue;
  }

  if (typeof process !== "undefined") {
    const processValue = process.env?.[name];

    if (processValue) {
      return processValue;
    }
  }

  return undefined;
}
