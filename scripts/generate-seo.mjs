// Genererar public/robots.txt och public/sitemap.xml utifrån VITE_SITE_URL så att domänen aldrig behöver ändras för hand.
import { writeFileSync, mkdirSync } from "node:fs";

const site = (process.env.VITE_SITE_URL || "https://launchuf.se").replace(/\/+$/, "");
if (!/^https:\/\//.test(site) && !/^http:\/\/localhost/.test(site)) {
  console.error(`VITE_SITE_URL måste börja med https:// (fick: ${site})`);
  process.exit(1);
}
mkdirSync("public", { recursive: true });

const pages = [
  ["/", "1.0", "weekly"],
  ["/paket", "0.9", "weekly"],
  ["/uf", "0.9", "weekly"],
  ["/bestall", "0.8", "monthly"],
  ["/om-oss", "0.6", "monthly"],
  ["/faq", "0.6", "monthly"],
  ["/kontakt", "0.6", "monthly"],
  ["/integritetspolicy", "0.2", "yearly"],
  ["/villkor", "0.2", "yearly"],
];
const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([p, prio, freq]) => `  <url><loc>${site}${p === "/" ? "" : p}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`).join("\n")}
</urlset>
`;
writeFileSync("public/sitemap.xml", xml);
writeFileSync("public/robots.txt", `User-agent: *
Allow: /
Disallow: /admin
Disallow: /betalning/
Disallow: /tack
Disallow: /api/

Sitemap: ${site}/sitemap.xml
`);
console.log(`SEO-filer genererade för ${site}`);
