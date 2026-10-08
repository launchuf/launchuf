import { useEffect, useRef, useState } from "react";

const VIEW_W = 1280;
const VIEW_H = 800;

/**
 * Live-förhandsvisning av en kunds sida: den riktiga sidan i en förminskad, ickeklickbar ram.
 * Obs: vissa sidor förbjuder inbäddning (X-Frame-Options / frame-ancestors). Då kan ramen visas tom —
 * stäng i så fall av "Live-förhandsvisning" för kunden i Admin → Kunder.
 */
export function SitePreview({ url, name }: { url: string; name: string }) {
  const box = useRef<HTMLDivElement | null>(null);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / VIEW_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // "inert" gör att innehållet i ramen aldrig kan fokuseras med tangentbordet.
  useEffect(() => { frame.current?.setAttribute("inert", ""); }, []);

  return (
    <div className="client-preview" ref={box} style={{ height: VIEW_H * scale }}>
      <iframe
        ref={frame}
        src={url}
        title={`Förhandsvisning av ${name}`}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        tabIndex={-1}
        aria-hidden="true"
        style={{ width: VIEW_W, height: VIEW_H, transform: `scale(${scale})` }}
      />
    </div>
  );
}
