"use client";

import {
  BarChart3,
  ChevronRight,
  Database,
  FileText,
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
  { href: "/dashboard", label: "Workspace", icon: BarChart3 },
  { href: "/upload", label: "Analyze", icon: Telescope },
  { href: "/datasets", label: "NASA Archive", icon: Database },
  { href: "/reports", label: "Reports", icon: FileText },
];

const routeMeta = [
  { match: (path: string) => path.startsWith("/results/"), section: "Analysis", title: "Scientific Dossier" },
  { match: (path: string) => path === "/dashboard", section: "Observatory", title: "Research Workspace" },
  { match: (path: string) => path.startsWith("/upload"), section: "Analysis", title: "Analyze Observation" },
  { match: (path: string) => path === "/datasets", section: "Archive", title: "NASA MAST Explorer" },
  { match: (path: string) => path === "/demo", section: "Analysis", title: "Demo Pipeline" },
  { match: (path: string) => path === "/reports", section: "Research", title: "Scientific Archive" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/upload") return pathname === "/upload" || pathname.startsWith("/upload/") || pathname.startsWith("/results/") || pathname === "/demo";
  if (href === "/datasets") return pathname === "/datasets";
  if (href === "/reports") return pathname === "/reports";
  return pathname === href;
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 group" aria-label="ExoVision AI dashboard">
      <div className="flex h-7 w-7 items-center justify-center rounded border border-stone-700/60 bg-stone-900 text-stone-300 transition group-hover:border-stone-500">
        <RadioTower className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <span className="font-serif text-sm font-medium tracking-tight text-stone-100 flex items-center gap-1.5">
          ExoVision
          <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider">
            AI
          </span>
        </span>
        <span className="text-[9px] font-mono text-stone-400 tracking-wider">
          Observatory
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

        {/* Navigation Section */}
        <nav className="mt-3 px-2 space-y-1" aria-label="Application navigation">
          {navigation.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded px-2.5 py-2 text-xs font-normal transition ${
                  active
                    ? "bg-stone-800/80 text-stone-100 border border-stone-700/60"
                    : "text-stone-400 hover:bg-stone-900/50 hover:text-stone-200 border border-transparent"
                }`}
              >
                <item.icon
                  className={`h-4 w-4 shrink-0 ${active ? "text-stone-200" : "text-stone-500"}`}
                  aria-hidden="true"
                />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
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
