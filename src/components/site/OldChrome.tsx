import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";
import { openCookieSettings } from "@/components/site/CookieConsent";
import { InstagramIcon, TikTokIcon, FacebookIcon, LinkedInIcon, YouTubeIcon } from "@/components/site/Icons";
import { useSettings } from "@/components/site/useSettings";
import { socialUrl } from "@/lib/settings";

const LINKS = [
  { to: "/", label: "Hem", exact: true },
  { to: "/paket", label: "Paket", exact: false },
  { to: "/om-oss", label: "Om oss", exact: false },
  { to: "/kontakt", label: "Kontakt", exact: false },
] as const;

/** "@launchuf" eller "https://instagram.com/launchuf" → "@launchuf" för visning. */
function handleLabel(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) {
    try { const u = new URL(v); return (u.pathname.replace(/^\/+|\/+$/g, "") || u.hostname).replace(/^company\//, ""); } catch { return v; }
  }
  return v.startsWith("@") ? v : `@${v}`;
}

function BrandMark() {
  return (
    <span className="brand-mark">
      <svg viewBox="0 0 100 128" aria-hidden="true" focusable="false">
        <path d="M50 4 C66 4 74 32 74 52 L74 92 L26 92 L26 52 C26 32 34 4 50 4 Z M26 74 L4 102 L26 102 Z M74 74 L96 102 L74 102 Z M36 92 L50 124 L64 92 Z" fill="currentColor" />
        <circle cx="50" cy="42" r="9" className="logo-hole" />
      </svg>
    </span>
  );
}

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="LAUNCH UF — till startsidan">
      <BrandMark />
      <span className="brand-word">LAUNCH<span className="brand-sub">UF</span></span>
    </Link>
  );
}

/** Kornig overlay + glöd som följer muspekaren (från den gamla sajten). */
export function OldAmbience() {
  useEffect(() => {
    const glow = document.querySelector<HTMLElement>(".old .cursor-glow");
    if (!glow) return;
    const move = (e: PointerEvent) => { glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`; };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div className="old" aria-hidden="true">
      <div className="grain" />
      <div className="cursor-glow" />
    </div>
  );
}

export function OldHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="old">
      <header className={`site-header${scrolled ? " scrolled" : ""}`} id="siteHeader">
        <Brand />
        <nav className="nav" aria-label="Huvudmeny">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: l.exact }} activeProps={{ "aria-current": "page" }}>{l.label}</Link>
          ))}
        </nav>
        <div className="header-end">
          <button type="button" className={`nav-toggle${open ? " open" : ""}`} aria-label="Meny" aria-expanded={open} aria-controls="mobileNav" onClick={() => setOpen((v) => !v)}>
            <span />
          </button>
        </div>
      </header>
      <div className={`mobile-nav${open ? " open" : ""}`} id="mobileNav">
        {LINKS.map((l) => <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>)}
      </div>
    </div>
  );
}

export function OldFooter() {
  const s = useSettings();
  const socials = [
    { name: "Instagram", raw: s.instagram, url: socialUrl("instagram", s.instagram), Icon: InstagramIcon },
    { name: "TikTok", raw: s.tiktok, url: socialUrl("tiktok", s.tiktok), Icon: TikTokIcon },
    { name: "Facebook", raw: s.facebook, url: socialUrl("facebook", s.facebook), Icon: FacebookIcon },
    { name: "LinkedIn", raw: s.linkedin, url: socialUrl("linkedin", s.linkedin), Icon: LinkedInIcon },
    { name: "YouTube", raw: s.youtube, url: socialUrl("youtube", s.youtube), Icon: YouTubeIcon },
  ].filter((x) => x.url);
  return (
    <div className="old">
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <Brand />
              <span className="footer-tag">Hemsidor som görs rätt</span>
              <p>Vi bygger genomtänkta hemsidor från grunden åt småföretag och UF-företag — snabbt, tydligt och till ett pris som går att förstå.</p>
            </div>
            <div>
              <span className="footer-heading">Sidor</span>
              <Link to="/paket">Paket</Link>
              <Link to="/uf">UF-paketet</Link>
              <Link to="/om-oss">Om oss</Link>
              <Link to="/faq">Vanliga frågor</Link>
              <Link to="/kontakt">Kontakt</Link>
              <Link to="/villkor">Villkor</Link>
              <Link to="/integritetspolicy">Integritetspolicy</Link>
              <button type="button" className="footer-link" onClick={openCookieSettings}>Cookie-inställningar</button>
            </div>
            <div>
              <span className="footer-heading">Följ oss</span>
              {socials.map(({ name, raw, url, Icon }) => (
                <a key={name} href={url ?? "#"} target="_blank" rel="noopener noreferrer me" aria-label={`LAUNCH UF på ${name}`} className="footer-row">
                  <Icon className="size-4" /> {handleLabel(raw)}
                </a>
              ))}
              {s.contact_email && <a className="footer-row" href={`mailto:${s.contact_email}`}><Mail size={16} aria-hidden="true" /> {s.contact_email}</a>}
              {s.contact_phone && <a className="footer-row" href={`tel:${s.contact_phone.replace(/[^+\d]/g, "")}`}><Phone size={16} aria-hidden="true" /> {s.contact_phone}</a>}
              {socials.length === 0 && !s.contact_email && !s.contact_phone && <Link className="footer-row" to="/kontakt">Skriv till oss →</Link>}
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} LAUNCH UF</span>
            <span className="footer-caps">Din idé. Lanserad rätt.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
