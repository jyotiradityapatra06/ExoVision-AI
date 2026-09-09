"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLayoutEffect, type ReactNode } from "react";

import { Navbar } from "@/components/navbar";
import { AtmosphereVariant, ObservatoryBackground } from "@/components/observatory/ObservatoryBackground";
import { useAuth } from "@/contexts/AuthContext";

const applicationRoutes = ["/dashboard", "/upload", "/datasets", "/demo", "/reports", "/results"];

function getRouteVariant(path: string): AtmosphereVariant {
  if (path.startsWith("/results")) return "results";
  if (path.startsWith("/upload")) return "upload";
  if (path.startsWith("/datasets")) return "datasets";
  if (path.startsWith("/demo")) return "demo";
  if (path.startsWith("/dashboard")) return "dashboard";
  if (path.startsWith("/reports")) return "reports";
  return "default";
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loading, user } = useAuth();
  const isApplicationRoute = applicationRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const variant = getRouteVariant(pathname);

  useLayoutEffect(() => {
    if (isApplicationRoute && user) window.scrollTo(0, 0);
  }, [isApplicationRoute, pathname, user]);

  if (pathname === "/") return children;
  if (!isApplicationRoute) return <div className="min-h-screen bg-obs-void text-on-surface">{children}</div>;

  if (loading) {
    return (
      <div className="app-session-loading" role="status" aria-live="polite">
        <span className="app-brand-mark"><LoaderCircle className="animate-spin" aria-hidden="true" /></span>
        <p>Restoring research session</p>
      </div>
    );
  }

  if (!user) return <div className="min-h-screen bg-obs-void text-on-surface">{children}</div>;

  return (
    <div className="app-shell">
      <ObservatoryBackground variant={variant} />
      <Navbar />
      <main className="app-shell-main">{children}</main>
    </div>
  );
}
