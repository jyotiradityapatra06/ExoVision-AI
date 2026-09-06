"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Navbar } from "@/components/navbar";
import { useAuth } from "@/contexts/AuthContext";

const applicationRoutes = ["/dashboard", "/upload", "/datasets", "/demo", "/reports", "/results"];

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loading, user } = useAuth();
  const isApplicationRoute = applicationRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (pathname === "/") return children;
  if (!isApplicationRoute) return <div className="min-h-screen bg-background text-on-surface">{children}</div>;

  if (loading) {
    return (
      <div className="app-session-loading" role="status" aria-live="polite">
        <span className="app-brand-mark"><LoaderCircle className="animate-spin" aria-hidden="true" /></span>
        <p>Restoring research session</p>
      </div>
    );
  }

  if (!user) return <div className="min-h-screen bg-[#05080d] text-on-surface">{children}</div>;

  return <div className="app-shell"><Navbar /><main className="app-shell-main">{children}</main></div>;
}
