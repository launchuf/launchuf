import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SitePreview } from "@/components/site/SitePreview";
import { useSettings } from "@/components/site/useSettings";
import { startHomeMotion } from "@/lib/home-motion";
import { getClientSites } from "@/lib/settings.functions";
import { MAIN_PACKAGES, PACKAGES, formatPrice } from "@/lib/packages";
import { domainPrice, priceOf } from "@/lib/settings";
import { buildFaqs } from "@/lib/faq";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: () => getClientSites(),
  head: () =>
    pageHead({
      title: "LAUNCH UF — Hemsidor för småföretag och UF-företag | Från 299 kr",
      description: "LAUNCH UF bygger genomtänkta hemsidor från grunden. Paket från 299 kr, snabb leverans och hjälp med egen domän.",
      path: "/",
    }),
  component: HomePage,
});

const TICKER = ["Skräddarsydd design", "Hemsidor för småföretag", "Mobilanpassat", "Tydliga priser", "Snabb leverans"];

const PROCESS = [
  ["01", "Ni beställer", "Berätta om företaget, ladda upp loggan och ge oss en känsla för hur ni vill att sidan ska se ut."],
  ["02", "Vi designar", "Vi tar ert material och bygger sidan från grunden med ert varumärke, era färger och ert innehåll i fokus."],
  ["03", "Ni godkänner", "Ni ser sidan innan den går live. Vi justerar text, färg och innehåll tills det stämmer."],
  ["04", "Sidan lanseras", "Hemsidan går live och tar emot besökare — och beställningar, om ni vill ha det."],
] as const;

function hostOf(url: string) {
  try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; }
}

function HomePage() {
  const s = useSettings();
  const clients = Route.useLoaderData();
  const maxDays = Number((s.delivery_text.match(/\d+/g) ?? []).pop()) || 5;
  const faqs = buildFaqs(s).slice(0, 5);
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!root.current) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    void startHomeMotion(root.current).then((fn) => { if (cancelled) fn(); else stop = fn; });
    return () => { cancelled = true; stop?.(); };
  }, []);

  return (
    <div className="old" ref={root}>
      <div className="loader" aria-hidden="true">
        <div className="loader-mark">LAUNCH</div>
        <div className="loader-bar"><span /></div>
      </div>

      <section className="hero">
        <canvas id="hero3d" aria-hidden="true" />
        <div className="hero-vignette" />
        <div className="hero-content">
          <p className="hero-eyebrow">Hemsidor för småföretag och UF · Snabbt · Genomtänkt · Klart</p>
          <h1 className="hero-title">
            <span className="line">Bygg företaget</span>
            <span className="line">kunder <em>litar</em> på.</span>
          </h1>
          <p className="hero-lead">
            LAUNCH UF designar och bygger hemsidor från grunden åt småföretag och UF-företag. Ni berättar vad ni vill ha — vi gör resten, snabbt och utan färdiga mallar. Leverans på {s.delivery_text}.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary magnetic" to="/bestall">Beställ er hemsida</Link>
            <Link className="button button-ghost" to="/paket">Se paket och priser</Link>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true">
          <span>Scrolla</span>
          <div className="hero-scroll-track"><i /></div>
        </div>
      </section>

      <section className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((half) => (
            <div className="ticker-half" key={half}>
              {[0, 1, 2, 3].flatMap((rep) =>
                TICKER.flatMap((t) => [<span key={`${rep}${t}`}>{t}</span>, <span key={`${rep}${t}d`}>·</span>]),
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="stats section-shell" aria-label="Fakta">
        <div className="stat"><span className="stat-num" data-count="24">24</span><span className="stat-label">Timmar till första kontakt</span></div>
        <div className="stat"><span className="stat-num" data-count={maxDays}>{maxDays}</span><span className="stat-label">Dagar som mest till färdig sida</span></div>
        <div className="stat"><span className="stat-num" data-count="4">4</span><span className="stat-label">Tydliga paket att välja</span></div>
        <div className="stat"><span className="stat-num" data-count={priceOf(s, "uf")}>{priceOf(s, "uf")}</span><span className="stat-label">Kr för att komma igång</span></div>
      </section>

      <section className="intro section-shell">
        <p className="section-kicker">Varför LAUNCH</p>
        <div className="intro-grid">
          <h2>De flesta småföretag lägger år på verksamheten<br />och femton minuter på hemsidan.</h2>
          <div className="intro-side">
            <p>Det syns. En hemsida byggd på en kväll i en gratismall gör att ett bra företag känns halvfärdigt.</p>
            <p className="muted">Vi gör tvärtom: er hemsida ska kännas lika genomtänkt som det ni faktiskt säljer — och göra det enkelt för kunder att höra av sig och köpa.</p>
          </div>
        </div>
      </section>

      <section className="packages section-shell" id="packages">
        <div className="section-heading">
          <p className="section-kicker">Paket</p>
          <h2>Tre paket. Ett pris ni förstår.</h2>
        </div>
        <div className="package-grid three">
          {MAIN_PACKAGES.map((code) => {
            const p = PACKAGES[code];
            const featured = code === "growth";
            return (
              <article key={code} className={`package-card compact${featured ? " is-featured" : ""}`}>
                {featured && <div className="featured-tag">Mest vald</div>}
                <div className="package-head">
                  <h3>{p.name}</h3>
                  <p>{p.summary}</p>
                </div>
                <div className="price"><span className="price-num">{priceOf(s, code)}</span><span className="price-unit">kr</span></div>
                <ul className="package-list">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                <Link className="package-btn magnetic" to="/bestall" search={{ paket: code }} style={{ display: "block", textAlign: "center" }}>Välj {p.name}</Link>
              </article>
            );
          })}
        </div>

        <div className="uf-band">
          <div>
            <h3>Driver ni ett UF-företag?</h3>
            <p>UF-paketet ger er en komplett landningssida för {formatPrice(priceOf(s, "uf"))}. Egen domän med hjälp: +{formatPrice(domainPrice(s))}.</p>
          </div>
          <Link className="button button-primary" to="/uf">Se UF-paketet</Link>
        </div>

        <p className="package-footnote">
          Leverans på {s.delivery_text}. Behöver ni mer än paketet? <Link to="/kontakt" style={{ color: "var(--gold-bright)" }}>Kontakta oss</Link> — priset kan då skilja sig. Betala direkt eller senare.
        </p>
      </section>

      <section className="process section-shell" id="process">
        <p className="section-kicker">Process</p>
        <h2 className="process-title">Från formulär till lanserad sida.</h2>
        <div className="process-list">
          {PROCESS.map(([n, t, d]) => (
            <div className="process-item" key={n}>
              <span className="process-index">{n}</span>
              <div className="process-body"><h3>{t}</h3><p>{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="showcase" id="showcase">
        <div className="showcase-pin">
          <p className="section-kicker light">Arbetet</p>
          <h2 className="showcase-title">Byggt runt <em>er</em>, inte runt en färdig mall.</h2>
          <div className="showcase-stage" role="img" aria-label="Illustration av tre hemsidor: en landningssida, en produktsida och ett kontaktformulär">
            <div className="mock mock-1"><div className="mock-bar"><i /><i /><i /></div><div className="mock-body"><div className="mock-hero" /><div className="mock-row"><div className="mock-block" /><div className="mock-block short" /></div></div></div>
            <div className="mock mock-2"><div className="mock-bar"><i /><i /><i /></div><div className="mock-body dark"><div className="mock-grid"><div className="mock-card" /><div className="mock-card" /><div className="mock-card" /></div></div></div>
            <div className="mock mock-3"><div className="mock-bar"><i /><i /><i /></div><div className="mock-body"><div className="mock-form"><i /><i /><i className="wide" /></div></div></div>
          </div>
          <p className="showcase-copy">Landningssida. Produktpresentation. Kontakt och beställning. Varje sida byggs efter företaget som ska använda den.</p>
        </div>
      </section>

      {clients.length > 0 && (
        <section className="clients section-shell" id="kunder" aria-labelledby="clients-title">
          <div className="section-heading">
            <p className="section-kicker">Våra kunder</p>
            <h2 id="clients-title">Sidor vi byggt.</h2>
          </div>
          <ul className="clients-grid">
            {clients.map((c) => (
              <li key={c.id}>
                <article className="client-card">
                  <div className="client-bar" aria-hidden="true"><i /><i /><i /><span>{hostOf(c.url)}</span></div>
                  {c.show_preview && <SitePreview url={c.url} name={c.name} />}
                  <div className="client-body">
                    <h3>{c.name}</h3>
                    {c.description && <p>{c.description}</p>}
                    <a className="client-visit" href={c.url} target="_blank" rel="noopener noreferrer">
                      Besök sidan ↗<span className="sr-only"> ({c.name}, öppnas i ny flik)</span>
                    </a>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="quote section-shell">
        <blockquote>”Vi la ner all vår tid på produkten. LAUNCH gav oss en hemsida som gjorde att kunder faktiskt tog oss på allvar.”</blockquote>
        <cite>— Feedback från ett av våra första kundprojekt</cite>
      </section>

      <section className="faq section-shell" id="faq">
        <p className="section-kicker">Vanliga frågor</p>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}<span className="faq-icon" /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <p style={{ marginTop: 28 }}><Link to="/faq" style={{ color: "var(--gold-bright)" }}>Alla vanliga frågor →</Link></p>
      </section>

      <section className="cta section-shell">
        <h2>Redo att få en hemsida som kunder litar på?</h2>
        <p>Paket från {formatPrice(priceOf(s, "uf"))}. Fyll i formuläret, välj betalning och skicka in.</p>
        <Link className="button button-primary large magnetic" to="/bestall">Beställ er hemsida</Link>
      </section>
    </div>
  );
}
