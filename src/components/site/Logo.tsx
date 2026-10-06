import { Link } from "@tanstack/react-router";

export function Logo({ className = "text-2xl" }: { className?: string }) {
  return (
    <Link to="/" aria-label="LaunchUF — till startsidan" className={`font-display text-foreground ${className}`}>
      Launch<span className="text-primary">UF</span>
    </Link>
  );
}
