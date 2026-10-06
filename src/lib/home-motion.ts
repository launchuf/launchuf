/* eslint-disable */
// @ts-nocheck
// Animationer från den gamla sajten (GSAP + three.js). Biblioteken laddas från CDN, precis som förut.
import { initHero3d } from "@/lib/hero3d";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("kunde inte ladda " + src));
    document.head.appendChild(s);
  });
}

export async function startHomeMotion(root: HTMLElement): Promise<() => void> {
  const cleanups: Array<() => void> = [];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Magnetiska knappar
  root.querySelectorAll(".magnetic").forEach((btn: HTMLElement) => {
    const move = (e: PointerEvent) => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.12}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    };
    const leave = () => { btn.style.transform = ""; };
    btn.addEventListener("pointermove", move);
    btn.addEventListener("pointerleave", leave);
    cleanups.push(() => { btn.removeEventListener("pointermove", move); btn.removeEventListener("pointerleave", leave); });
  });

  if (reduce) return () => cleanups.forEach((c) => c());

  let ctx: any = null;
  try {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js");
    const { gsap, ScrollTrigger } = window as any;
    gsap.registerPlugin(ScrollTrigger);
    ctx = gsap.context(() => {
      gsap.from(".hero-title .line", { y: "110%", duration: 1.1, ease: "power4.out", stagger: 0.1, delay: 0.3 });
      gsap.from(".hero-eyebrow, .hero-lead, .hero-actions", { y: 16, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.9 });
      [".intro-grid h2", ".intro-side p", ".package-card", ".uf-band", ".process-item", ".client-card", ".faq-list details", ".quote blockquote", ".cta h2", ".cta p", ".cta .button", ".section-heading", ".showcase-title", ".showcase-copy"].forEach((sel) => {
        gsap.utils.toArray(sel).forEach((el: Element, i: number) => {
          gsap.fromTo(el, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: (i % 4) * 0.06, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        });
      });
      gsap.utils.toArray(".stat-num").forEach((el: HTMLElement) => {
        const target = Number(el.dataset.count);
        if (!target) return;
        const obj = { val: 0 };
        ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => gsap.to(obj, { val: target, duration: 1.6, ease: "power2.out", onUpdate: () => { el.textContent = String(Math.round(obj.val)); } }) });
      });
      gsap.set(".mock-2", { zIndex: 3 });
      [[".mock-1", -30], [".mock-2", 20], [".mock-3", -50]].forEach(([sel, y]) => {
        gsap.to(sel, { y, scrollTrigger: { trigger: ".showcase", start: "top bottom", end: "bottom top", scrub: 1 } });
      });
    }, root);
    cleanups.push(() => ctx && ctx.revert());
  } catch (e) {
    console.warn("[motion] GSAP kunde inte laddas — sidan visas utan animationer", e);
  }

  // three.js-hjälte (hoppas över på små skärmar för snabbare laddning)
  const canvas = root.querySelector("#hero3d") as HTMLCanvasElement | null;
  if (canvas && window.innerWidth > 700) {
    try {
      const THREE = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
      if (canvas.isConnected) cleanups.push(initHero3d(THREE, canvas));
    } catch (e) {
      console.warn("[motion] three.js kunde inte laddas", e);
    }
  }
  return () => cleanups.forEach((c) => c());
}
