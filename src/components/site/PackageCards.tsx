import type { MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAIN_PACKAGES, PACKAGES, formatPrice, type PackageCode } from "@/lib/packages";
import { priceOf } from "@/lib/settings";
import { useSettings } from "@/components/site/useSettings";

function spotlight(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

export function PackageCards({ compact = false }: { compact?: boolean }) {
  const s = useSettings();
  return (
    <div className="grid border-l border-t border-border lg:grid-cols-3">
      {MAIN_PACKAGES.map((code: PackageCode, index) => {
        const item = PACKAGES[code];
        const featured = code === "growth";
        return (
          <article
            key={code}
            onMouseMove={spotlight}
            className={`spotlight relative flex min-h-[470px] flex-col border-b border-r border-border p-7 lg:p-9 ${featured ? "bg-secondary" : "bg-background"}`}
          >
            {featured && (
              <span className="absolute right-5 top-5 bg-primary px-3 py-1 text-xs font-semibold uppercase text-primary-foreground">
                Mest vald
              </span>
            )}
            <span className="text-xs text-muted-foreground" aria-hidden="true">0{index + 1}</span>
            <h3 className="mt-8 font-display text-4xl">{item.name}</h3>
            <p className="mt-4 text-3xl font-semibold text-primary">{formatPrice(priceOf(s, code))}</p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.summary}</p>
            <ul className="mt-8 space-y-3">
              {item.features.slice(0, compact ? 4 : undefined).map((feature) => (
                <li key={feature} className="flex gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-muted-foreground">Leverans: {s.delivery_text}</p>
            <Button asChild variant={featured ? "default" : "outline"} className="mt-4">
              <Link to="/bestall" search={{ paket: code }}>
                Välj {item.name} <ArrowRight />
              </Link>
            </Button>
          </article>
        );
      })}
    </div>
  );
}
