import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand({
  title = "Redo att bli tagen på allvar online?",
  text = "Berätta vad ni bygger. Vi gör resten tydligt, snabbt och snyggt.",
  to = "/bestall",
  label = "Starta projekt",
}: { title?: string; text?: string; to?: "/bestall" | "/paket" | "/kontakt"; label?: string }) {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 md:flex-row md:items-end lg:px-10">
        <div>
          <h2 className="max-w-3xl font-display text-4xl leading-none md:text-6xl">{title}</h2>
          <p className="mt-5 max-w-xl text-base opacity-85">{text}</p>
        </div>
        <Button asChild variant="secondary" size="lg">
          <Link to={to}>{label} <ArrowRight /></Link>
        </Button>
      </div>
    </section>
  );
}
