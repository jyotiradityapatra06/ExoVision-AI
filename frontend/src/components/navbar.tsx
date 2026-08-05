"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/upload", label: "Observatory" },
    { href: "/reports", label: "Reports" },
  ];

  return (
    <nav className="flex justify-between items-center w-full px-gutter h-16 fixed top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_0_20px_rgba(0,218,243,0.15)]">
      <div className="flex items-center gap-8">
        <Link href="/" className="font-hero-lg text-headline-md tracking-tighter text-primary">
          ExoVision AI
        </Link>
        <div className="hidden md:flex gap-6 font-label-caps text-label-caps">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:bg-primary/10 px-3 py-2 rounded-DEFAULT duration-300 ${
                  active
                    ? "text-primary border-b-2 border-primary shadow-[0_4px_10px_-2px_rgba(0,218,243,0.5)]"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3 font-data-mono text-data-mono">
            <span className="hidden lg:inline text-primary font-bold">{user.display_name}</span>
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
  );
}
