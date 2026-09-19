"use client";

import { ArrowLeft, LoaderCircle, RadioTower, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ObservatoryBackground } from "@/components/observatory/ObservatoryBackground";

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  alternateHref,
  alternateLabel,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  alternateHref: string;
  alternateLabel: string;
}) {
  const { loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  if (loading || user) {
    return (
      <div className="app-session-loading" role="status" aria-live="polite">
        <span className="app-brand-mark">
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        </span>
        <p>{loading ? "Restoring research session" : "Opening research workspace"}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#090b0e] text-starlight flex flex-col lg:flex-row relative overflow-x-hidden selection:bg-sky-500/30 selection:text-white">
      <ObservatoryBackground variant="auth" />

      {/* Left Column: Scientific Research Identity (~58% desktop width) */}
      <section
        className="lg:w-[56%] xl:w-[58%] flex flex-col justify-between p-8 sm:p-12 lg:p-14 xl:p-16 border-b lg:border-b-0 lg:border-r border-white/[0.06] bg-gradient-to-b from-[#0d1015]/80 via-[#090b0e]/90 to-[#090b0e] relative z-10"
        aria-labelledby="auth-product-title"
      >
        {/* Top Header: Brand Identity */}
        <header>
          <Link
            href="/"
            className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md p-1 -m-1"
            aria-label="ExoVision AI home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded border border-white/[0.12] bg-[#11151b] text-cyan-400 transition-colors group-hover:border-cyan-400/40">
              <RadioTower className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-tight text-white flex items-center gap-1.5" id="auth-product-title">
                ExoVision AI
                <span className="rounded border border-white/10 bg-white/5 px-1 py-0.2 text-[9px] font-mono text-zinc-400 font-normal">
                  v2.4
                </span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                Exoplanet Transit Screening
              </span>
            </div>
          </Link>
        </header>

        {/* Center: Editorial Narrative & Scientific Waveform Motif */}
        <div className="my-auto py-10 lg:py-16 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] text-cyan-400 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
            AI-Assisted Transit Analysis
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold text-white tracking-tight leading-[1.15] mb-5 font-sans">
            Evidence-first<br />
            exoplanet candidate<br />
            <span className="text-zinc-400">screening.</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-lg mb-8 font-sans">
            Analyze stellar light curves with a transparent pipeline built around measurable transit signals, classifier output, and scientific caveats.
          </p>

          {/* Restrained Scientific Waveform Motif (Pure SVG, subtle, decorative) */}
          <div className="rounded border border-white/[0.06] bg-[#0c1017]/80 p-3.5 max-w-md" aria-hidden="true">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-1 w-1 rounded-full bg-cyan-400" />
                Transit Photometry Baseline
              </span>
              <span>P = 3.52 d · δ = 1.42%</span>
            </div>
            <svg className="w-full h-10" viewBox="0 0 400 40" fill="none">
              <line x1="0" y1="14" x2="400" y2="14" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <path
                d="M 0 14 L 130 14 C 150 14 165 32 200 32 C 235 32 250 14 270 14 L 400 14"
                stroke="#38bdf8"
                strokeWidth="1.25"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>
          </div>
        </div>

        {/* Bottom: Research Assurance */}
        <footer className="flex items-center gap-2.5 text-xs text-zinc-400 border-t border-white/[0.06] pt-5 max-w-md">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="text-[11px] leading-relaxed">
            Account-scoped workspace with authenticated observation ownership checks.
          </span>
        </footer>
      </section>

      {/* Right Column: Authentication Form (~44% desktop width) */}
      <section
        className="lg:w-[44%] xl:w-[42%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[#090b0e] relative z-10"
        aria-labelledby="auth-form-title"
      >
        <div className="my-auto w-full max-w-[440px] mx-auto py-6">
          <div className="mb-6">
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-400 mb-1.5 font-medium">
              {eyebrow}
            </p>
            <h2 id="auth-form-title" className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-2">
              {title}
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {description}
            </p>
          </div>

          {children}

          <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
            <span>Need another path?</span>
            <Link
              href={alternateHref}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {alternateLabel}
            </Link>
          </div>

          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Return to public overview</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
