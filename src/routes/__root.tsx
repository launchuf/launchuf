import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent, Link, Outlet, Scripts, createRootRouteWithContext, useLocation, useRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { OldAmbience, OldFooter, OldHeader } from "@/components/site/OldChrome";
import { CookieConsent } from "@/components/site/CookieConsent";
import { Analytics } from "@/components/site/Analytics";
import { JsonLd } from "@/components/site/JsonLd";
import { useSettings } from "@/components/site/useSettings";
import { getSiteSettings } from "@/lib/settings.functions";
import { OG_IMAGE } from "@/lib/seo";
import { SITE_NAME, SITE_URL, socialUrl } from "@/lib/settings";

function NotFoundComponent() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="gold-text font-display text-[clamp(7rem,26vw,14rem)] leading-none" aria-hidden="true">404</p>
      <h1 className="mt-2 font-display text-5xl">Sidan finns inte</h1>
      <p className="mt-4 max-w-md leading-7 text-muted-foreground">Sidan du letar efter finns inte eller har flyttats. Kolla länken eller välj en av genvägarna nedan.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg"><Link to="/">Till startsidan</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/paket">Se paket</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/kontakt">Kontakta oss</Link></Button>
      </div>
    </section>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-4xl">Sidan kunde inte laddas</h1>
      <p className="mt-3 text-sm text-muted-foreground">Något gick fel. Försök igen eller gå tillbaka till startsidan.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => { void router.invalidate(); reset(); }}>Försök igen</Button>
        <Button asChild variant="outline"><a href="/">Till startsidan</a></Button>
      </div>
    </section>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Inställningar (priser, sociala medier, leveranstid …) hämtas på servern och cachas i 5 min.
  loader: async () => ({ settings: await getSiteSettings() }),
  staleTime: 5 * 60_000,
  head: ({ loaderData }) => {
    const verification = loaderData?.settings.google_site_verification;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "author", content: SITE_NAME },
        { name: "theme-color", content: "#07080a" },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:locale", content: "sv_SE" },
        { property: "og:image", content: OG_IMAGE },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "LaunchUF — hemsidor som får företag att kännas större" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: OG_IMAGE },
        ...(verification ? [{ name: "google-site-verification", content: verification }] : []),
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const },
        { rel: "stylesheet", href: appCss },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,340;9..144,460;9..144,560&family=Inter:wght@400;500;600&display=swap" },
        { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function OrgJsonLd() {
  const s = useSettings();
  const sameAs = (["instagram", "tiktok", "facebook", "linkedin", "youtube"] as const)
    .map((n) => socialUrl(n, s[n]))
    .filter((u): u is string => Boolean(u));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/favicon.svg`,
          ...(sameAs.length ? { sameAs } : {}),
          ...(s.contact_email ? { contactPoint: { "@type": "ContactPoint", email: s.contact_email, contactType: "customer service", availableLanguage: "sv" } } : {}),
        }}
      />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL, inLanguage: "sv-SE" }} />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      {isAdmin ? (
        <Outlet />
      ) : (
        <>
          <a href="#main" className="skip-link">Hoppa till innehållet</a>
          <OrgJsonLd />
          <OldAmbience />
          <OldHeader />
          <main id="main" className={pathname === "/" ? "" : "pt-24"}>
            <Outlet />
          </main>
          <OldFooter />
          <CookieConsent />
          <Analytics />
        </>
      )}
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
}
