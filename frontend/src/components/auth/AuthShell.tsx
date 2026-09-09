"use client";

import { ArrowLeft, LoaderCircle, RadioTower, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ObservatoryBackground } from "@/components/observatory/ObservatoryBackground";

export function AuthShell({ children, eyebrow, title, description, alternateHref, alternateLabel }: { children: ReactNode; eyebrow: string; title: string; description: string; alternateHref: string; alternateLabel: string }) {
  const { loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!loading && user) router.replace("/dashboard"); }, [loading, router, user]);

  if (loading || user) return <div className="app-session-loading" role="status" aria-live="polite"><span className="app-brand-mark"><LoaderCircle className="animate-spin" aria-hidden="true" /></span><p>{loading ? "Restoring research session" : "Opening research workspace"}</p></div>;

  return <main className="auth-shell">
    <ObservatoryBackground variant="auth" className="observatory-background-auth" />
    <section className="auth-context" aria-labelledby="auth-product-title">
      <div className="auth-celestial" aria-hidden="true"><span /><span /><i /><svg viewBox="0 0 600 120" preserveAspectRatio="none"><path d="M0 60 C80 57 132 63 202 59 S288 55 320 60 L332 60 L339 88 L347 34 L355 78 L365 60 C430 56 508 64 600 58" /></svg></div>
      <Link href="/" className="auth-brand"><span className="app-brand-mark"><RadioTower aria-hidden="true" /></span><span><strong id="auth-product-title">ExoVision AI</strong><small>Candidate-screening platform</small></span></Link>
      <div className="auth-context-copy"><p className="workspace-kicker">AI-assisted transit analysis</p><h1>Evidence-first exoplanet candidate screening.</h1><p>Analyze stellar light curves with a transparent pipeline built around measurable transit signals, classifier output, and scientific caveats.</p></div>
      <div className="auth-assurance"><ShieldCheck aria-hidden="true" /><div><strong>Account-scoped workspace</strong><span>Your analyses and generated reports are protected by authenticated ownership checks.</span></div></div>
    </section>
    <section className="auth-panel" aria-labelledby="auth-form-title"><div className="auth-panel-inner"><div className="auth-panel-heading"><p>{eyebrow}</p><h2 id="auth-form-title">{title}</h2><span>{description}</span></div>{children}<div className="auth-alternate"><span>Need another path?</span><Link href={alternateHref}>{alternateLabel}</Link></div><Link href="/" className="auth-return"><ArrowLeft aria-hidden="true" /> Return to public overview</Link></div></section>
  </main>;
}
