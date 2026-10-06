import type { Faq } from "@/lib/faq";

// <details> är tillgängligt som standard (tangentbord + skärmläsare) och fungerar utan JS.
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-display text-2xl marker:hidden [&::-webkit-details-marker]:hidden">
            {item.q}
            <span aria-hidden="true" className="text-primary transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
