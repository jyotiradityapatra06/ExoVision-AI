"use client";

import {
  BarChart3,
  ChevronRight,
  Database,
  FileText,
  FlaskConical,
  LogOut,
  Menu,
  RadioTower,
  Search,
  Telescope,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  {
    label: "Workspace",
    links: [
      { href: "/dashboard", label: "Overview", icon: BarChart3 },
      { href: "/upload", label: "Analyze Curve", icon: Telescope },
      { href: "/datasets", label: "MAST Explorer", icon: Database },
      { href: "/demo", label: "Synthetic Demo", icon: FlaskConical },
    ],
  },
  {
    label: "Research",
    links: [{ href: "/reports", label: "Reports Archive", icon: FileText }],
  },
];

const routeMeta = [
  { match: (path: string) => path.startsWith("/results/"), section: "Analysis", title: "Analysis Results" },
  { match: (path: string) => path === "/dashboard", section: "Workspace", title: "Overview" },
  { match: (path: string) => path.startsWith("/upload"), section: "Analysis", title: "Analyze Curve" },
  { match: (path: string) => path === "/datasets", section: "Analysis", title: "MAST Explorer" },
  { match: (path: string) => path === "/demo", section: "Analysis", title: "Synthetic Demo" },
  { match: (path: string) => path === "/reports", section: "Research", title: "Reports Archive" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href === "/upload" && pathname.startsWith("/results/"));
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 group" aria-label="ExoVision AI dashboard">
      <div className="flex h-7 w-7 items-center justify-center rounded border border-cyan-400/30 bg-cyan-950/40 text-cyan-400 transition group-hover:border-cyan-400/50">
        <RadioTower className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium tracking-tight text-white flex items-center gap-1.5">
          ExoVision AI
          <span className="rounded border border-white/10 bg-white/5 px-1 py-0.2 text-[9px] font-mono text-zinc-400">
            v2.4
          </span>
        </span>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          Transit Classifier
        </span>
      </div>
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

  // Keyboard shortcut for command search ⌘K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        router.push("/datasets");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="border-b border-white/[0.08] pb-2 pt-3">
          <Brand />
        </div>

        {/* Quick Search / Command Shortcut */}
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              router.push("/datasets");
            }}
            className="flex w-full items-center justify-between rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-xs text-zinc-400 transition hover:border-white/[0.16] hover:bg-white/[0.05] hover:text-zinc-200"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-zinc-500" />
              <span>Search targets…</span>
            </span>
            <kbd className="rounded border border-white/[0.1] bg-white/[0.05] px-1 py-0.5 font-mono text-[9px] text-zinc-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="mt-3 px-2 space-y-4" aria-label="Application navigation">
          {navigation.map((group) => (
            <div key={group.label}>
              <h2 className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                {group.label}
              </h2>
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded px-2.5 py-1.5 text-xs font-normal transition ${
                        active
                          ? "bg-white/[0.07] text-white border border-white/[0.09]"
                          : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border border-transparent"
                      }`}
                    >
                      <link.icon
                        className={`h-4 w-4 shrink-0 ${active ? "text-cyan-400" : "text-zinc-500"}`}
                        aria-hidden="true"
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Account Footer */}
      <div className="border-t border-white/[0.08] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/[0.12] bg-white/[0.04] text-xs font-mono text-zinc-300">
              {user?.display_name?.slice(0, 1).toUpperCase() ?? "R"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-normal text-zinc-200">
                {user?.display_name ?? "Researcher"}
              </span>
              <span className="truncate text-[10px] font-mono text-zinc-500">
                {user?.email ?? "Authenticated account"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-transparent text-zinc-500 transition hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-zinc-300"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const meta = routeMeta.find((route) => route.match(pathname)) ?? {
    section: "Workspace",
    title: "ExoVision AI",
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = [
        ...drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnKey);
    requestAnimationFrame(() =>
      drawerRef.current?.querySelector<HTMLElement>("a[href]")?.focus(),
    );
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnKey);
    };
  }, [open]);

  return (
    <>
      <aside className="app-sidebar">
        <NavigationContent />
      </aside>
      <header className="app-topbar">
        <div className="app-mobile-brand">
          <Brand />
        </div>
        <div className="app-route-context">
          <span>{meta.section}</span>
          <ChevronRight className="h-3 w-3 text-zinc-600" aria-hidden="true" />
          <strong>{meta.title}</strong>
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className="app-menu-button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-app-navigation"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>
      <button
        type="button"
        className={`app-drawer-backdrop${open ? " is-open" : ""}`}
        aria-label="Close navigation menu"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />
      <aside
        ref={drawerRef}
        id="mobile-app-navigation"
        className={`app-drawer${open ? " is-open" : ""}`}
        aria-hidden={!open}
        inert={!open}
        aria-label="Mobile application navigation"
      >
        <NavigationContent onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
