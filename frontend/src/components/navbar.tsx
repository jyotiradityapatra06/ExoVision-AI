"use client";

import { BarChart3, ChevronRight, Database, FileText, FlaskConical, LogOut, Menu, RadioTower, Telescope, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { label: "Overview", links: [{ href: "/dashboard", label: "Dashboard", icon: BarChart3 }] },
  { label: "Analysis", links: [
    { href: "/upload", label: "Analyze Observation", icon: Telescope },
    { href: "/datasets", label: "Datasets", icon: Database },
    { href: "/demo", label: "Demo", icon: FlaskConical },
  ] },
  { label: "Research", links: [{ href: "/reports", label: "Reports", icon: FileText }] },
];

const routeMeta = [
  { match: (path: string) => path.startsWith("/results/"), section: "Analysis", title: "Analysis Results" },
  { match: (path: string) => path === "/dashboard", section: "Overview", title: "Dashboard" },
  { match: (path: string) => path === "/upload", section: "Analysis", title: "Analyze Observation" },
  { match: (path: string) => path === "/datasets", section: "Analysis", title: "Datasets" },
  { match: (path: string) => path === "/demo", section: "Analysis", title: "Demo" },
  { match: (path: string) => path === "/reports", section: "Research", title: "Reports" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href === "/upload" && pathname.startsWith("/results/"));
}

function Brand() {
  return (
    <Link href="/dashboard" className="app-brand" aria-label="ExoVision AI dashboard">
      <span className="app-brand-mark"><RadioTower aria-hidden="true" /></span>
      <span className="app-brand-copy"><strong>ExoVision</strong><small>AI Observatory</small></span>
    </Link>
  );
}

function NavigationContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      <div className="app-nav-brand"><Brand /></div>
      <nav className="app-nav-sections" aria-label="Application navigation">
        {navigation.map((group) => (
          <section className="app-nav-section" key={group.label}>
            <h2>{group.label}</h2>
            <div>{group.links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link className={`app-nav-link${active ? " is-active" : ""}`} href={link.href} key={link.href}
                  onClick={onNavigate} aria-current={active ? "page" : undefined} title={link.label}>
                  <link.icon aria-hidden="true" /><span>{link.label}</span>
                </Link>
              );
            })}</div>
          </section>
        ))}
      </nav>
      <div className="app-account">
        <div className="app-account-avatar" aria-hidden="true">{user?.display_name?.slice(0, 1).toUpperCase() ?? "R"}</div>
        <div className="app-account-copy"><strong>{user?.display_name ?? "Researcher"}</strong><span>{user?.email ?? "Authenticated account"}</span></div>
        <button type="button" onClick={logout} className="app-sign-out" aria-label="Sign out" title="Sign out"><LogOut aria-hidden="true" /></button>
      </div>
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const meta = routeMeta.find((route) => route.match(pathname)) ?? { section: "Workspace", title: "ExoVision AI" };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <aside className="app-sidebar"><NavigationContent /></aside>
      <header className="app-topbar">
        <div className="app-mobile-brand"><Brand /></div>
        <div className="app-route-context"><span>{meta.section}</span><ChevronRight aria-hidden="true" /><strong>{meta.title}</strong></div>
        <button type="button" className="app-menu-button" aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open} aria-controls="mobile-app-navigation" onClick={() => setOpen((current) => !current)}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>
      <button type="button" className={`app-drawer-backdrop${open ? " is-open" : ""}`} aria-label="Close navigation menu"
        tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} />
      <aside id="mobile-app-navigation" className={`app-drawer${open ? " is-open" : ""}`} aria-hidden={!open} inert={!open}>
        <NavigationContent onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
