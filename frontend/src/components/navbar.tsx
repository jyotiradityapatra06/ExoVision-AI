"use client";

import { BarChart3, ChevronRight, Database, FileText, FlaskConical, LogOut, Menu, RadioTower, Telescope, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
      <span className="app-brand-mark">
        <RadioTower className="h-4 w-4 text-stellar-cyan" aria-hidden="true" />
      </span>
      <span className="app-brand-copy">
        <strong className="font-display tracking-tight text-starlight">ExoVision</strong>
        <small className="font-mono text-[9px] tracking-widest text-muted-slate uppercase">Digital Observatory</small>
      </span>
    </Link>
  );
}

function NavigationContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function signOut() {
    logout();
    onNavigate?.();
    router.replace("/auth/login");
  }

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
                <Link
                  className={`app-nav-link${active ? " is-active" : ""}`}
                  href={link.href}
                  key={link.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  title={link.label}
                >
                  <span className="app-nav-indicator" aria-hidden="true" />
                  <link.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}</div>
          </section>
        ))}
      </nav>
      <div className="app-account">
        <div className="app-account-avatar" aria-hidden="true">{user?.display_name?.slice(0, 1).toUpperCase() ?? "R"}</div>
        <div className="app-account-copy">
          <strong>{user?.display_name ?? "Researcher"}</strong>
          <span>{user?.email ?? "Authenticated account"}</span>
        </div>
        <button type="button" onClick={signOut} className="app-sign-out" aria-label="Sign out" title="Sign out">
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const meta = routeMeta.find((route) => route.match(pathname)) ?? { section: "Workspace", title: "ExoVision AI" };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); menuButtonRef.current?.focus(); return; }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = [...drawerRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnKey);
    requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLElement>("a[href]")?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnKey);
    };
  }, [open]);

  return (
    <>
      <aside className="app-sidebar"><NavigationContent /></aside>
      <header className="app-topbar">
        <div className="app-mobile-brand"><Brand /></div>
        <div className="app-route-context"><span>{meta.section}</span><ChevronRight aria-hidden="true" /><strong>{meta.title}</strong></div>
        <button ref={menuButtonRef} type="button" className="app-menu-button" aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open} aria-controls="mobile-app-navigation" onClick={() => setOpen((current) => !current)}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>
      <button type="button" className={`app-drawer-backdrop${open ? " is-open" : ""}`} aria-label="Close navigation menu"
        tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} />
      <aside ref={drawerRef} id="mobile-app-navigation" className={`app-drawer${open ? " is-open" : ""}`} aria-hidden={!open} inert={!open} aria-label="Mobile application navigation">
        <NavigationContent onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
