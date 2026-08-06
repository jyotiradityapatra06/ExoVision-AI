"use client";

import { BarChart3, Database, FileText, FlaskConical, LogOut, RadioTower, Telescope } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/upload", label: "Observatory", icon: Telescope },
    { href: "/datasets", label: "Datasets", icon: Database },
    { href: "/demo", label: "Demo", icon: FlaskConical },
    { href: "/reports", label: "Reports", icon: FileText },
  ];

  return (
    <>
    <nav className={`fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-2xl sm:px-6 lg:px-8 ${user ? "border-cyan-200/10 bg-[#030815]/90 shadow-[0_12px_40px_rgba(0,0,0,.35)]" : "border-outline-variant/30 bg-surface/80"}`}>
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-3 tracking-tight text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 shadow-[0_0_18px_rgba(0,218,243,.12)]"><RadioTower className="h-4 w-4" /></span>
          <span className="font-semibold">ExoVision <span className="text-cyan-300">AI</span></span>
        </Link>
        <div className="hidden md:flex gap-6 font-label-caps text-label-caps">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${
                  active
                    ? "bg-cyan-300/10 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(103,232,249,.16)]"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
              >
                <link.icon className="h-3.5 w-3.5" />{link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3 font-data-mono text-data-mono">
            <span className="hidden lg:block text-right"><span className="block text-[9px] uppercase tracking-[.18em] text-slate-600">Researcher</span><span className="block text-xs font-semibold text-slate-200">{user.display_name}</span></span>
            <button
              onClick={logout}
              title="Sign Out"
              className="text-on-surface-variant hover:text-rose-400 p-2 transition-colors"
              type="button"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="font-label-caps text-label-caps text-primary border border-primary/50 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-DEFAULT transition-all"
          >
            SIGN IN
          </Link>
        )}
      </div>
    </nav>
    {user && <nav aria-label="Mobile primary navigation" className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-2xl border border-cyan-200/10 bg-[#050a16]/95 px-1 py-2 shadow-2xl backdrop-blur-2xl md:hidden">{links.map((link) => <Link className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1 font-mono text-[8px] uppercase tracking-tight ${pathname === link.href ? "text-cyan-200" : "text-slate-500"}`} href={link.href} key={link.href}><link.icon className="h-4 w-4" />{link.label === "Observatory" ? "Observe" : link.label}</Link>)}</nav>}
    </>
  );
}
