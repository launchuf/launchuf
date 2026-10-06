import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ExternalLink, Globe, Inbox, LayoutDashboard, LogOut, Settings, ShoppingCart } from "lucide-react";
import { AdminGate, useSignOut } from "@/components/admin/AdminGate";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — LaunchUF" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false, // Admin körs bara i webbläsaren (kräver inloggning).
  component: () => (
    <AdminGate>
      <AdminLayout />
    </AdminGate>
  ),
});

const nav = [
  { to: "/admin", label: "Översikt", icon: LayoutDashboard, exact: true },
  { to: "/admin/bestallningar", label: "Beställningar", icon: ShoppingCart, exact: false },
  { to: "/admin/kunder", label: "Kunder", icon: Globe, exact: false },
  { to: "/admin/meddelanden", label: "Meddelanden", icon: Inbox, exact: false },
  { to: "/admin/installningar", label: "Inställningar", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const signOut = useSignOut();
  return (
    <div className="min-h-screen bg-background text-sm md:flex">
      <aside className="border-b border-border bg-secondary md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:py-6">
          <span className="font-display text-2xl">Launch<span className="text-primary">UF</span> <span className="text-xs text-muted-foreground">admin</span></span>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => void signOut()} aria-label="Logga ut"><LogOut /></Button>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              className="flex shrink-0 items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-primary" }}
            >
              <Icon className="size-4" aria-hidden="true" /> {label}
            </Link>
          ))}
        </nav>
        <div className="hidden space-y-1 border-t border-border p-3 md:block">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-foreground"><ExternalLink className="size-4" aria-hidden="true" /> Visa sajten</a>
          <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-foreground"><LogOut className="size-4" aria-hidden="true" /> Logga ut</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
