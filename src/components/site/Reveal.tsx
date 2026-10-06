import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Tona in vid scroll. Innehållet renderas synligt på servern (bra för SEO/LCP);
 * först efter hydrering döljs sådant som ligger under vecket och tonas sedan in.
 */
export function Reveal({
  children, className, delay = 0, as: Tag = "div",
}: { children: ReactNode; className?: string; delay?: number; as?: ElementType }) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) return; // redan synligt — låt vara
    el.setAttribute("data-reveal", "out");
    if (delay) el.style.transitionDelay = `${delay}ms`;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.setAttribute("data-reveal", "in");
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return <Tag ref={ref} className={className}>{children}</Tag>;
}
