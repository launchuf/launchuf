import { SITE_NAME, SITE_URL } from "@/lib/settings";

export const OG_IMAGE = `${SITE_URL}/og-image.png`;

type JsonLd = Record<string, unknown>;

export function pageHead(opts: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  jsonLd?: JsonLd[];
  type?: "website" | "article";
}) {
  const url = `${SITE_URL}${opts.path === "/" ? "" : opts.path}`;
  const meta: Array<Record<string, string>> = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
    { property: "og:type", content: opts.type ?? "website" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
  ];
  if (opts.noindex) meta.push({ name: "robots", content: "noindex, nofollow" });
  return {
    meta,
    links: [{ rel: "canonical", href: url }],
    scripts: (opts.jsonLd ?? []).map((data) => ({ type: "application/ld+json", children: JSON.stringify(data) })),
  };
}

export function breadcrumbs(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export function faqJsonLd(faqs: ReadonlyArray<{ q: string; a: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export { SITE_NAME };
