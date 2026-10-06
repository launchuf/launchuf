import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, text, children }: { eyebrow: string; title: ReactNode; text?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="hero-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.95] md:text-7xl">{title}</h1>
        {text && <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">{text}</p>}
        {children}
      </div>
    </section>
  );
}
